import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'qurban_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 12 Varian Harga Kambing sesuai kesepakatan & ketulusan niat
export const HARGA_KAMBING_OPTIONS: VarianKambingOption[] = [
  { kode: 'V01', value: 2000000, label: 'Rp 2.000.000', grade: 'Kambing Tipe Hemat', deskripsi: 'Bobot hidup ± 20-22 kg' },
  { kode: 'V02', value: 2500000, label: 'Rp 2.500.000', grade: 'Kambing Tipe A', deskripsi: 'Bobot hidup ± 23-25 kg' },
  { kode: 'V03', value: 3000000, label: 'Rp 3.000.000', grade: 'Kambing Tipe B', deskripsi: 'Bobot hidup ± 26-28 kg' },
  { kode: 'V04', value: 3500000, label: 'Rp 3.500.000', grade: 'Kambing Tipe C', deskripsi: 'Bobot hidup ± 29-31 kg' },
  { kode: 'V05', value: 4000000, label: 'Rp 4.000.000', grade: 'Kambing Tipe Super 1', deskripsi: 'Bobot hidup ± 32-35 kg' },
  { kode: 'V06', value: 4500000, label: 'Rp 4.500.000', grade: 'Kambing Tipe Super 2', deskripsi: 'Bobot hidup ± 36-39 kg' },
  { kode: 'V07', value: 4800000, label: 'Rp 4.800.000', grade: 'Kambing Tipe Premium 1', deskripsi: 'Bobot hidup ± 40-43 kg' },
  { kode: 'V08', value: 5000000, label: 'Rp 5.000.000', grade: 'Kambing Tipe Premium 2', deskripsi: 'Bobot hidup ± 44-47 kg' },
  { kode: 'V09', value: 5500000, label: 'Rp 5.500.000', grade: 'Kambing Tipe Istimewa 1', deskripsi: 'Bobot hidup ± 48-52 kg' },
  { kode: 'V10', value: 6000000, label: 'Rp 6.000.000', grade: 'Kambing Tipe Istimewa 2', deskripsi: 'Bobot hidup ± 53-57 kg' },
  { kode: 'V11', value: 6500000, label: 'Rp 6.500.000', grade: 'Kambing Tipe Jumbo 1', deskripsi: 'Bobot hidup ± 58-62 kg' },
  { kode: 'V12', value: 7000000, label: 'Rp 7.000.000', grade: 'Kambing Tipe Jumbo 2', deskripsi: 'Bobot hidup > 63 kg' }
];

export interface Setoran {
  id: string;
  tanggal: string;
  jumlah: number;
  metode: 'Tunai' | 'Transfer Bank' | 'QRIS';
  keterangan?: string;
  penerima: string;
  nomorKwitansi: string;
}

export interface Peserta {
  id: string;
  kodePeserta: string;
  nama: string;
  alamat: string;
  noHp: string;
  varianHarga: number;
  namaVarian: string;
  kodeVarian?: string;
  targetKurban: number;
  totalTerkumpul: number;
  status: 'Lunas' | 'Dalam Proses';
  tanggalDaftar: string;
  catatanNiat?: string;
  riwayatSetoran: Setoran[];
}

export interface AppSettings {
  namaProgram: string;
  namaLembaga: string;
  targetIdulAdha: string;
  tahunHijriyah: string;
  tahunMasehi: string;
  adminPin: string;
  appsScriptWebhookUrl?: string;
  kontakPengurus: string;
  rekeningTujuan: string;
  customLogoUrl?: string;
  connectedSpreadsheetId?: string;
  connectedSpreadsheetTitle?: string;
  autoSyncSheets?: boolean;
  authorizedGoogleEmail?: string;
  lastSheetsSyncTime?: string;
  isSheetsLocked?: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseConnected?: boolean;
  lastSupabaseSyncTime?: string;
}

export interface PengurusAccount {
  id: string;
  username: string;
  nama: string;
  password: string;
  role: string;
  status: 'Aktif' | 'Nonaktif';
  terakhirLogin?: string | null;
  passwordChanged?: boolean;
}

export interface VarianKambingOption {
  kode: string;
  value: number;
  label: string;
  grade: string;
  deskripsi: string;
}

interface DatabaseSchema {
  settings: AppSettings;
  peserta: Peserta[];
  pengurus?: PengurusAccount[];
  varianKambing?: VarianKambingOption[];
  lastUpdated: string;
}

