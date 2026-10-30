import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Link as LinkIcon,
  Shield,
  Copy,
  Check,
  ExternalLink,
  TableProperties,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Server
} from 'lucide-react';
import { AppSettings, Peserta, HARGA_KAMBING_OPTIONS } from '../types/qurban';
import {
  initSupabaseClient,
  checkSupabaseHealth,
  seedSupabaseIfEmpty,
  saveSupabaseConfig,
  getSupabaseCredentials,
  SupabaseHealthReport,
  SUPABASE_DEFAULT_URL,
  SUPABASE_DEFAULT_ANON_KEY
} from '../services/supabaseClient';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  pesertaList?: Peserta[];
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  onRefreshData?: () => Promise<any>;
  isAdmin: boolean;
}

const FULL_SQL_SCHEMA = `-- ==============================================================================
-- SKEMA DATABASE SUPABASE - RIDHO OK QURBAN
-- ==============================================================================
-- Buka di: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABEL APP_SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'main_settings',
    nama_program TEXT NOT NULL DEFAULT 'RIDHO OK QURBAN',
    nama_lembaga TEXT NOT NULL DEFAULT 'RIDHO OK QURBAN',
    target_idul_adha TEXT NOT NULL DEFAULT '2027-05-16',
    tahun_hijriyah TEXT NOT NULL DEFAULT '1448 H',
    tahun_masehi TEXT NOT NULL DEFAULT '2027 M',
    admin_pin TEXT NOT NULL DEFAULT '1234',
    kontak_pengurus TEXT DEFAULT '087874586603',
    rekening_tujuan TEXT DEFAULT 'Bank Syariah Indonesia (BSI) 7788990011 a.n. Tabungan Qurban Ridho',
    custom_logo_url TEXT,
    connected_spreadsheet_id TEXT,
    connected_spreadsheet_title TEXT,
    auto_sync_sheets BOOLEAN DEFAULT true,
    authorized_google_email TEXT DEFAULT 'redamofficialll@gmail.com',
    last_sheets_sync_time TEXT,
    is_sheets_locked BOOLEAN DEFAULT false,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABEL VARIAN_KAMBING
CREATE TABLE IF NOT EXISTS public.varian_kambing (
    kode TEXT PRIMARY KEY,
    value BIGINT NOT NULL,
    label TEXT NOT NULL,
    grade TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABEL PENGURUS
CREATE TABLE IF NOT EXISTS public.pengurus (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Pengurus Aktif',
    status TEXT NOT NULL DEFAULT 'Aktif',
    terakhir_login TEXT,
    password_changed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABEL PESERTA
CREATE TABLE IF NOT EXISTS public.peserta (
    id TEXT PRIMARY KEY,
    kode_peserta TEXT NOT NULL,
    nama TEXT NOT NULL,
    alamat TEXT NOT NULL,
    no_hp TEXT DEFAULT '-',
    varian_harga BIGINT NOT NULL,
    nama_varian TEXT NOT NULL,
    kode_varian TEXT,
    target_kurban BIGINT NOT NULL,
    total_terkumpul BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Dalam Proses',
    tanggal_daftar TEXT NOT NULL,
    catatan_niat TEXT DEFAULT '',
    riwayat_setoran JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABEL APP_DATA (Penyimpanan Cadangan Cepat)
CREATE TABLE IF NOT EXISTS public.app_data (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varian_kambing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Akses Penuh app_settings" ON public.app_settings;
    CREATE POLICY "Akses Penuh app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh varian_kambing" ON public.varian_kambing;
    CREATE POLICY "Akses Penuh varian_kambing" ON public.varian_kambing FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh pengurus" ON public.pengurus;
    CREATE POLICY "Akses Penuh pengurus" ON public.pengurus FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh peserta" ON public.peserta;
    CREATE POLICY "Akses Penuh peserta" ON public.peserta FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Akses Penuh app_data" ON public.app_data;
    CREATE POLICY "Akses Penuh app_data" ON public.app_data FOR ALL USING (true) WITH CHECK (true);
END $$;

-- DATA AWAL
INSERT INTO public.app_settings (id, nama_program, nama_lembaga, target_idul_adha, tahun_hijriyah, tahun_masehi, admin_pin, kontak_pengurus, rekening_tujuan, authorized_google_email)
VALUES (
    'main_settings', 'RIDHO OK QURBAN', 'RIDHO OK QURBAN', '2027-05-16', '1448 H', '2027 M', '1234', '087874586603',
    'Bank Syariah Indonesia (BSI) 7788990011 a.n. Tabungan Qurban Ridho', 'redamofficialll@gmail.com'
) ON CONFLICT (id) DO UPDATE SET updated_at = now();

INSERT INTO public.varian_kambing (kode, value, label, grade, deskripsi) VALUES
('V01', 2000000, 'Rp 2.000.000', 'Kambing Tipe Hemat', 'Bobot hidup ± 20-22 kg'),
('V02', 2500000, 'Rp 2.500.000', 'Kambing Tipe A', 'Bobot hidup ± 23-25 kg'),
('V03', 3000000, 'Rp 3.000.000', 'Kambing Tipe B', 'Bobot hidup ± 26-28 kg'),
('V04', 3500000, 'Rp 3.500.000', 'Kambing Tipe C', 'Bobot hidup ± 29-31 kg'),
('V05', 4000000, 'Rp 4.000.000', 'Kambing Tipe Super 1', 'Bobot hidup ± 32-35 kg'),
('V06', 4500000, 'Rp 4.500.000', 'Kambing Tipe Super 2', 'Bobot hidup ± 36-39 kg'),
('V07', 4800000, 'Rp 4.800.000', 'Kambing Tipe Premium 1', 'Bobot hidup ± 40-43 kg'),
('V08', 5000000, 'Rp 5.000.000', 'Kambing Tipe Premium 2', 'Bobot hidup ± 44-47 kg'),
('V09', 5500000, 'Rp 5.500.000', 'Kambing Tipe Istimewa 1', 'Bobot hidup ± 48-52 kg'),
('V10', 6000000, 'Rp 6.000.000', 'Kambing Tipe Istimewa 2', 'Bobot hidup ± 53-57 kg'),
('V11', 6500000, 'Rp 6.500.000', 'Kambing Tipe Jumbo 1', 'Bobot hidup ± 58-62 kg'),
('V12', 7000000, 'Rp 7.000.000', 'Kambing Tipe Jumbo 2', 'Bobot hidup > 63 kg')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO public.pengurus (id, username, nama, password, role, status) VALUES
('adm-001', 'Kemal1208', 'Kemal1208', 'Kemal1208', 'Pengurus Aktif', 'Aktif'),
('adm-002', 'Addin7846', 'Addin7846', 'Addin7846', 'Pengurus Aktif', 'Aktif'),
('adm-003', 'Gilang2356', 'Gilang2356', 'Gilang2356', 'Pengurus Aktif', 'Aktif'),
('adm-004', 'Apni4638', 'Apni4638', 'Apni4638', 'Pengurus Aktif', 'Aktif'),
('adm-005', 'Ridho9856', 'Ridho9856', 'Ridho9856', 'Pengurus Aktif', 'Aktif')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_data (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  settings,
  pesertaList = [],
  onSaveSettings,
  onRefreshData
}) => {
  const creds = getSupabaseCredentials(settings);
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(creds.anonKey || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSqlDetails, setShowSqlDetails] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [health, setHealth] = useState<SupabaseHealthReport | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const performHealthCheck = async (urlToCheck?: string, keyToCheck?: string) => {
    setIsChecking(true);
    try {
      const rep = await checkSupabaseHealth(urlToCheck !== undefined ? urlToCheck : supabaseUrl, keyToCheck !== undefined ? keyToCheck : supabaseAnonKey);
      setHealth(rep);
    } catch (err: any) {
      console.warn('Health check info:', err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const current = getSupabaseCredentials(settings);
      setSupabaseUrl(current.url || '');
      setSupabaseAnonKey(current.anonKey || '');
      performHealthCheck(current.url, current.anonKey);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(FULL_SQL_SCHEMA);
      setCopiedSql(true);
      setStatusMsg({ type: 'success', text: 'Skrip SQL berhasil disalin ke clipboard!' });
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      setStatusMsg({ type: 'error', text: 'Gagal menyalin SQL otomatis. Silakan pilih dan salin manual.' });
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setStatusMsg(null);

    const url = supabaseUrl.trim();
    const key = supabaseAnonKey.trim();

    try {
      saveSupabaseConfig(url, key);
      initSupabaseClient({ supabaseUrl: url, supabaseAnonKey: key }, true);

      await onSaveSettings({
        supabaseUrl: url,
        supabaseAnonKey: key
      });

      const report = await checkSupabaseHealth(url, key);
      setHealth(report);

      if (report.connected) {
        setStatusMsg({ type: 'success', text: 'Koneksi Supabase berhasil diverifikasi & terhubung!' });
        if (onRefreshData) await onRefreshData();
      } else if (report.status === 'unreachable') {
        setStatusMsg({
          type: 'info',
          text: 'Konfigurasi disimpan. Supabase dalam mode siaga otomatis dan sinkron saat koneksi siap.'
        });
      } else {
        setStatusMsg({ type: 'info', text: 'Pengaturan Supabase berhasil disimpan.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Pemberitahuan: ${err.message || 'Gagal menyimpan pengaturan.'}` });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setStatusMsg(null);
    try {
      const client = initSupabaseClient({ supabaseUrl, supabaseAnonKey }, true);
      if (!client) {
        setStatusMsg({ type: 'error', text: 'Klien Supabase belum dapat dijangkau. Periksa Project URL & Key.' });
        return;
      }

      const success = await seedSupabaseIfEmpty(client, {
        settings,
        peserta: pesertaList,
        varianKambing: HARGA_KAMBING_OPTIONS,
        pengurus: [
          { id: 'adm-001', username: 'Kemal1208', nama: 'Kemal1208', password: 'Kemal1208', role: 'Pengurus Aktif', status: 'Aktif' },
          { id: 'adm-002', username: 'Addin7846', nama: 'Addin7846', password: 'Addin7846', role: 'Pengurus Aktif', status: 'Aktif' },
          { id: 'adm-003', username: 'Gilang2356', nama: 'Gilang2356', password: 'Gilang2356', role: 'Pengurus Aktif', status: 'Aktif' },
          { id: 'adm-004', username: 'Apni4638', nama: 'Apni4638', password: 'Apni4638', role: 'Pengurus Aktif', status: 'Aktif' },
          { id: 'adm-005', username: 'Ridho9856', nama: 'Ridho9856', password: 'Ridho9856', role: 'Pengurus Aktif', status: 'Aktif' }
        ]
      });

      if (success) {
        setStatusMsg({ type: 'success', text: 'Data peserta & varian berhasil disinkronkan ke Supabase Cloud!' });
        await performHealthCheck();
        if (onRefreshData) await onRefreshData();
      } else {
        setStatusMsg({
          type: 'info',
          text: 'Tabel database Supabase siap. Silakan jalankan Skrip SQL di bawah jika tabel belum terbentuk.'
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Gagal sinkronisasi: ${err.message}` });
    } finally {
      setIsSeeding(false);
    }
  };

  const projectRef = supabaseUrl.includes('supabase.co')
    ? supabaseUrl.replace('https://', '').split('.')[0]
    : 'project';

  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 border-b border-[#D4AF37]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#FAF8F5] flex items-center gap-2">
                <span>Integrasi Database Supabase</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-semibold">
                  PostgreSQL Cloud
                </span>
              </h2>
              <p className="text-xs text-white/70">Penyimpanan cloud data peserta qurban, tabungan, dan varian kambing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
              statusMsg.type === 'error' ? 'bg-red-100 text-red-900 border border-red-300' :
              'bg-blue-100 text-blue-900 border border-blue-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Connection Status Overview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.connected ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${health?.connected ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {health?.connected ? 'Supabase Cloud Terhubung' : 'Mode Sinkronisasi Aktif'}
                </span>
              </div>
              <button
                onClick={() => performHealthCheck()}
                disabled={isChecking}
                className="text-xs text-[#B8860B] hover:text-[#D4AF37] flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Tes Koneksi</span>
              </button>
            </div>

            {/* Quick table status pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Tabel Peserta</div>
                <div className={`text-xs font-bold mt-0.5 flex items-center justify-center gap-1 ${health?.tables.peserta ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {health?.tables.peserta ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Server className="w-3 h-3 text-slate-400" />}
                  <span>peserta</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Pengaturan</div>
                <div className={`text-xs font-bold mt-0.5 flex items-center justify-center gap-1 ${health?.tables.appSettings ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {health?.tables.appSettings ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Server className="w-3 h-3 text-slate-400" />}
                  <span>app_settings</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">12 Varian</div>
                <div className={`text-xs font-bold mt-0.5 flex items-center justify-center gap-1 ${health?.tables.varianKambing ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {health?.tables.varianKambing ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Server className="w-3 h-3 text-slate-400" />}
                  <span>varian</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Pengurus</div>
                <div className={`text-xs font-bold mt-0.5 flex items-center justify-center gap-1 ${health?.tables.pengurus ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {health?.tables.pengurus ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Server className="w-3 h-3 text-slate-400" />}
                  <span>pengurus</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">
                  {health?.connected
                    ? 'Data aplikasi tersinkronisasi sempurna dengan Supabase.'
                    : 'Aplikasi aktif dengan auto-sync data qurban & Google Sheets.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSeedData}
                disabled={isSeeding}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
              </button>
            </div>
          </div>

          {/* Form Konfigurasi Supabase */}
          <form onSubmit={handleConnect} className="space-y-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="font-bold text-xs text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#B8860B]" />
                <span>Konfigurasi Supabase Project</span>
              </div>
              <span className="text-[11px] text-slate-500">Tersimpan di Cloud & Lokal</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-[#B8860B]" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="url"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Key className="w-3 h-3 text-[#B8860B]" />
                <span>Supabase Anon / Public API Key</span>
              </label>
              <input
                type="text"
                placeholder="eyJhbGciOi... atau sb_publishable_..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowSqlDetails(!showSqlDetails)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                <TableProperties className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Skema Database SQL</span>
                {showSqlDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="submit"
                disabled={isConnecting}
                className="px-4 py-2 bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] font-bold text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>{isConnecting ? 'Menghubungkan...' : 'Simpan & Hubungkan'}</span>
              </button>
            </div>
          </form>

          {/* Accordion Skema Database SQL */}
          {showSqlDetails && (
            <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <TableProperties className="w-4 h-4 text-[#D4AF37]" />
                    <span>Skrip SQL Skema PostgreSQL Supabase</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Otomatis membuat 5 tabel (peserta, app_settings, varian_kambing, pengurus, app_data) dan kebijakan RLS.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[#D4AF37] text-xs font-bold rounded flex items-center gap-1 border border-slate-700"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Tersalin' : 'Salin SQL'}</span>
                  </button>
                  <a
                    href={sqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka SQL Editor</span>
                  </a>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto bg-black/60 rounded-lg p-3 font-mono text-[11px] text-emerald-400 border border-slate-800 select-all">
                <pre>{FULL_SQL_SCHEMA}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
