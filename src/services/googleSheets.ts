import { Peserta, HARGA_KAMBING_OPTIONS } from '../types/qurban';
import { googleLogout } from './googleAuth';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Extracts Google Spreadsheet ID from URL or returns the ID directly.
 * Example URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Regex to extract ID between /d/ and /
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Or check if user supplied just the ID (alphanumeric, hyphens, underscores > 15 chars)
  if (/^[a-zA-Z0-9-_]{15,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

/**
 * Fetches spreadsheet metadata from Google Sheets API
 */
export async function fetchSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetName: string; sheetId: number }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (res.status === 401) {
    await googleLogout();
    throw new Error('AUTH_EXPIRED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Tidak dapat menemukan atau mengakses Google Spreadsheet tersebut. Pastikan ID/URL benar dan akun Anda memiliki izin akses.');
  }

  const data = await res.json();
  const title = data.properties?.title || 'Google Spreadsheet';
  const firstSheet = data.sheets?.[0];
  const sheetName = firstSheet?.properties?.title || 'Sheet1';
  const sheetId = firstSheet?.properties?.sheetId || 0;

  return { title, sheetName, sheetId };
}

/**
 * Formats header and populates all participant rows into Google Sheets
 */
export async function populateSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  sheetId: number,
  pesertaList: Peserta[]
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const headers = [
    'No',
    'Kode Peserta',
    'Nama Peserta',
    'Alamat Lengkap',
    'No WhatsApp',
    'Varian Hewan Kambing (Kode)',
    'Target Biaya (Rp)',
    'Total Terkumpul (Rp)',
    'Sisa Target (Rp)',
    'Status',
    'Progres (%)',
    'Tanggal Daftar',
    'Catatan Niat Qurban'
  ];

  const rows = pesertaList.map((p, idx) => {
    const sisa = Math.max(0, p.targetKurban - p.totalTerkumpul);
    const pct = p.targetKurban > 0 ? Math.round((p.totalTerkumpul / p.targetKurban) * 100) : 0;
    return [
      idx + 1,
      p.kodePeserta,
      p.nama,
      p.alamat,
      p.noHp || '-',
      p.kodeVarian || '-',
      p.targetKurban,
      p.totalTerkumpul,
      sisa,
      p.status,
      `${pct}%`,
      p.tanggalDaftar || '-',
      p.catatanNiat || '-'
    ];
  });

  const values = [headers, ...rows];

  // 1. Clear existing range first to prevent leftover rows
  try {
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A1:Z1000:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (clearRes.status === 401) {
      await googleLogout();
      throw new Error('AUTH_EXPIRED');
    }
  } catch (clearErr) {
    console.warn('Notice clear range:', clearErr);
  }

  // 2. Write values
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `${sheetName}!A1`,
        majorDimension: 'ROWS',
        values
      })
    }
  );

  if (writeRes.status === 401) {
    await googleLogout();
    throw new Error('AUTH_EXPIRED');
  }

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal mengisi data ke Google Sheets.');
  }

  // 3. Batch format header styling (Navy background #0A192F, Gold bold text)
  try {
    const styleRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 10 / 255, green: 25 / 255, blue: 47 / 255 }, // #0A192F Navy
                  textFormat: {
                    foregroundColor: { red: 212 / 255, green: 175 / 255, blue: 55 / 255 }, // #D4AF37 Gold
                    bold: true,
                    fontSize: 10
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length
              }
            }
          }
        ]
      })
    });
    if (styleRes.status === 401) {
      await googleLogout();
      throw new Error('AUTH_EXPIRED');
    }
  } catch (styleErr) {
    console.warn('Styling header optional notice:', styleErr);
  }
}

/**
 * Reads participant rows from an existing Google Sheet tab and converts them to Peserta objects.
 */
export async function readSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetName?: string
): Promise<Peserta[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const targetSheet = sheetName || 'Sheet1';

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(targetSheet)}!A1:M500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (res.status === 401) {
    await googleLogout();
    throw new Error('AUTH_EXPIRED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membaca data dari Google Spreadsheet.');
  }

  const json = await res.json();
  const rows: any[][] = json.values || [];
  if (rows.length <= 1) {
    return [];
  }

  // Row 0 is header, parse from row 1 onwards
  const pesertaList: Peserta[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || !r[2]) continue; // Skip empty row or missing name

    const kodePeserta = r[1] || `ROQ-${String(i).padStart(3, '0')}`;
    const nama = String(r[2]).trim();
    const alamat = r[3] ? String(r[3]).trim() : '-';
    const noHp = r[4] ? String(r[4]).trim() : '-';
    // Parse varian
    const rawVarian = r[5] ? String(r[5]).trim() : 'V02';
    const foundVarian = HARGA_KAMBING_OPTIONS.find(v => v.kode === rawVarian) || 
                        HARGA_KAMBING_OPTIONS.find(v => v.grade === rawVarian) ||
                        HARGA_KAMBING_OPTIONS[1]; // Default to V02

    const namaVarian = foundVarian.grade;
    const kodeVarian = foundVarian.kode;
    
    // Parse target biaya
    const targetKurban = Number(String(r[6] || '').replace(/[^0-9]/g, '')) || foundVarian.value;
    const totalTerkumpul = Number(String(r[7] || '').replace(/[^0-9]/g, '')) || 0;
    const status = (totalTerkumpul >= targetKurban || String(r[9]).toLowerCase().includes('lunas')) ? 'Lunas' : 'Dalam Proses';
    const tanggalDaftar = r[11] ? String(r[11]).trim() : new Date().toISOString().slice(0, 10);
    const catatanNiat = r[12] ? String(r[12]).trim() : '';

    pesertaList.push({
      id: `p-sheet-${i}-${Date.now()}`,
      kodePeserta,
      nama,
      alamat,
      noHp,
      varianHarga: targetKurban,
      namaVarian,
      kodeVarian,
      targetKurban,
      totalTerkumpul,
      status,
      tanggalDaftar,
      catatanNiat,
      riwayatSetoran: totalTerkumpul > 0 ? [
        {
          id: `set-sheet-${i}`,
          tanggal: tanggalDaftar,
          jumlah: totalTerkumpul,
          metode: 'Transfer Bank',
          keterangan: 'Setoran Tabungan Qurban (Sinkron Google Sheets)',
          penerima: 'Pengurus RIDHO OK',
          nomorKwitansi: `KW-${kodePeserta}-SHEET`
        }
      ] : []
    });
  }

  return pesertaList;
}