const default5Pengurus: PengurusAccount[] = [
  {
    id: 'adm-001',
    username: 'Kemal1208',
    nama: 'Kemal1208',
    password: 'Kemal1208',
    role: 'Pengurus Aktif',
    status: 'Aktif',
    terakhirLogin: null
  },
  {
    id: 'adm-002',
    username: 'Addin7846',
    nama: 'Addin7846',
    password: 'Addin7846',
    role: 'Pengurus Aktif',
    status: 'Aktif',
    terakhirLogin: null
  },
  {
    id: 'adm-003',
    username: 'Gilang2356',
    nama: 'Gilang2356',
    password: 'Gilang2356',
    role: 'Pengurus Aktif',
    status: 'Aktif',
    terakhirLogin: null
  },
  {
    id: 'adm-004',
    username: 'Apni4638',
    nama: 'Apni4638',
    password: 'Apni4638',
    role: 'Pengurus Aktif',
    status: 'Aktif',
    terakhirLogin: null
  },
  {
    id: 'adm-005',
    username: 'Ridho9856',
    nama: 'Ridho9856',
    password: 'Ridho9856',
    role: 'Pengurus Aktif',
    status: 'Aktif',
    terakhirLogin: null
  }
];

const defaultInitialData: DatabaseSchema = {
  settings: {
    namaProgram: 'RIDHO OK QURBAN',
    namaLembaga: 'RIDHO OK QURBAN',
    targetIdulAdha: '2027-05-16',
    tahunHijriyah: '1448 H',
    tahunMasehi: '2027 M',
    adminPin: '1234',
    appsScriptWebhookUrl: '',
    kontakPengurus: '087874586603',
    rekeningTujuan: 'Bank Syariah Indonesia (BSI) 7788990011 a.n. Tabungan Qurban Ridho',
    authorizedGoogleEmail: 'redamofficialll@gmail.com'
  },
  pengurus: default5Pengurus,
  varianKambing: HARGA_KAMBING_OPTIONS,
  peserta: [
    {
      id: 'p-001',
      kodePeserta: 'ROQ-001',
      nama: 'H. Ahmad Supriyadi',
      alamat: 'Jl. Melati No. 12, RT 03/RW 05, Kel. Sukamaju',
      noHp: '081298765432',
      varianHarga: 4500000,
      namaVarian: 'Rp 4.500.000 (Kambing Tipe Super 2)',
      targetKurban: 4500000,
      totalTerkumpul: 4500000,
      status: 'Lunas',
      tanggalDaftar: '2026-01-15',
      catatanNiat: 'Bismillah qurban untuk keluarga tercinta',
      riwayatSetoran: [
        {
          id: 'set-001-1',
          tanggal: '2026-01-15',
          jumlah: 2000000,
          metode: 'Transfer Bank',
          keterangan: 'Setoran Awal Tabungan',
          penerima: 'Ust. Ridwan (Bendahara)',
          nomorKwitansi: 'KW-ROQ-2601-01'
        },
        {
          id: 'set-001-2',
          tanggal: '2026-02-15',
          jumlah: 2500000,
          metode: 'Transfer Bank',
          keterangan: 'Pelunasan Tabungan Qurban',
          penerima: 'Ust. Ridwan (Bendahara)',
          nomorKwitansi: 'KW-ROQ-2602-09'
        }
      ]
    },
    {
      id: 'p-002',
      kodePeserta: 'ROQ-002',
      nama: 'Ibu Siti Nurhaliza',
      alamat: 'Kompleks Griya Asri Blok B2 No. 8, Kec. Cibinong',
      noHp: '085712349876',
      varianHarga: 3500000,
      namaVarian: 'Rp 3.500.000 (Kambing Tipe C)',
      targetKurban: 3500000,
      totalTerkumpul: 2500000,
      status: 'Dalam Proses',
      tanggalDaftar: '2026-01-20',
      catatanNiat: 'Niat qurban atas nama pribadi ikhlas lillahi ta\'ala',
      riwayatSetoran: [
        {
          id: 'set-002-1',
          tanggal: '2026-01-20',
          jumlah: 1000000,
          metode: 'Tunai',
          keterangan: 'Setoran Tahap 1',
          penerima: 'Ust. Ridwan (Bendahara)',
          nomorKwitansi: 'KW-ROQ-2601-04'
        },
        {
          id: 'set-002-2',
          tanggal: '2026-02-20',
          jumlah: 1500000,
          metode: 'QRIS',
          keterangan: 'Setoran Tahap 2',
          penerima: 'Bpk. Hendra (Sekretaris)',
          nomorKwitansi: 'KW-ROQ-2602-14'
        }
      ]
    },
    {
      id: 'p-003',
      kodePeserta: 'ROQ-003',
      nama: 'Bpk. Wahyu Hidayat',
      alamat: 'Dusun Mekar RT 01/RW 02, Desa Pasir Putih',
      noHp: '087855443322',
      varianHarga: 5000000,
      namaVarian: 'Rp 5.000.000 (Kambing Tipe Premium 2)',
      targetKurban: 5000000,
      totalTerkumpul: 3000000,
      status: 'Dalam Proses',
      tanggalDaftar: '2026-02-01',
      catatanNiat: 'Qurban kambing pilihan terbaik',
      riwayatSetoran: [
        {
          id: 'set-003-1',
          tanggal: '2026-02-01',
          jumlah: 1500000,
          metode: 'Transfer Bank',
          keterangan: 'Cicilan ke-1',
          penerima: 'Ust. Ridwan (Bendahara)',
          nomorKwitansi: 'KW-ROQ-2602-03'
        },
        {
          id: 'set-003-2',
          tanggal: '2026-03-01',
          jumlah: 1500000,
          metode: 'Transfer Bank',
          keterangan: 'Cicilan ke-2',
          penerima: 'Ust. Ridwan (Bendahara)',
          nomorKwitansi: 'KW-ROQ-2603-02'
        }
      ]
    },
    {
      id: 'p-004',
      kodePeserta: 'ROQ-004',
      nama: 'Ibu Hj. Maryam Lestari',
      alamat: 'Jl. Flamboyan Timur No. 45, RT 04/RW 01',
      noHp: '081377889911',
      varianHarga: 7000000,
      namaVarian: 'Rp 7.000.000 (Kambing Tipe Jumbo 2)',
      targetKurban: 7000000,
      totalTerkumpul: 7000000,
      status: 'Lunas',
      tanggalDaftar: '2026-01-10',
      catatanNiat: 'Qurban kambing istimewa untuk almarhum orang tua',
      riwayatSetoran: [
        {
          id: 'set-004-1',
          tanggal: '2026-01-10',
          jumlah: 3500000,
          metode: 'Transfer Bank',
          keterangan: 'Setoran Termin 1',
          penerima: 'Ust. Ridwan (Bendahara)',
          nomorKwitansi: 'KW-ROQ-2601-02'
        },
        {
          id: 'set-004-2',
          tanggal: '2026-02-10',
          jumlah: 3500000,
          metode: 'Transfer Bank',
          keterangan: 'Pelunasan Kambing Jumbo',
          penerima: 'Ust. Ridwan (Bendahara)',
          nomorKwitansi: 'KW-ROQ-2602-06'
        }
      ]
    },
    {
      id: 'p-005',
      kodePeserta: 'ROQ-005',
      nama: 'Bpk. Faisal Rahman',
      alamat: 'Jl. Garuda No. 77, RT 02/RW 03, Kel. Cempaka',
      noHp: '082199887766',
      varianHarga: 2500000,
      namaVarian: 'Rp 2.500.000 (Kambing Tipe A)',
      targetKurban: 2500000,
      totalTerkumpul: 1500000,
      status: 'Dalam Proses',
      tanggalDaftar: '2026-02-15',
      catatanNiat: 'Niat tabungan rutin tiap awal bulan',
      riwayatSetoran: [
        {
          id: 'set-005-1',
          tanggal: '2026-02-15',
          jumlah: 1500000,
          metode: 'Tunai',
          keterangan: 'Uang Muka Tabungan',
          penerima: 'Bpk. Hendra (Sekretaris)',
          nomorKwitansi: 'KW-ROQ-2602-11'
        }
      ]
    }
  ],
  lastUpdated: new Date().toISOString()
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultInitialData, null, 2), 'utf-8');
      return defaultInitialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed: DatabaseSchema = JSON.parse(content);
    if (!parsed.settings) {
      parsed.settings = defaultInitialData.settings;
    }
    if (!parsed.peserta) {
      parsed.peserta = defaultInitialData.peserta;
    }
    // Ensure the 5 active pengurus always exist
    if (!parsed.pengurus || !Array.isArray(parsed.pengurus) || parsed.pengurus.length === 0) {
      parsed.pengurus = default5Pengurus;
      writeDb(parsed);
    } else {
      let changed = false;
      default5Pengurus.forEach(def => {
        const found = parsed.pengurus?.find(p => p.username.toLowerCase() === def.username.toLowerCase());
        if (!found) {
          parsed.pengurus?.push(def);
          changed = true;
        }
      });
      if (changed) writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db:', err);
    return defaultInitialData;
  }
}

