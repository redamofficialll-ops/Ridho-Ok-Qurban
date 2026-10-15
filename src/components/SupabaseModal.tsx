import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, ExternalLink, ArrowRight, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { SupabaseConfig, getSavedSupabaseConfig, saveSupabaseConfig, testSupabaseConnection, SUPABASE_SQL_SCHEMA, getSupabaseClient } from '../services/supabaseClient';
import { Peserta, AppSettings } from '../types/qurban';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pesertaList: Peserta[];
  settings: AppSettings;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  onRefreshData?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  pesertaList,
  settings,
  onSaveSettings,
  onRefreshData
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateStatus, setMigrateStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'koneksi' | 'sql' | 'panduan'>('koneksi');

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedSupabaseConfig();
      setSupabaseUrl(settings.supabaseUrl || saved.url || '');
      setSupabaseAnonKey(settings.supabaseAnonKey || saved.anonKey || '');
      setTestResult(null);
      setMigrateStatus(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const config: SupabaseConfig = {
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim()
    };
    const result = await testSupabaseConnection(config);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      saveSupabaseConfig({
        ...config,
        isConnected: true,
        lastSync: new Date().toISOString()
      });
      await onSaveSettings({
        supabaseUrl: config.url,
        supabaseAnonKey: config.anonKey,
        supabaseConnected: true,
        lastSupabaseSyncTime: new Date().toISOString()
      });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleMigrateToSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      alert('Silakan simpan URL dan Anon Key Supabase terlebih dahulu!');
      return;
    }

    setIsMigrating(true);
    setMigrateStatus('Menghubungkan ke Supabase...');

    try {
      const client = getSupabaseClient({
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim()
      });

      if (!client) {
        throw new Error('Gagal menginisialisasi client Supabase');
      }

      setMigrateStatus(`Mengunggah ${pesertaList.length} data peserta ke tabel Supabase...`);

      // 1. Upsert Peserta to Supabase
      const pesertaRecords = pesertaList.map(p => ({
        id: p.id,
        kode_peserta: p.kodePeserta,
        nama: p.nama,
        alamat: p.alamat,
        no_hp: p.noHp,
        varian_harga: p.varianHarga,
        nama_varian: p.namaVarian,
        kode_varian: p.kodeVarian,
        target_kurban: p.targetKurban,
        total_terkumpul: p.totalTerkumpul,
        status: p.status,
        tanggal_daftar: p.tanggalDaftar,
        catatan_niat: p.catatanNiat || '',
        riwayat_setoran: p.riwayatSetoran || []
      }));

      const { error: pesertaError } = await client
        .from('peserta')
        .upsert(pesertaRecords, { onConflict: 'id' });

      if (pesertaError) {
        // If table doesn't exist
        if (pesertaError.code === '42P01') {
          throw new Error('Tabel "peserta" belum ada di Supabase. Silakan buka tab "Skrip SQL", salin dan jalankan skrip di SQL Editor Supabase terlebih dahulu!');
        }
        throw new Error(pesertaError.message);
      }

      // 2. Upsert Settings
      setMigrateStatus('Menyimpan pengaturan aplikasi ke Supabase...');
      const { error: settingsError } = await client
        .from('app_settings')
        .upsert({
          id: 'main_settings',
          nama_program: settings.namaProgram,
          nama_lembaga: settings.namaLembaga,
          target_idul_adha: settings.targetIdulAdha,
          tahun_hijriyah: settings.tahunHijriyah,
          tahun_masehi: settings.tahunMasehi,
          kontak_pengurus: settings.kontakPengurus,
          rekening_tujuan: settings.rekeningTujuan
        }, { onConflict: 'id' });

      if (settingsError && settingsError.code !== '42P01') {
        console.warn('Settings upsert note:', settingsError);
      }

      setMigrateStatus(`Sukses! ${pesertaList.length} data peserta berhasil disinkronkan ke Supabase.`);
      await onSaveSettings({
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
        supabaseConnected: true,
        lastSupabaseSyncTime: new Date().toISOString()
      });

      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setMigrateStatus(`Gagal migrasi: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-3xl shadow-2xl border-2 border-emerald-500/70 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] px-5 py-4 sm:px-6 sm:py-5 border-b border-emerald-500/40 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/30">
                  Database PostgreSQL
                </span>
                <span className="text-[11px] text-white/50 hidden sm:inline">Pengganti Firebase</span>
              </div>
              <h2 className="text-xl font-black text-white font-serif-brand mt-0.5">
                Integrasi Database Supabase
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0f1d33] px-5 pt-3 border-b border-white/10 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('koneksi')}
            className={`px-4 py-2 font-bold rounded-t-xl transition cursor-pointer ${
              activeTab === 'koneksi'
                ? 'bg-[#FAF8F5] text-[#0A192F] shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Koneksi & Sinkronisasi
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 font-bold rounded-t-xl transition cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-[#FAF8F5] text-[#0A192F] shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Skrip SQL Tabel
          </button>
          <button
            onClick={() => setActiveTab('panduan')}
            className={`px-4 py-2 font-bold rounded-t-xl transition cursor-pointer ${
              activeTab === 'panduan'
                ? 'bg-[#FAF8F5] text-[#0A192F] shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Panduan Supabase
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* TAB 1: KONEKSI & SINKRONISASI */}
          {activeTab === 'koneksi' && (
            <div className="space-y-4 text-xs">
              {/* Notice no Firebase */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Aplikasi Kini Bebas Firebase</span>
                  <span className="text-[11px] text-emerald-800">
                    Aplikasi RIDHO OK QURBAN telah diputuskan dari Firebase dan kini mendukung penuh database relasional PostgreSQL melalui **Supabase**.
                  </span>
                </div>
              </div>

              {/* Form Input */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzprojectid.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Dapat dilihat di Dashboard Supabase &gt; Project Settings &gt; API &gt; Project URL
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Supabase Anon / Public API Key
                  </label>
                  <textarea
                    rows={2}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Kunci publik 'anon' 'public' dari Dashboard Supabase &gt; Project Settings &gt; API
                  </span>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}

                {migrateStatus && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
                    <span>{migrateStatus}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !supabaseUrl.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{isTesting ? 'Menguji Koneksi...' : 'Simpan & Tes Koneksi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMigrateToSupabase}
                    disabled={isMigrating || !supabaseUrl.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#1E293B] text-emerald-400 border border-emerald-500/40 font-bold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Migrasikan Data ke Supabase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKRIP SQL */}
          {activeTab === 'sql' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#0A192F] text-sm">
                    Skrip Pembuatan Tabel Database Supabase
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Salin skrip SQL ini lalu tempelkan (*paste*) di menu **SQL Editor** dashboard Supabase Anda.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-[#0A192F] text-emerald-300 font-mono p-4 rounded-2xl text-[11px] overflow-x-auto max-h-[350px] border border-emerald-500/30 leading-relaxed shadow-inner">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: PANDUAN SUPABASE */}
          {activeTab === 'panduan' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-[#0A192F] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Cara Mudah Menghubungkan Supabase Gratis:</span>
                </h4>

                <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-600">
                  <li>
                    Buka situs resmi <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> dan buat akun gratis.
                  </li>
                  <li>
                    Klik <strong>New Project</strong>, beri nama misalnya <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">ridho-ok-qurban</code> dan pilih wilayah (misal <em>Singapore</em>).
                  </li>
                  <li>
                    Buka menu <strong>SQL Editor</strong> di dashboard Supabase, klik <em>New Query</em>, lalu salin dan tempelkan skrip dari tab <strong>Skrip SQL Tabel</strong> di atas, kemudian klik <strong>Run</strong>.
                  </li>
                  <li>
                    Buka menu <strong>Project Settings &gt; API</strong>, salin <strong>Project URL</strong> dan <strong>anon/public key</strong>.
                  </li>
                  <li>
                    Tempelkan kedua nilai tersebut di tab <strong>Koneksi &amp; Sinkronisasi</strong> pop up ini lalu klik <strong>Simpan &amp; Tes Koneksi</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            {settings.supabaseConnected ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Terhubung ke Supabase
              </span>
            ) : (
              'Belum terhubung ke Supabase'
            )}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0A192F] hover:bg-[#1E293B] text-white font-bold transition shadow-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
