import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  X,
  Smartphone,
  DownloadCloud,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  WifiOff,
  Zap,
  ArrowRight
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 sm:p-6 border-b border-[#D4AF37]/40 relative">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold border border-[#D4AF37]/40">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Aplikasi Android (PWA)</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#FAF8F5] font-serif-brand">
              Download RIDHO OK QURBAN di Android
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mt-1">
              Pasang langsung di layar utama smartphone Android Anda tanpa perlu membuka browser.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* App Card Preview */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <img
              src="/pwa-192x192.png"
              alt="RIDHO OK QURBAN"
              className="w-16 h-16 rounded-2xl border-2 border-[#D4AF37] shadow-md object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-slate-900 text-sm sm:text-base font-serif-brand truncate">
                RIDHO OK QURBAN
              </h3>
              <p className="text-xs text-slate-500">Laporan Tabungan Qurban Real-time</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 text-emerald-600" /> Cepat & Ringan
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3 text-blue-600" /> Mode Offline
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-800 font-bold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Aplikasi Sudah Terpasang di Smartphone Anda!</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Anda dapat membukanya langsung dari layar utama perangkat Android Anda kapan saja.
              </p>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-[#D4AF37] via-[#C59B27] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] font-black text-sm rounded-2xl shadow-lg shadow-[#D4AF37]/30 transition transform active:scale-95 flex items-center justify-center gap-2.5"
            >
              <DownloadCloud className="w-5 h-5 text-[#0A192F]" />
              <span>Download & Pasang Sekarang di Android</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 text-xs text-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cara Download / Pasang Cepat di Android (Google Chrome):</span>
              </div>
              <ol className="space-y-2 text-slate-700 list-decimal list-inside pl-1 text-[12px] leading-relaxed">
                <li>
                  Ketuk tombol <strong>Menu Titik Tiga (⋮)</strong> di pojok kanan atas browser Chrome / Samsung Internet Anda.
                </li>
                <li>
                  Pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong> (<em>Add to Home screen</em>).
                </li>
                <li>
                  Ketuk <strong>"Install"</strong> pada jendela konfirmasi.
                </li>
                <li>
                  Ikon aplikasi <strong>RIDHO OK QURBAN</strong> akan otomatis muncul di layar utama (home screen) HP Android Anda seperti aplikasi Play Store!
                </li>
              </ol>
            </div>
          )}

          {/* iOS Safari Fallback */}
          {isIOS && !isInstalled && (
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 text-xs text-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Untuk Pengguna iPhone / iPad (iOS Safari):</span>
              </div>
              <ol className="space-y-1.5 text-slate-700 list-decimal list-inside pl-1 text-[11px]">
                <li>Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah Safari.</li>
                <li>Gulir ke bawah dan ketuk <strong>"Tambah ke Layar Utama"</strong> (<em>Add to Home Screen</em>).</li>
                <li>Ketuk <strong>"Tambah"</strong> di pojok kanan atas.</li>
              </ol>
            </div>
          )}

          {/* Keunggulan Aplikasi Android */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Keunggulan Aplikasi Android RIDHO OK QURBAN:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% Gratis & tanpa membebani memori HP</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Layar penuh (Full Screen) tanpa bilah URL</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sinkronisasi otomatis saat terhubung internet</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Bisa dibuka saat koneksi offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