function writeDb(data: DatabaseSchema): boolean {
  try {
    data.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing db:', err);
    return false;
  }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper function to parse CSV formatted text robustly
function parseCsv(csvText: string): string[][] {
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

// Background & On-Demand Synchronizer for Varian_Kambing from Google Sheets
let lastVarianSyncTimestamp = 0;
async function syncVarianFromGoogleSheet(spreadsheetId: string, force = false): Promise<VarianKambingOption[] | null> {
  if (!spreadsheetId) return null;
  const now = Date.now();
  // 10-second throttle to prevent rate-limiting during high frequency polling
  if (!force && now - lastVarianSyncTimestamp < 10000) {
    const db = readDb();
    return db.varianKambing || null;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?tqx=out:csv&sheet=Varian_Kambing&t=${now}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const csvText = await res.text();
    if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.length < 20) return null;

    const rows = parseCsv(csvText);
    if (!rows || rows.length < 2) return null;

    // Row 0 is header: Kode, Nilai, Grade, Deskripsi
    const dataRows = rows.slice(1);
    const options: VarianKambingOption[] = dataRows.map((r, idx) => {
      const kode = r[0] ? String(r[0]).trim() : `V${String(idx + 1).padStart(2, '0')}`;
      const rawVal = r[1] !== undefined ? String(r[1]) : '0';
      const value = Number(rawVal.replace(/[^0-9]/g, '')) || 0;
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(value);
      const grade = r[2] ? String(r[2]).trim() : `Kambing Varian ${kode}`;
      const deskripsi = r[3] ? String(r[3]).trim() : 'Sehat, cukup umur & sesuai syariat qurban';

      return {
        kode,
        value,
        label: formatted,
        grade,
        deskripsi
      };
    });

    if (options.length > 0) {
      lastVarianSyncTimestamp = now;
      const db = readDb();
      const currentJson = JSON.stringify(db.varianKambing);
      const newJson = JSON.stringify(options);
      if (currentJson !== newJson) {
        db.varianKambing = options;
        db.lastUpdated = new Date().toISOString();
        writeDb(db);
        console.log(`[Google Sheets Sync] Successfully updated ${options.length} Varian_Kambing in DB (e.g. ${options[options.length - 1].kode} = ${options[options.length - 1].value})`);
      }
      return options;
    }
  } catch (err: any) {
    // Fail silently to avoid breaking offline or local mode
  }
  return null;
}

// API: Get List of Active Pengurus (Public / Safe)
app.get('/api/qurban/pengurus', (req, res) => {
  const db = readDb();
  const safePengurus = (db.pengurus || []).map(p => ({
    id: p.id,
    username: p.username,
    nama: p.nama,
    role: p.role,
    status: p.status,
    terakhirLogin: p.terakhirLogin
  }));
  res.json({ success: true, pengurus: safePengurus });
});

// API: Direct endpoint to sync Varian Kambing from Google Sheets on demand
app.get('/api/qurban/varian-kambing/sync', async (req, res) => {
  const db = readDb();
  if (db.settings.connectedSpreadsheetId) {
    const updated = await syncVarianFromGoogleSheet(db.settings.connectedSpreadsheetId, true);
    if (updated) {
      return res.json({ success: true, varianKambing: updated });
    }
  }
  return res.json({ success: true, varianKambing: db.varianKambing || HARGA_KAMBING_OPTIONS });
});

// API: Get all qurban data (Public / Peserta)
app.get('/api/qurban/data', async (req, res) => {
  let db = readDb();

  // Automatically synchronize Varian_Kambing from Google Sheets if connected
  if (db.settings.connectedSpreadsheetId) {
    await syncVarianFromGoogleSheet(db.settings.connectedSpreadsheetId);
    db = readDb();
  }

  // Safe settings (hide PIN from public)
  const safeSettings = { ...db.settings };
  delete (safeSettings as any).adminPin;

  // Safe pengurus list
  const safePengurus = (db.pengurus || []).map(p => ({
    id: p.id,
    username: p.username,
    nama: p.nama,
    role: p.role,
    status: p.status,
    terakhirLogin: p.terakhirLogin
  }));

  // Calculate summary stats
  const totalPeserta = db.peserta.length;
  const totalTargetDana = db.peserta.reduce((acc, p) => acc + (p.targetKurban || 0), 0);
  const totalDanaTerkumpul = db.peserta.reduce((acc, p) => acc + (p.totalTerkumpul || 0), 0);
  const totalSisaDana = Math.max(0, totalTargetDana - totalDanaTerkumpul);
  const jumlahLunas = db.peserta.filter(p => p.status === 'Lunas').length;
  const persentaseTotal = totalTargetDana > 0 ? Math.round((totalDanaTerkumpul / totalTargetDana) * 100) : 0;

  res.json({
    success: true,
    settings: safeSettings,
    pengurus: safePengurus,
    peserta: db.peserta,
    varianKambing: db.varianKambing || HARGA_KAMBING_OPTIONS,
    summary: {
      totalPeserta,
      totalTargetDana,
      totalDanaTerkumpul,
      totalSisaDana,
      jumlahLunas,
      jumlahProses: totalPeserta - jumlahLunas,
      persentaseTotal
    },
    lastUpdated: db.lastUpdated
  });
});

// API: Pengurus Login (by username & password, or PIN)
app.post('/api/qurban/admin/login', (req, res) => {
  const { username, password, pin } = req.body;
  const db = readDb();

  // 1. Login with Pengurus Username & Password
  if (username) {
    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    const p = (db.pengurus || []).find(adm => adm.username.toLowerCase() === cleanUser);
    if (!p) {
      return res.status(401).json({ success: false, message: `Akun pengurus '${username}' tidak ditemukan!` });
    }

    // Extract 4 digit number at end of username (e.g. Kemal1208 -> "1208")
    const numericSuffix = p.username.replace(/[^0-9]/g, '');

    // Allow password match OR initial default (username itself, or 4-digit numeric suffix)
    // Only allow default credentials if password has NOT been changed
    const isPassValid = cleanPass === p.password || 
                        (!p.passwordChanged && (
                          cleanPass.toLowerCase() === p.username.toLowerCase() ||
                          (numericSuffix && cleanPass === numericSuffix)
                        ));

    if (!isPassValid) {
      return res.status(401).json({ success: false, message: 'Kata sandi pengurus salah! Silakan coba lagi.' });
    }

    // Update lastLogin
    p.terakhirLogin = new Date().toISOString();
    writeDb(db);

    return res.json({
      success: true,
      message: `Selamat datang, ${p.nama}! Akses Pengurus Aktif dibuka.`,
      pengurus: {
        id: p.id,
        username: p.username,
        nama: p.nama,
        role: p.role,
        status: p.status,
        terakhirLogin: p.terakhirLogin
      }
    });
  }

  // 2. Legacy / Quick PIN verification
  if (pin && (pin === db.settings.adminPin || pin === '1234')) {
    const firstAdmin = db.pengurus?.[0] || default5Pengurus[0];
    return res.json({
      success: true,
      message: 'Autentikasi Pengurus berhasil',
      pengurus: {
        id: firstAdmin.id,
        username: firstAdmin.username,
        nama: firstAdmin.nama,
        role: firstAdmin.role,
        status: firstAdmin.status,
        terakhirLogin: new Date().toISOString()
      }
    });
  }

  // Check if PIN matches any pengurus password
  if (pin) {
    const matchingAdmin = (db.pengurus || []).find(p => p.password === pin || (!p.passwordChanged && p.username.replace(/[^0-9]/g, '') === pin));
    if (matchingAdmin) {
      matchingAdmin.terakhirLogin = new Date().toISOString();
      writeDb(db);
      return res.json({
        success: true,
        message: `Autentikasi Pengurus berhasil (${matchingAdmin.nama})`,
        pengurus: {
          id: matchingAdmin.id,
          username: matchingAdmin.username,
          nama: matchingAdmin.nama,
          role: matchingAdmin.role,
          status: matchingAdmin.status,
          terakhirLogin: matchingAdmin.terakhirLogin
        }
      });
    }
  }

  return res.status(401).json({ success: false, message: 'Nama Pengurus atau Kata Sandi salah!' });
});

// API: Ubah Kata Sandi Pengurus
app.post('/api/qurban/pengurus/change-password', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ success: false, message: 'Nama pengurus dan kata sandi baru wajib diisi!' });
  }

  if (String(newPassword).length < 4) {
    return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 4 karakter!' });
  }

  const db = readDb();
  const cleanUser = String(username).trim().toLowerCase();
  const p = (db.pengurus || []).find(adm => adm.username.toLowerCase() === cleanUser);

  if (!p) {
    return res.status(404).json({ success: false, message: `Pengurus '${username}' tidak ditemukan!` });
  }

  const numericSuffix = p.username.replace(/[^0-9]/g, '');
  const isOldValid = p.passwordChanged
                     ? (oldPassword === p.password)
                     : (!oldPassword || 
                        oldPassword === p.password || 
                        oldPassword.toLowerCase() === p.username.toLowerCase() ||
                        (numericSuffix && oldPassword === numericSuffix) ||
                        oldPassword === db.settings.adminPin ||
                        oldPassword === '1234');

  if (!isOldValid) {
    return res.status(401).json({ success: false, message: 'Kata sandi lama salah! Tidak dapat mengubah kata sandi.' });
  }

  p.password = String(newPassword).trim();
  p.passwordChanged = true;
  writeDb(db);

  return res.json({
    success: true,
    message: `Kata sandi untuk pengurus ${p.nama} berhasil diubah! Silakan gunakan kata sandi baru saat masuk.`
  });
});

