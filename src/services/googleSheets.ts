import { Peserta, VarianKambingOption, HARGA_KAMBING_OPTIONS, formatRupiah } from '../types/qurban';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  mimeType?: string;
}

/**
 * Extracts a Google Spreadsheet ID from a URL or raw ID string.
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Regex for spreadsheet URL: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If no URL pattern matched, check if it looks like a direct ID
  if (/^[a-zA-Z0-9-_]{15,80}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Fetches basic metadata (title, first sheet name, sheet ID) for a Google Spreadsheet.
 */
export async function fetchSpreadsheetDetails(
  token: string,
  spreadsheetId: string
): Promise<{ title: string; sheetName: string; sheetId: number }> {
  const cleanId = extractSpreadsheetId(spreadsheetId) || spreadsheetId;
  const isValidRealToken = token && token !== 'active' && token !== 'active-netlify-token' && token !== 'active-vercel-token' && token.length > 20;
  
  if (isValidRealToken) {
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        console.info('Auth token inactive, falling back to public spreadsheet details.');
      } else if (res.ok) {
        const json = await res.json();
        const title = json.properties?.title || 'Google Spreadsheet Qurban';
        const firstSheet = json.sheets?.[0]?.properties;
        const sheetName = firstSheet?.title || 'Data_Peserta';
        const sheetId = firstSheet?.sheetId ?? 0;
        return { title, sheetName, sheetId };
      }
    } catch (err: any) {
      console.warn('Failed to fetch spreadsheet details via API, using fallback:', err);
    }
  }

  // Fallback default
  return {
    title: 'Google Spreadsheet Panitia',
    sheetName: 'Data_Peserta',
    sheetId: 0
  };
}

/**
 * Helper to parse CSV text
 */
function parseCsvRows(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(current.trim());
      if (row.some(col => col.length > 0)) lines.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(col => col.length > 0)) lines.push(row);
  }
  return lines;
}

/**
 * Populates / updates Peserta data in Google Sheets
 */
export async function populateSheetData(
  token: string,
  spreadsheetId: string,
  sheetName: string = 'Data_Peserta',
  sheetId: number = 0,
  pesertaList: Peserta[]
): Promise<void> {
  const cleanId = extractSpreadsheetId(spreadsheetId) || spreadsheetId;
  if (!token) throw new Error('Token Google Access diperlukan untuk menyinkronkan data.');

  const headers = [
    'Kode Peserta',
    'Nama Peserta',
    'Alamat Lengkap',
    'No WhatsApp / HP',
    'Varian Kambing',
    'Target Biaya (Rp)',
    'Total Terkumpul (Rp)',
    'Sisa (Rp)',
    'Status',
    'Tanggal Daftar',
    'Catatan Niat'
  ];

  const rows = pesertaList.map(p => {
    const sisa = Math.max(0, p.targetKurban - p.totalTerkumpul);
    return [
      p.kodePeserta || '',
      p.nama || '',
      p.alamat || '',
      p.noHp || '',
      p.namaVarian || `Rp ${(p.varianHarga || 0).toLocaleString('id-ID')}`,
      p.targetKurban || 0,
      p.totalTerkumpul || 0,
      sisa,
      p.status || 'Dalam Proses',
      p.tanggalDaftar || '',
      p.catatanNiat || ''
    ];
  });

  const values = [headers, ...rows];

  // Call Google Sheets API to update values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetName)}!A1:K${values.length}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (res.status === 401) throw new Error('AUTH_EXPIRED');

  if (!res.ok) {
    const errText = await res.text();
    console.warn('Google Sheets PUT error:', errText);
    if (res.status === 403 || errText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error('Gagal memperbarui sheet data peserta.');
  }
}

/**
 * Reads Peserta data from Google Sheets
 */
export async function readSheetData(
  token: string,
  spreadsheetId: string,
  sheetName: string = 'Data_Peserta'
): Promise<Peserta[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId) || spreadsheetId;

  let rows: string[][] = [];

  const isValidRealToken = token && token !== 'active' && token !== 'active-netlify-token' && token !== 'active-vercel-token' && token.length > 20;

  if (isValidRealToken) {
    try {
      const range = sheetName ? `${encodeURIComponent(sheetName)}!A1:Z500` : 'A1:Z500';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        console.info('Auth token inactive, using public GViz fallback.');
      } else if (res.ok) {
        const json = await res.json();
        rows = json.values || [];
      } else {
        // Fallback: query default range A1:Z500 on first sheet
        const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A1:Z500`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          rows = json.values || [];
        }
      }
    } catch (err: any) {
      console.warn('API fetch failed, trying public gviz fallback...', err);
    }
  }

  // Fallback to gviz CSV if no API rows
  if (rows.length === 0) {
    const sheetsToTry = [sheetName, 'Data_Peserta', 'Data Peserta', 'Peserta', 'Sheet1', ''];
    for (const name of sheetsToTry) {
      try {
        const sheetParam = name ? `&sheet=${encodeURIComponent(name)}` : '';
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv${sheetParam}&t=${Date.now()}`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const csvText = await res.text();
          if (csvText && !csvText.includes('<!DOCTYPE html>')) {
            rows = parseCsvRows(csvText);
            if (rows.length >= 2) break;
          }
        }
      } catch (e) {
        console.warn(`gviz fallback error for sheet ${name}:`, e);
      }
    }
  }

  if (rows.length < 2) return [];

  // Ignore header row
  const dataRows = rows.slice(1);
  const result: Peserta[] = dataRows.map((r, idx) => {
    const kodePeserta = r[0] ? String(r[0]).trim() : `ROQ-${String(idx + 1).padStart(3, '0')}`;
    const nama = r[1] ? String(r[1]).trim() : `Peserta ${idx + 1}`;
    const alamat = r[2] ? String(r[2]).trim() : '-';
    const noHp = r[3] ? String(r[3]).trim() : '-';
    const namaVarian = r[4] ? String(r[4]).trim() : 'Kambing Qurban';
    const rawTarget = r[5] ? String(r[5]).replace(/[^0-9]/g, '') : '3500000';
    const rawTerkumpul = r[6] ? String(r[6]).replace(/[^0-9]/g, '') : '0';
    const targetKurban = Number(rawTarget) || 3500000;
    const totalTerkumpul = Number(rawTerkumpul) || 0;
    const status = r[8] && String(r[8]).toLowerCase().includes('lunas') ? 'Lunas' : (totalTerkumpul >= targetKurban ? 'Lunas' : 'Dalam Proses');
    const tanggalDaftar = r[9] ? String(r[9]).trim() : new Date().toISOString().slice(0, 10);
    const catatanNiat = r[10] ? String(r[10]).trim() : '';

    return {
      id: kodePeserta ? `p-${kodePeserta}` : `p-sheet-${idx + 1}-${Date.now()}`,
      kodePeserta,
      nama,
      alamat,
      noHp,
      varianHarga: targetKurban,
      namaVarian,
      targetKurban,
      totalTerkumpul,
      status,
      tanggalDaftar,
      catatanNiat,
      riwayatSetoran: []
    };
  });

  return result;
}

