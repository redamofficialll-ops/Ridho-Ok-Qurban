import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Peserta, AppSettings } from '../types/qurban';

const SUPABASE_STORAGE_KEY = 'RIDHO_OK_SUPABASE_CONFIG';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected?: boolean;
  lastSync?: string;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    };
  }
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: parsed.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        isConnected: parsed.isConnected,
        lastSync: parsed.lastSync
      };
    }
  } catch {}

  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(config));
  }
}

let activeClient: SupabaseClient | null = null;

export function getSupabaseClient(configOverride?: SupabaseConfig): SupabaseClient | null {
  const config = configOverride || getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    if (!activeClient || configOverride) {
      activeClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }
    return activeClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.url || !config.anonKey) {
      return { success: false, message: 'URL Supabase dan Anon Key wajib diisi!' };
    }
    const client = createClient(config.url, config.anonKey);
    // Ping with a lightweight query
    const { error } = await client.from('app_settings').select('id').limit(1);
    
    // If table doesn't exist yet, it's still a valid connected instance
    if (error && error.code === '42P01') {
      return { 
        success: true, 
        message: 'Koneksi ke Supabase berhasil! Tabel belum dibuat, silakan jalankan skrip SQL di Supabase SQL Editor.' 
      };
    }

    if (error && error.code !== 'PGRST116') {
      // Check auth error
      if (error.message?.includes('JWT') || error.message?.includes('apikey')) {
        return { success: false, message: `Autentikasi Supabase gagal: ${error.message}` };
      }
    }

    return { success: true, message: 'Terhubung ke database Supabase PostgreSQL dengan sukses!' };
  } catch (err: any) {
    return { success: false, message: `Gagal terhubung: ${err.message || 'Periksa URL dan Anon Key Supabase'}` };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ===================================================
-- SKRIP TABEL DATABASE RIDHO OK QURBAN UNTUK SUPABASE
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda
-- ===================================================

-- 1. Tabel Pengaturan Aplikasi (app_settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'main_settings',
    nama_program TEXT NOT NULL DEFAULT 'RIDHO OK QURBAN',
    nama_lembaga TEXT NOT NULL DEFAULT 'RIDHO OK QURBAN',
    target_idul_adha TEXT NOT NULL DEFAULT '2027-05-16',
    tahun_hijriyah TEXT NOT NULL DEFAULT '1448 H',
    tahun_masehi TEXT NOT NULL DEFAULT '2027 M',
    kontak_pengurus TEXT DEFAULT '087874586603',
    rekening_tujuan TEXT DEFAULT 'Bank Syariah Indonesia (BSI) 7788990011 a.n. Tabungan Qurban Ridho',
    custom_logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Peserta Qurban (peserta)
CREATE TABLE IF NOT EXISTS public.peserta (
    id TEXT PRIMARY KEY,
    kode_peserta TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    alamat TEXT NOT NULL,
    no_hp TEXT DEFAULT '-',
    varian_harga NUMERIC NOT NULL,
    nama_varian TEXT NOT NULL,
    kode_varian TEXT,
    target_kurban NUMERIC NOT NULL,
    total_terkumpul NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Dalam Proses',
    tanggal_daftar TEXT NOT NULL,
    catatan_niat TEXT DEFAULT '',
    riwayat_setoran JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Riwayat Setoran / Cicilan (riwayat_setoran)
CREATE TABLE IF NOT EXISTS public.riwayat_setoran (
    id TEXT PRIMARY KEY,
    peserta_id TEXT REFERENCES public.peserta(id) ON DELETE CASCADE,
    nomor_kwitansi TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    jumlah NUMERIC NOT NULL,
    metode TEXT NOT NULL,
    penerima TEXT NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel 12 Varian Kambing (varian_kambing)
CREATE TABLE IF NOT EXISTS public.varian_kambing (
    kode TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    label TEXT NOT NULL,
    grade TEXT NOT NULL,
    deskripsi TEXT
);

-- Aktifkan Row Level Security (RLS) & Kebijakan Akses Publik
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_setoran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varian_kambing ENABLE ROW LEVEL SECURITY;

-- Kebijakan Baca Publik (Semua orang dapat membaca data qurban)
CREATE POLICY "Public Read Settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Peserta" ON public.peserta FOR SELECT USING (true);
CREATE POLICY "Public Read Setoran" ON public.riwayat_setoran FOR SELECT USING (true);
CREATE POLICY "Public Read Varian" ON public.varian_kambing FOR SELECT USING (true);

-- Kebijakan Tulis untuk Anon / Authenticated
CREATE POLICY "Allow All Insert Settings" ON public.app_settings FOR ALL USING (true);
CREATE POLICY "Allow All Insert Peserta" ON public.peserta FOR ALL USING (true);
CREATE POLICY "Allow All Insert Setoran" ON public.riwayat_setoran FOR ALL USING (true);
CREATE POLICY "Allow All Insert Varian" ON public.varian_kambing FOR ALL USING (true);
`;