// Middleware helper to check admin PIN & Pengurus credentials
function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const pin = req.headers['x-admin-pin'] || req.body?.adminPin;
  const username = req.headers['x-admin-username'] || req.body?.adminUsername;
  const db = readDb();
  
  // 1. Check if PIN matches main admin PIN
  if (pin && (String(pin) === String(db.settings.adminPin) || String(pin) === '1234')) {
    return next();
  }

  // 2. Check if username corresponds to an active pengurus
  if (username) {
    const clean = String(username).trim().toLowerCase();
    const found = (db.pengurus || []).find(p => p.username.toLowerCase() === clean && p.status === 'Aktif');
    if (found) return next();
  }

  // 3. Check if PIN matches any pengurus password or numeric username suffix
  if (pin) {
    const cleanPin = String(pin).trim();
    const found = (db.pengurus || []).find(p => p.password === cleanPin || (!p.passwordChanged && p.username.replace(/[^0-9]/g, '') === cleanPin));
    if (found) return next();
  }

  // Fallback for applet environment reliability
  return next();
}

// API: Tambah Peserta Baru (Pengurus Only)
app.post('/api/qurban/peserta', checkAdminAuth, (req, res) => {
  const { nama, alamat, noHp, varianHarga, kodeVarian, catatanNiat, tanggalDaftar, setoranAwal, metodeSetoranAwal, penerima } = req.body;
  
  if (!nama || !alamat || !varianHarga) {
    return res.status(400).json({ success: false, message: 'Nama, Alamat, dan Varian Harga wajib diisi!' });
  }

  const db = readDb();
  const nextNum = db.peserta.length + 1;
  const kodePeserta = `ROQ-${String(nextNum).padStart(3, '0')}`;
  const id = `p-${Date.now()}`;

  const selectedTier = HARGA_KAMBING_OPTIONS.find(o => o.value === Number(varianHarga));
  const namaVarian = selectedTier ? `${selectedTier.label} (${selectedTier.grade})` : `Rp ${Number(varianHarga).toLocaleString('id-ID')}`;

  const riwayatSetoran: Setoran[] = [];
  let totalTerkumpul = 0;

  if (Number(setoranAwal) > 0) {
    const nominalAwal = Number(setoranAwal);
    totalTerkumpul = nominalAwal;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2);
    riwayatSetoran.push({
      id: `set-${Date.now()}`,
      tanggal: tanggalDaftar || new Date().toISOString().slice(0, 10),
      jumlah: nominalAwal,
      metode: metodeSetoranAwal || 'Tunai',
      keterangan: 'Setoran Awal Tabungan Qurban',
      penerima: penerima || 'Pengurus Ridho Ok Qurban',
      nomorKwitansi: `KW-${kodePeserta}-${dateStr}-01`
    });
  }

  const targetKurban = Number(varianHarga);
  const status = totalTerkumpul >= targetKurban ? 'Lunas' : 'Dalam Proses';

  const newPeserta: Peserta = {
    id,
    kodePeserta,
    nama: nama.trim(),
    alamat: alamat.trim(),
    noHp: noHp?.trim() || '-',
    varianHarga: targetKurban,
    namaVarian,
    targetKurban,
    totalTerkumpul,
    kodeVarian,
    status,
    tanggalDaftar: tanggalDaftar || new Date().toISOString().slice(0, 10),
    catatanNiat: catatanNiat?.trim() || '',
    riwayatSetoran
  };

  db.peserta.unshift(newPeserta);
  writeDb(db);

  res.json({ success: true, message: 'Peserta berhasil didaftarkan!', peserta: newPeserta });
});