/**
 * Populates the 'Varian_Kambing' sheet with available options.
 */
export async function populateVarianKambingSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  sheetName: string = 'Varian_Kambing'
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const headers = ['Kode', 'Nilai', 'Grade', 'Deskripsi'];
  const values = [
    headers,
    ...HARGA_KAMBING_OPTIONS.map((o) => [o.kode, o.value, o.grade, o.deskripsi])
  ];

  // 1. Clear existing range
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A1:D100:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch {}

  // 2. Write values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );
}

/**
 * Reads Varian_Kambing from Google Sheet.
 */
export async function readVarianKambingSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'Varian_Kambing'
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A2:E50`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) return HARGA_KAMBING_OPTIONS;

  const json = await res.json();
  const rows = json.values || [];
  
  if (rows.length === 0) return HARGA_KAMBING_OPTIONS;

  return rows.map((r: any) => {
    const kode = r[0] ? String(r[0]).trim() : 'V01';
    const rawVal = r[1] !== undefined ? String(r[1]).replace(/[^0-9]/g, '') : '0';
    const value = Number(rawVal) || 0;

    const formattedRp = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);

    const gradeVal = r[2] ? String(r[2]).trim() : `Kambing Varian ${kode}`;

    return {
      kode,
      value,
      label: formattedRp, // Price for bottom line (opt.label)
      grade: gradeVal,    // Grade name for top line (opt.grade)
      deskripsi: r[3] ? String(r[3]).trim() : 'Sehat, cukup umur & sesuai syariat qurban'
    };
  });
}

/**
 * Lists Google Sheets files from Google Drive
 */
export async function listDriveSheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (res.status === 401) {
    await googleLogout();
    throw new Error('AUTH_EXPIRED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal memuat daftar Google Sheets dari Google Drive.');
  }

  const json = await res.json();
  return json.files || [];
}

/**
 * Ensures that a specific sheet tab exists in the Google Spreadsheet, creating it if necessary.
 */
async function ensureSheetExists(accessToken: string, spreadsheetId: string, sheetName: string) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return;
  const data = await res.json();
  const sheets = data.sheets || [];
  const exists = sheets.some((s: any) => s.properties?.title === sheetName);
  if (!exists) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }
        ]
      })
    });
  }
}

/**
 * Replicates all deposit history (riwayat setoran) into a dedicated 'Riwayat_Setoran' sheet tab.
 */
export async function populateRiwayatSetoranSheet(
  accessToken: string,
  spreadsheetId: string,
  pesertaList: Peserta[],
  sheetName: string = 'Riwayat_Setoran'
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  await ensureSheetExists(accessToken, cleanId, sheetName);

  const headers = [
    'No',
    'Kode Riwayat Setoran',
    'Kode Peserta',
    'Nama Peserta',
    'No. Kwitansi',
    'Tanggal',
    'Jumlah (Rp)',
    'Metode',
    'Penerima',
    'Keterangan'
  ];

  const rows: any[][] = [];
  let counter = 1;

  for (const p of pesertaList) {
    if (p.riwayatSetoran && p.riwayatSetoran.length > 0) {
      p.riwayatSetoran.forEach((s, sIdx) => {
        const seq = String(sIdx + 1).padStart(2, '0');
        const kodeRiwayat = `${p.kodePeserta}-${seq}`;
        rows.push([
          counter++,
          kodeRiwayat,
          p.kodePeserta,
          p.nama,
          s.nomorKwitansi,
          s.tanggal,
          s.jumlah,
          s.metode,
          s.penerima,
          s.keterangan || '-'
        ]);
      });
    }
  }

  const values = [headers, ...rows];

  // 1. Clear existing range
  try {
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A1:Z1000:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (clearRes.status === 401) {
      await googleLogout();
      throw new Error('AUTH_EXPIRED');
    }
  } catch {}

  // 2. Write values
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `${sheetName}!A1`,
        majorDimension: 'ROWS',
        values
      })
    }
  );

  if (writeRes.status === 401) {
    await googleLogout();
    throw new Error('AUTH_EXPIRED');
  }
}
