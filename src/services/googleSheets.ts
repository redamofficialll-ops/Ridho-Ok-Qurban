import { Peserta, VarianKambingOption, HARGA_KAMBING_OPTIONS } from '../types/qurban';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (!trimmed.includes('/') && trimmed.length > 20) {
    return trimmed;
  }
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}

export async function fetchSpreadsheetDetails(token: string, spreadsheetId: string): Promise<{ title: string; sheetName: string; sheetId: number }> {
  if (token && token.includes('mock')) {
    return { title: 'Google Spreadsheet Panitia (Terhubung)', sheetName: 'Data_Peserta', sheetId: 0 };
  }
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (token && token.includes('mock')) {
        return { title: 'Google Spreadsheet Panitia (Terhubung)', sheetName: 'Data_Peserta', sheetId: 0 };
      }
      throw new Error('AUTH_EXPIRED');
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Gagal membaca detail spreadsheet. Periksa akses akun Anda.');
  }

  const data = await res.json();
  const title = data.properties?.title || 'Google Spreadsheet';
  const firstSheet = data.sheets?.[0]?.properties;
  const sheetName = firstSheet?.title || 'Data_Peserta';
  const sheetId = firstSheet?.sheetId || 0;

  return { title, sheetName, sheetId };
}

export async function listDriveSheets(token: string): Promise<DriveSpreadsheetFile[]> {
  if (token && token.includes('mock')) {
    return [
      { id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', name: 'Data Tabungan Qurban Ridho OK (Utama)', modifiedTime: new Date().toISOString() },
      { id: '1SampleSpreadsheetIdForTestingQurban2027', name: 'Rekapitulasi Setoran Jamaah Qurban', modifiedTime: new Date().toISOString() }
    ];
  }
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (token && token.includes('mock')) return [];
      throw new Error('AUTH_EXPIRED');
    }
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

export async function populateSheetData(token: string, spreadsheetId: string, sheetName: string, sheetId: number, pesertaList: Peserta[]): Promise<void> {
  if (token && token.includes('mock')) {
    return; // Simulated success
  }
  const headers = [
    "Kode Peserta",
    "Nama Lengkap",
    "Alamat",
    "No WhatsApp",
    "Varian Kambing",
    "Target Kurban (Rp)",
    "Total Terkumpul (Rp)",
    "Status",
    "Tanggal Daftar",
    "Catatan Niat / Doa"
  ];

  const rows = pesertaList.map(p => [
    p.kodePeserta || '',
    p.nama || '',
    p.alamat || '',
    p.noHp || '',
    p.kodeVarian || 'V1',
    p.targetKurban || 0,
    p.totalTerkumpul || 0,
    p.status || 'Dalam Proses',
    p.tanggalDaftar || '',
    p.catatanNiat || ''
  ]);

  const values = [headers, ...rows];

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (token && token.includes('mock')) return;
      throw new Error('AUTH_EXPIRED');
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Gagal menulis data ke spreadsheet.');
  }
}

export async function readSheetData(token: string, spreadsheetId: string, sheetName: string): Promise<Peserta[]> {
  if (token && token.includes('mock')) {
    return [];
  }
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:K500`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (token && token.includes('mock')) return [];
      throw new Error('AUTH_EXPIRED');
    }
    throw new Error('Gagal membaca data dari spreadsheet.');
  }

  const data = await res.json();
  const rows = data.values;
  if (!rows || rows.length <= 1) return [];

  const dataRows = rows.slice(1);
  const result: Peserta[] = [];

  dataRows.forEach((r: any[], idx: number) => {
    if (!r[1]) return;
    const target = Number(r[5]) || 4500000;
    const terkumpul = Number(r[6]) || 0;
    result.push({
      id: `imported-${idx + 1}-${Date.now()}`,
      kodePeserta: r[0] || `ROQ-${String(idx + 1).padStart(3, '0')}`,
      nama: r[1] || '',
      alamat: r[2] || '',
      noHp: r[3] || '-',
      kodeVarian: r[4] || 'V1',
      varianHarga: target,
      namaVarian: `Rp ${target.toLocaleString('id-ID')} (Kambing Varian)`,
      targetKurban: target,
      totalTerkumpul: terkumpul,
      status: terkumpul >= target ? 'Lunas' : 'Dalam Proses',
      tanggalDaftar: r[8] || new Date().toISOString().slice(0, 10),
      catatanNiat: r[9] || '',
      riwayatSetoran: []
    });
  });

  return result;
}

export async function populateVarianKambingSheet(token: string, spreadsheetId: string, sheetId: number): Promise<void> {
  const sheetName = "Varian_Kambing";
  const headers = ["Kode Varian", "Label", "Grade", "Harga (Rp)", "Deskripsi"];
  const rows = HARGA_KAMBING_OPTIONS.map(v => [
    v.kode,
    v.label,
    v.grade,
    v.value,
    v.deskripsi
  ]);

  const values = [headers, ...rows];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: 'ROWS',
      values
    })
  }).catch(() => {});
}

export async function readVarianKambingSheet(token: string, spreadsheetId: string): Promise<VarianKambingOption[]> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Varian_Kambing!A1:E20`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) return HARGA_KAMBING_OPTIONS;
    const data = await res.json();
    const rows = data.values;
    if (!rows || rows.length <= 1) return HARGA_KAMBING_OPTIONS;

    const options: VarianKambingOption[] = rows.slice(1).map((r: any[]) => ({
      kode: r[0] || 'V1',
      label: r[1] || '',
      grade: r[2] || '',
      value: Number(r[3]) || 4500000,
      deskripsi: r[4] || ''
    }));

    return options.length > 0 ? options : HARGA_KAMBING_OPTIONS;
  } catch {
    return HARGA_KAMBING_OPTIONS;
  }
}

export async function populateRiwayatSetoranSheet(token: string, spreadsheetId: string, pesertaList: Peserta[]): Promise<void> {
  const sheetName = "Riwayat_Setoran";
  const headers = ["ID Setoran", "Kode Peserta", "Nama Peserta", "Jumlah (Rp)", "Tanggal", "Metode", "Penerima"];
  const rows: any[] = [];

  pesertaList.forEach(p => {
    if (p.riwayatSetoran && p.riwayatSetoran.length > 0) {
      p.riwayatSetoran.forEach(s => {
        rows.push([
          s.id,
          p.kodePeserta,
          p.nama,
          s.jumlah,
          s.tanggal,
          s.metode,
          s.penerima
        ]);
      });
    }
  });

  const values = [headers, ...rows];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: 'ROWS',
      values
    })
  }).catch(() => {});
}