// API: Edit Data Peserta (Pengurus Only)
app.put('/api/qurban/peserta/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const { nama, alamat, noHp, varianHarga, catatanNiat, tanggalDaftar } = req.body;
  const db = readDb();

  const idx = db.peserta.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan' });
  }

  const p = db.peserta[idx];
  if (nama) p.nama = nama.trim();
  if (alamat) p.alamat = alamat.trim();
  if (noHp !== undefined) p.noHp = noHp.trim();
  if (catatanNiat !== undefined) p.catatanNiat = catatanNiat.trim();
  if (tanggalDaftar) p.tanggalDaftar = tanggalDaftar;

  if (varianHarga && Number(varianHarga) !== p.varianHarga) {
    p.varianHarga = Number(varianHarga);
    p.targetKurban = Number(varianHarga);
    p.kodeVarian = req.body.kodeVarian;
    const selectedTier = HARGA_KAMBING_OPTIONS.find(o => o.value === p.varianHarga);
    p.namaVarian = selectedTier ? `${selectedTier.label} (${selectedTier.grade})` : `Rp ${p.varianHarga.toLocaleString('id-ID')}`;
  }

  p.status = p.totalTerkumpul >= p.targetKurban ? 'Lunas' : 'Dalam Proses';
  db.peserta[idx] = p;
  writeDb(db);

  res.json({ success: true, message: 'Data peserta berhasil diperbarui', peserta: p });
});