/**
 * Writes 12 Varian Kambing Options to Varian_Kambing tab ONLY IF EMPTY
 */
export async function populateVarianKambingSheet(
  token: string,
  spreadsheetId: string,
  sheetId?: number,
  options?: VarianKambingOption[]
): Promise<void> {
  const cleanId = extractSpreadsheetId(spreadsheetId) || spreadsheetId;
  if (!token) return;

  // Protect user edits: check if sheet already has values
  try {
    const existing = await readVarianKambingSheet(token, cleanId);
    if (existing && existing.length > 0) {
      // Sheet already has data, never overwrite user prices
      return;
    }
  } catch {}

  const source = options && options.length > 0 ? options : HARGA_KAMBING_OPTIONS;
  const headers = ['Kode', 'Nilai (Rp)', 'Grade / Tipe', 'Deskripsi'];
  const rows = source.map(opt => [
    opt.kode,
    opt.value,
    opt.grade,
    opt.deskripsi
  ]);

  const values = [headers, ...rows];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Varian_Kambing!A1:D${values.length}?valueInputOption=USER_ENTERED`;

  try {
    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });
  } catch (err) {
    console.warn('Error populating varian kambing sheet:', err);
  }
}

/**
 * Reads 12 Varian Kambing Options from Varian_Kambing tab
 */
export async function readVarianKambingSheet(
  token: string,
  spreadsheetId: string
): Promise<VarianKambingOption[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId) || spreadsheetId;
  let rows: string[][] = [];

  const isValidRealToken = token && token !== 'active' && token !== 'active-netlify-token' && token !== 'active-vercel-token' && token.length > 20;

  if (isValidRealToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Varian_Kambing!A1:D50?t=${Date.now()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-cache'
      });
      if (res.ok) {
        const json = await res.json();
        rows = json.values || [];
      }
    } catch {}
  }

  if (rows.length === 0) {
    // Prioritize exact match
    const sheetsToTry = ['Varian_Kambing', 'Varian Kambing', 'Varian', 'Sheet1', ''];
    for (const sheetName of sheetsToTry) {
      try {
        const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv${sheetParam}&t=${Date.now()}`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const csvText = await res.text();
          if (csvText && !csvText.includes('<!DOCTYPE html>')) {
            const parsed = parseCsvRows(csvText);
            // Verify if it looks like Varian Kambing data (has headers/values)
            if (parsed.length >= 2) {
              rows = parsed;
              break; // Found it
            }
          }
        }
      } catch (e) {
        console.warn(`gviz fallback error for sheet ${sheetName}:`, e);
      }
    }
  }

  if (rows.length < 2) return HARGA_KAMBING_OPTIONS;

  const dataRows = rows.slice(1);
  const result: VarianKambingOption[] = dataRows.map((r, idx) => {
    const kode = r[0] ? String(r[0]).trim() : `V${String(idx + 1).padStart(2, '0')}`;
    const rawVal = r[1] ? String(r[1]).replace(/[^0-9]/g, '') : '0';
    const value = Number(rawVal) || HARGA_KAMBING_OPTIONS[idx]?.value || 3000000;
    const grade = r[2] ? String(r[2]).trim() : HARGA_KAMBING_OPTIONS[idx]?.grade || `Kambing Tipe ${kode}`;
    const deskripsi = r[3] ? String(r[3]).trim() : HARGA_KAMBING_OPTIONS[idx]?.deskripsi || 'Sehat & sesuai syariat qurban';

    return {
      kode,
      value,
      label: formatRupiah(value),
      grade,
      deskripsi
    };
  });

  return result.length > 0 ? result : HARGA_KAMBING_OPTIONS;
}

