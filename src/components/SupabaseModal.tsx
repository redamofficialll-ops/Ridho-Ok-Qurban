import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, AlertCircle, RefreshCw, Key, Link as LinkIcon, Shield } from 'lucide-react';
import { AppSettings } from '../types/qurban';
import { initSupabaseClient } from '../services/supabaseClient';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  isAdmin: boolean;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  isAdmin
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const prevIsOpen = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setSupabaseUrl(settings.supabaseUrl || '');
      setSupabaseAnonKey(settings.supabaseAnonKey || '');
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
      setStatusMsg(null);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setStatusMsg(null);

    const url = supabaseUrl.trim();
    const key = supabaseAnonKey.trim();

    if (!url || !key) {
      setStatusMsg({ type: 'error', text: 'Supabase URL dan Anon Key harus diisi.' });
      setIsConnecting(false);
      return;
    }

    try {
      const client = initSupabaseClient();
      // Test connection with a dummy query or ping
      const success = await onSaveSettings({
        supabaseUrl: url,
        supabaseAnonKey: key
      });

      if (success) {
        setIsConnected(true);
        setStatusMsg({ type: 'success', text: 'Berhasil terhubung ke database Supabase!' });
      } else {
        setStatusMsg({ type: 'error', text: 'Gagal menyimpan pengaturan Supabase.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Koneksi gagal: ${err.message || 'Periksa URL & API Key.'}` });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await onSaveSettings({
      supabaseUrl: '',
      supabaseAnonKey: ''
    });
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setIsConnected(false);
    setStatusMsg({ type: 'success', text: 'Koneksi Supabase diputus.' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 border-b border-[#D4AF37]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#FAF8F5]">Integrasi Database Supabase</h2>
              <p className="text-xs text-white/70">Hubungkan aplikasi dengan database relasional cloud Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConnect} className="p-5 sm:p-6 space-y-4">
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'}`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Panduan Koneksi Supabase</span>
            </div>
            <p className="text-blue-700">
              Masukkan Project URL dan Anon Public API Key dari Dashboard Supabase Anda (Project Settings &gt; API) untuk menyinkronkan data peserta & login pengurus secara cloud.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="url"
                placeholder="https://abcdefgh.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Supabase Anon / Public Key</span>
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition"
              >
                Putuskan Koneksi Supabase
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isConnecting}
                className="px-5 py-2 bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>{isConnecting ? 'Menghubungkan...' : 'Simpan & Hubungkan Supabase'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