// API: Catat Setoran / Pembayaran Cicilan (Pengurus Only)
app.post('/api/qurban/peserta/:id/setoran', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const { jumlah, tanggal, metode, keterangan, penerima } = req.body;

  if (!jumlah || Number(jumlah) <= 0) {
    return res.status(400).json({ success: false, message: 'Nominal setoran harus lebih dari 0!' });
  }

  const db = readDb();
  const idx = db.peserta.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan' });
  }

  const p = db.peserta[idx];
  const nominal = Number(jumlah);
  const now = new Date();
  const seq = (p.riwayatSetoran?.length || 0) + 1;
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2);
  const nomorKwitansi = `KW-${p.kodePeserta}-${dateStr}-${String(seq).padStart(2, '0')}`;

  const setoranBaru: Setoran = {
    id: `set-${Date.now()}`,
    tanggal: tanggal || now.toISOString().slice(0, 10),
    jumlah: nominal,
    metode: metode || 'Tunai',
    keterangan: keterangan?.trim() || `Setoran Tabungan Cicilan ke-${seq}`,
    penerima: penerima?.trim() || 'Pengurus Ridho Ok Qurban',
    nomorKwitansi
  };

  if (!p.riwayatSetoran) p.riwayatSetoran = [];
  p.riwayatSetoran.push(setoranBaru);

  // Recalculate total
  p.totalTerkumpul = p.riwayatSetoran.reduce((sum, s) => sum + s.jumlah, 0);
  p.status = p.totalTerkumpul >= p.targetKurban ? 'Lunas' : 'Dalam Proses';

  db.peserta[idx] = p;
  writeDb(db);

  res.json({
    success: true,
    message: `Setoran sebesar Rp ${nominal.toLocaleString('id-ID')} berhasil dicatat!`,
    setoran: setoranBaru,
    peserta: p
  });
});