/**
 * Writes Riwayat Setoran to Riwayat_Setoran tab
 */
export async function populateRiwayatSetoranSheet(
  token: string,
  spreadsheetId: string,
  pesertaList: Peserta[]
): Promise<void> {
  const cleanId = extractSpreadsheetId(spreadsheetId) || spreadsheetId;
  if (!token) return;

  const headers = ['Kode Peserta', 'Nama Peserta', 'No Kwitansi', 'Tanggal Setor', 'Nominal (Rp)', 'Metode', 'Keterangan', 'Penerima / Pengurus'];
  const rows: any[] = [];

  pesertaList.forEach(p => {
    if (p.riwayatSetoran && p.riwayatSetoran.length > 0) {
      p.riwayatSetoran.forEach(s => {
        rows.push([
          p.kodePeserta,
          p.nama,
          s.nomorKwitansi || '-',
          s.tanggal,
          s.jumlah,
          s.metode,
          s.keterangan || '-',
          s.penerima || 'Pengurus'
        ]);
      });
    }
  });

  const values = [headers, ...rows];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Riwayat_Setoran!A1:H${values.length + 1}?valueInputOption=USER_ENTERED`;

  try {
    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });
  } catch (err) {
    console.warn('Error populating setoran sheet:', err);
  }
}

/**
 * Reads Riwayat Setoran from Riwayat_Setoran tab
 */
export async function readRiwayatSetoranSheet(
  token: string,
  spreadsheetId: string
): Promise<Record<string, any[]>> {
  const cleanId = extractSpreadsheetId(spreadsheetId) || spreadsheetId;
  const historyMap: Record<string, any[]> = {};
  let rows: string[][] = [];

  const isValidRealToken = token && token !== 'active' && token !== 'active-netlify-token' && token !== 'active-vercel-token' && token.length > 20;

  if (isValidRealToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Riwayat_Setoran!A1:H5000`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        rows = json.values || [];
      }
    } catch (e) {
      console.warn('Error reading riwayat setoran via API:', e);
    }
  }

  // Fallback to gviz CSV if no API rows
  if (rows.length === 0) {
    const sheetsToTry = ['Riwayat_Setoran', 'Riwayat Setoran', 'Setoran', 'History'];
    for (const name of sheetsToTry) {
      try {
        const sheetParam = `&sheet=${encodeURIComponent(name)}`;
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv${sheetParam}&t=${Date.now()}`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const csvText = await res.text();
          if (csvText && !csvText.includes('<!DOCTYPE html>')) {
            const parsed = parseCsvRows(csvText);
            if (parsed.length >= 2) {
              rows = parsed;
              break;
            }
          }
        }
      } catch (e) {
        console.warn(`gviz setoran fallback error for sheet ${name}:`, e);
      }
    }
  }

  if (rows.length > 1) {
    rows.slice(1).forEach((r: string[]) => {
      const kodePeserta = r[0] ? String(r[0]).trim() : '';
      if (!kodePeserta) return;
      if (!historyMap[kodePeserta]) historyMap[kodePeserta] = [];
      historyMap[kodePeserta].push({
        id: `s-${Date.now()}-${Math.random()}`,
        nomorKwitansi: r[2] ? String(r[2]).trim() : '-',
        tanggal: r[3] ? String(r[3]).trim() : new Date().toISOString().slice(0, 10),
        jumlah: Number(r[4]?.replace(/[^0-9]/g, '') || 0),
        metode: r[5] ? String(r[5]).trim() : 'Tunai',
        keterangan: r[6] ? String(r[6]).trim() : '-',
        penerima: r[7] ? String(r[7]).trim() : 'Pengurus'
      });
    });
  }

  return historyMap;
}

/**
 * Lists Google Spreadsheets in user's Google Drive
 */
export async function listDriveSheets(token: string): Promise<DriveSpreadsheetFile[]> {
  if (!token) {
    return [];
  }

  try {
    const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime,mimeType)&pageSize=30&orderBy=modifiedTime%20desc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED');
    }

    if (res.ok) {
      const json = await res.json();
      return (json.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
        mimeType: f.mimeType
      }));
    }
  } catch (err: any) {
    if (err.message === 'AUTH_EXPIRED') {
      throw err;
    }
    console.warn('Error fetching Drive sheets:', err);
  }

  return [];
}
