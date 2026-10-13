import React from 'react';
import { LogoEmblem } from './LogoEmblem';
import { Shield, ShieldAlert, RefreshCw, FileSpreadsheet, Tag, Settings, LogOut, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { AppSettings, ActiveAdminSession } from '../types/qurban';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  settings: AppSettings;
  isAdmin: boolean;
  activePengurus?: ActiveAdminSession | null;
  googleEmailConnected?: string | null;
  onOpenLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenSettings: () => void;
  onOpenVarianKambing: () => void;
  onOpenAppsScript: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdatedTime: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isAdmin,
  activePengurus,
  googleEmailConnected,
  onOpenLogin,
  onLogoutAdmin,
  onOpenSettings,
  onOpenVarianKambing,
  onOpenAppsScript,
  onRefresh,
  isRefreshing,
  lastUpdatedTime
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A192F] border-b border-[#D4AF37]/30 shadow-xl text-[#FAF8F5]">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] border-b border-[#D4AF37]/20 px-4 py-1 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[#FAF8F5]/80">
          <div className="flex items-center gap-2">
            <span className="font-arabic text-[#D4AF37] font-semibold text-sm">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          </div>

          <div className="flex items-center gap-3">
            {googleEmailConnected && (
              <div className="flex items-center gap-1.5 text-[11px] bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full text-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline font-medium">Google Resmi:</span>
                <span className="font-bold truncate max-w-[150px] sm:max-w-none">{googleEmailConnected}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">Real-time Sinkron</span>
              <span className="text-white/40 hidden md:inline">({lastUpdatedTime ? new Date(lastUpdatedTime).toLocaleTimeString('id-ID') : 'Aktif'})</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Perbarui Data"
              className="p-1 hover:text-[#D4AF37] transition text-white/70 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <LogoEmblem size="md" customLogoUrl={settings.customLogoUrl} />
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Download App di Android Button */}
          <PWAInstallButton />

          {/* Varian Harga Kambing Button */}
          <button
            onClick={onOpenVarianKambing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1E293B] hover:bg-[#334155] border border-[#D4AF37]/40 text-[#FAF8F5] transition shadow-sm hover:border-[#D4AF37]"
          >
            <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>12 Varian Kambing</span>
          </button>

          {/* Google Sheets Integration (Hanya Pengurus) */}
          <button
            onClick={() => {
              if (isAdmin) {
                onOpenAppsScript();
              } else {
                onOpenLogin();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 transition shadow-sm"
            title={isAdmin ? "Buka & Kelola Google Sheets (Pengurus)" : "Hanya Pengurus yang dapat membuka Google Sheets (Klik untuk masuk)"}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Sheets</span>
            {!isAdmin && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Khusus Pengurus
              </span>
            )}
          </button>

          {/* Pengurus / Admin Access */}
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-[#1E293B] border border-amber-500/50 rounded-lg p-1 pl-2.5 shadow-md">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-[#D4AF37]">{activePengurus?.nama || 'Pengurus Aktif'}</span>
              </div>
              <button
                onClick={onOpenLogin}
                className="p-1 hover:text-[#D4AF37] text-white/70 hover:bg-white/10 rounded transition"
                title="Ganti Akun Pengurus / Ubah Kata Sandi"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-1 hover:text-[#D4AF37] text-white/70 hover:bg-white/10 rounded transition"
                title="Pengaturan"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onLogoutAdmin}
                className="flex items-center gap-1 px-2 py-1 rounded bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs transition"
                title="Keluar Mode Pengurus"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] transition shadow-md shadow-[#D4AF37]/20 active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#0A192F]" />
              <span>Masuk Pengurus</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