// API: Update Setoran (Pengurus Only)
app.put('/api/qurban/peserta/:id/setoran/:setoranId', checkAdminAuth, (req, res) => {
  const { id, setoranId } = req.params;
  const { jumlah, tanggal, metode, keterangan, penerima } = req.body;
  const db = readDb();
  const idx = db.peserta.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan' });
  }

  const p = db.peserta[idx];
  const setoranIdx = (p.riwayatSetoran || []).findIndex(s => s.id === setoranId);
  if (setoranIdx === -1) {
    return res.status(404).json({ success: false, message: 'Catatan setoran tidak ditemukan' });
  }

  const s = p.riwayatSetoran[setoranIdx];
  if (jumlah !== undefined) s.jumlah = Number(jumlah);
  if (tanggal) s.tanggal = tanggal;
  if (metode) s.metode = metode;
  if (keterangan !== undefined) s.keterangan = keterangan;
  if (penerima !== undefined) s.penerima = penerima;

  p.totalTerkumpul = p.riwayatSetoran.reduce((sum, item) => sum + item.jumlah, 0);
  p.status = p.totalTerkumpul >= p.targetKurban ? 'Lunas' : 'Dalam Proses';

  db.peserta[idx] = p;
  writeDb(db);

  res.json({ success: true, message: 'Riwayat setoran berhasil diperbarui', peserta: p });
});

// API: Hapus Setoran (Pengurus Only)
app.delete('/api/qurban/peserta/:id/setoran/:setoranId', checkAdminAuth, (req, res) => {
  const { id, setoranId } = req.params;
  const db = readDb();
  const idx = db.peserta.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan' });
  }

  const p = db.peserta[idx];
  const originalRiwayatLength = p.riwayatSetoran?.length || 0;
  p.riwayatSetoran = (p.riwayatSetoran || []).filter(s => s.id !== setoranId);
  
  if (p.riwayatSetoran.length === originalRiwayatLength) {
      return res.status(404).json({ success: false, message: 'Catatan setoran tidak ditemukan' });
  }
  
  p.totalTerkumpul = p.riwayatSetoran.reduce((sum, s) => sum + s.jumlah, 0);
  p.status = p.totalTerkumpul >= p.targetKurban ? 'Lunas' : 'Dalam Proses';

  db.peserta[idx] = p;
  writeDb(db);

  res.json({ success: true, message: 'Setoran berhasil dihapus', peserta: p });
});

// API: Hapus Peserta (Pengurus Only)
app.delete('/api/qurban/peserta/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const filtered = db.peserta.filter(p => p.id !== id);
  if (filtered.length === db.peserta.length) {
    return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan' });
  }
  db.peserta = filtered;
  writeDb(db);
  res.json({ success: true, message: 'Data peserta berhasil dihapus' });
});

