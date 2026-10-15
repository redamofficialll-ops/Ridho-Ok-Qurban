import React, { useState } from 'react';
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
  ArrowRight,
  Apple
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

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
              <span>Aplikasi Mobile (Android & iOS)</span>
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
              Download RIDHO OK QURBAN
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mt-1">
              Pasang aplikasi di layar utama HP Android atau iPhone (iOS) Anda agar bisa diakses kapan saja seperti aplikasi resmi.
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'android'
                  ? 'bg-[#D4AF37] text-[#0A192F] shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (Chrome)</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'ios'
                  ? 'bg-[#D4AF37] text-[#0A192F] shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>iPhone / iPad (iOS)</span>
            </button>
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
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 text-emerald-600" /> Cepat & Ringan
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3 text-blue-600" /> Mode Offline
                </span>
              </div>
            </div>
          </div>

          {activeTab === 'android' ? (
            <div className="space-y-4">
              {isInstalled ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-emerald-800 font-bold text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Aplikasi Sudah Terpasang di Android Anda!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Buka langsung dari layar utama perangkat Anda kapan saja.
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
                    <span>Cara Pasang di Android (Google Chrome / Samsung Internet):</span>
                  </div>
                  <ol className="space-y-2 text-slate-700 list-decimal list-inside pl-1 text-[12px] leading-relaxed">
                    <li>
                      Ketuk tombol <strong>Menu Titik Tiga (⋮)</strong> di pojok kanan atas browser HP Anda.
                    </li>
                    <li>
                      Pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong> (<em>Add to Home screen</em>).
                    </li>
                    <li>
                      Ketuk <strong>"Install"</strong> pada jendela konfirmasi yang muncul.
                    </li>
                    <li>
                      Ikon aplikasi <strong>RIDHO OK QURBAN</strong> akan otomatis terpasang di Home Screen HP Android Anda!
                    </li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 text-xs text-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Apple className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Panduan Lengkap Download & Pasang di iPhone / iPad (iOS Safari):</span>
                </div>
                <ol className="space-y-2.5 text-slate-700 list-decimal list-inside pl-1 text-[12px] leading-relaxed">
                  <li>
                    Buka aplikasi <strong>Safari</strong> di iPhone atau iPad Anda (Pastikan membuka link web aplikasi ini di Safari).
                  </li>
                  <li>
                    Ketuk ikon <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />) di bilah navigasi bawah Safari.
                  </li>
                  <li>
                    Gulir daftar menu ke bawah, lalu ketuk opsi <strong className="text-blue-900">"Tambah ke Layar Utama"</strong> (<em>Add to Home Screen</em> <PlusSquare className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />).
                  </li>
                  <li>
                    Konfirmasikan nama aplikasi menjadi <strong className="text-slate-900">RIDHO OK QURBAN</strong> lalu ketuk tombol <strong className="text-emerald-700">"Tambah"</strong> di pojok kanan atas layar.
                  </li>
                  <li>
                    Selesai! Ikon aplikasi emas <strong>RIDHO OK QURBAN</strong> sekarang resmi terpasang di Layar Utama iPhone Anda seperti aplikasi App Store!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Keunggulan Aplikasi Mobile */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Keunggulan Aplikasi Mobile RIDHO OK QURBAN:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% Gratis & tanpa instalasi ribet dari App Store/Play Store</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tampilan layar penuh (Full Screen) tanpa bilah URL browser</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sinkronisasi otomatis data tabungan real-time dengan server</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dapat diakses dengan lancar meskipun sinyal offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