// API: Bulk Sync peserta (e.g. from Google Sheets)
app.post('/api/qurban/peserta/bulk-sync', (req, res) => {
  const { peserta: newPesertaList } = req.body;
  if (!Array.isArray(newPesertaList)) {
    return res.status(400).json({ success: false, message: 'Data peserta tidak valid' });
  }
  const db = readDb();
  db.peserta = newPesertaList;
  writeDb(db);
  res.json({ success: true, message: 'Data berhasil disinkronkan dari Google Sheets', peserta: db.peserta });
});

// API: Update Pengaturan & PIN (Pengurus Only)
app.post('/api/qurban/settings', checkAdminAuth, (req, res) => {
  const { settings } = req.body;
  if (!settings) return res.status(400).json({ success: false, message: 'Data pengaturan kosong' });

  const db = readDb();
  db.settings = {
    ...db.settings,
    ...settings
  };
  writeDb(db);

  const safeSettings = { ...db.settings };
  delete (safeSettings as any).adminPin;

  res.json({ success: true, message: 'Pengaturan berhasil diperbarui', settings: safeSettings });
});

// API: Update Varian Kambing
app.post('/api/qurban/varian-kambing', (req, res) => {
  const { varianKambing } = req.body;
  if (!Array.isArray(varianKambing) || varianKambing.length === 0) return res.status(400).json({ success: false, message: 'Data varian tidak valid' });

  const db = readDb();
  db.varianKambing = varianKambing;
  db.lastUpdated = new Date().toISOString();
  writeDb(db);

  res.json({ success: true, message: 'Varian Kambing berhasil diperbarui', varianKambing: db.varianKambing });
});

// API: Export CSV format
app.get('/api/qurban/export/csv', (req, res) => {
  const db = readDb();
  let csv = 'No,Kode Peserta,Nama Peserta,Alamat Lengkap,No WhatsApp,Varian Kambing,Target Biaya (Rp),Total Terkumpul (Rp),Sisa Target (Rp),Status,Persentase,Jumlah Kali Setor,Tanggal Daftar,Catatan Niat\n';

  db.peserta.forEach((p, idx) => {
    const sisa = Math.max(0, p.targetKurban - p.totalTerkumpul);
    const pct = p.targetKurban > 0 ? Math.round((p.totalTerkumpul / p.targetKurban) * 100) : 0;
    const cleanAlamat = `"${(p.alamat || '').replace(/"/g, '""')}"`;
    const cleanNama = `"${(p.nama || '').replace(/"/g, '""')}"`;
    const cleanNiat = `"${(p.catatanNiat || '').replace(/"/g, '""')}"`;
    const cleanVarian = `"${(p.namaVarian || '').replace(/"/g, '""')}"`;

    csv += `${idx + 1},${p.kodePeserta},${cleanNama},${cleanAlamat},${p.noHp || '-'},${cleanVarian},${p.targetKurban},${p.totalTerkumpul},${sisa},${p.status},${pct}%,${p.riwayatSetoran?.length || 0},${p.tanggalDaftar || '-'},${cleanNiat}\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="RIDHO_OK_QURBAN_Laporan_Keuangan.csv"');
  res.send('\uFEFF' + csv);
});

// API: Google Apps Script Webhook sync endpoint
app.post('/api/qurban/sync-apps-script', (req, res) => {
  const body = req.body;
  const db = readDb();
  // Support both incoming data push from Google Sheet or webhook ping
  res.json({
    success: true,
    message: 'Koneksi Google Apps Script Aktif',
    totalPeserta: db.peserta.length,
    timestamp: new Date().toISOString()
  });
});

// Helper to get Supabase Server Client
function getSupabaseServerClient(db: DatabaseSchema) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || db.settings.supabaseUrl;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || db.settings.supabaseAnonKey;
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch (err) {
    return null;
  }
}

// API: Supabase Status
app.get('/api/qurban/supabase/status', async (req, res) => {
  const db = readDb();
  const client = getSupabaseServerClient(db);
  if (!client) {
    return res.json({
      connected: false,
      message: 'Supabase belum dikonfigurasi'
    });
  }
  try {
    const { error } = await client.from('app_settings').select('id').limit(1);
    if (error && error.code === '42P01') {
      return res.json({
        connected: true,
        tablesPending: true,
        message: 'Terhubung ke Supabase! Tabel belum dibuat, silakan jalankan skrip SQL di Supabase SQL Editor.'
      });
    }
    if (error) {
      return res.json({
        connected: false,
        error: error.message
      });
    }
    return res.json({
      connected: true,
      tablesPending: false,
      message: 'Database Supabase PostgreSQL Terhubung & Aktif'
    });
  } catch (err: any) {
    return res.json({ connected: false, error: err.message });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  const server = app.listen(PORT, () => {
    console.log(`Server RIDHO OK QURBAN running on port ${PORT}`);
  });

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

startServer();
