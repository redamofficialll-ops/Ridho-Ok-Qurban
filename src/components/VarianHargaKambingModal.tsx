import React, { useState, useEffect } from 'react';
import { HARGA_KAMBING_OPTIONS, formatRupiah, VarianKambingOption } from '../types/qurban';
import { X, Sparkles, Calculator, Check, ArrowRight, HeartHandshake, Tag } from 'lucide-react';
import { WA_CHAT_URL, WhatsAppIcon } from './WhatsAppChatButton';

interface VarianHargaKambingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariantForRegister?: (harga: number) => void;
  isAdmin: boolean;
  varianOptions?: VarianKambingOption[];
  initialSelectedHarga?: number;
}

export const VarianHargaKambingModal: React.FC<VarianHargaKambingModalProps> = ({
  isOpen,
  onClose,
  onSelectVariantForRegister,
  isAdmin,
  varianOptions = [],
  initialSelectedHarga
}) => {
  const optionsToUse = varianOptions.length > 0 ? varianOptions : HARGA_KAMBING_OPTIONS;
  const [selectedHarga, setSelectedHarga] = useState<number>(() => {
    return initialSelectedHarga || optionsToUse[0]?.value || 4500000;
  });
  const [periodeBulan, setPeriodeBulan] = useState<number>(5);
  const modalBodyRef = React.useRef<HTMLDivElement>(null);

  // Sync selected price whenever modal opens or initialSelectedHarga changes from ribbon click
  useEffect(() => {
    if (initialSelectedHarga) {
      setSelectedHarga(initialSelectedHarga);
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    }
  }, [initialSelectedHarga, isOpen]);

  if (!isOpen) return null;

  const currentOption = optionsToUse.find(o => o.value === selectedHarga) || optionsToUse[0];
  const cicilanPerBulan = Math.round(selectedHarga / (periodeBulan || 1));
  const cicilanPerPekan = Math.round(selectedHarga / ((periodeBulan || 1) * 4));

  // Dynamic WhatsApp consultation message with the chosen variant
  const waCustomMessage = encodeURIComponent(
    `Assalamu'alaikum Pengurus Tabungan Qurban "RIDHO OK QURBAN",\n\nSaya tertarik dengan varian hewan qurban:\n• Varian: ${currentOption?.grade}\n• Target Harga: ${formatRupiah(selectedHarga)}\n• Estimasi Cicilan: ~${formatRupiah(cicilanPerBulan)}/bulan (${periodeBulan} bulan)\n\nMohon info pendaftaran dan tata cara setorannya. Jazakumullah khairan.`
  );
  const waTargetUrl = `https://wa.me/6287874586603?text=${waCustomMessage}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-3xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] px-5 py-4 sm:px-6 sm:py-5 border-b border-[#D4AF37]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0 shadow-inner">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Rincian Hewan Qurban
                </span>
                <span className="text-xs text-white/60 hidden sm:inline">1448 H / 2027 M</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white font-serif-brand">
                12 Varian Harga Hewan Kambing
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div ref={modalBodyRef} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* ========================================================================= */}
          {/* HERO BESAR: TAMPILAN VARIAN YANG DIKLIK / DIPILIH LANGSUNG MUNCUL BESAR  */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A192F] via-[#16243C] to-[#0A192F] border-2 border-[#D4AF37] p-5 sm:p-7 text-white shadow-xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              {/* Left Column: Grade & Specs */}
              <div className="space-y-3 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/25 border border-[#D4AF37] text-xs font-bold text-[#D4AF37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Varian Terpilih: {currentOption?.kode || 'Varian'}</span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white font-serif-brand tracking-tight">
                    {currentOption?.grade}
                  </h3>
                  <p className="text-sm text-amber-100/90 mt-1.5 leading-relaxed font-medium">
                    {currentOption?.deskripsi}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-medium">
                    ✓ Syariat Sah & Cukup Umur (Musinnah)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-950/70 text-blue-300 border border-blue-500/40 font-medium">
                    ✓ Sehat & Bebas Cacat
                  </span>
                </div>
              </div>

              {/* Right Column: GIANT PRICE DISPLAY */}
              <div className="bg-[#071324]/90 border-2 border-[#D4AF37]/60 rounded-2xl p-4 sm:p-5 text-center shrink-0 min-w-[260px] shadow-2xl">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#D4AF37] block">
                  Target Biaya Tabungan
                </span>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#D4AF37] font-serif-brand tracking-tight mt-1 mb-2 drop-shadow-md">
                  {formatRupiah(selectedHarga)}
                </div>
                <div className="text-xs text-white/70 border-t border-white/10 pt-2 flex items-center justify-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sesuai Kesepakatan Jamaah</span>
                </div>
              </div>
            </div>

            {/* Interactive Tabungan Simulation Slider & Calculations inside the Hero Box */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/15">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-3">
                <Calculator className="w-4 h-4" />
                <span>Simulasi Cicilan Tabungan untuk {currentOption?.grade}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Month Slider */}
                <div className="md:col-span-6 bg-white/5 rounded-xl p-3.5 border border-white/10">
                  <div className="flex justify-between text-xs text-white/90 mb-2">
                    <span className="font-medium">Durasi Target Menabung:</span>
                    <span className="font-extrabold text-[#D4AF37] text-sm">{periodeBulan} Bulan</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={periodeBulan}
                    onChange={(e) => setPeriodeBulan(Number(e.target.value))}
                    className="w-full accent-[#D4AF37] cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-white/50 mt-1">
                    <span>1 Bulan (Tunai)</span>
                    <span>6 Bulan</span>
                    <span>12 Bulan (1 Tahun)</span>
                  </div>
                </div>

                {/* Per Bulan Display */}
                <div className="md:col-span-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 block">Tabungan Per Bulan</span>
                  <div className="text-lg sm:text-xl font-extrabold text-emerald-300 font-serif-brand mt-0.5">
                    ~{formatRupiah(cicilanPerBulan)}
                  </div>
                  <span className="text-[10px] text-white/60">selama {periodeBulan} bulan</span>
                </div>

                {/* Per Pekan Display */}
                <div className="md:col-span-3 bg-amber-950/60 border border-amber-500/40 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">Atau Per Pekan</span>
                  <div className="text-lg sm:text-xl font-extrabold text-amber-300 font-serif-brand mt-0.5">
                    ~{formatRupiah(cicilanPerPekan)}
                  </div>
                  <span className="text-[10px] text-white/60">per 7 hari</span>
                </div>
              </div>

              {/* Action Buttons for this Selected Variant */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
                <a
                  href={waTargetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl transition shadow-lg shadow-[#25D366]/20 active:scale-95"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>Konsultasi & Tabung Varian Ini ({formatRupiah(selectedHarga)})</span>
                </a>

                {isAdmin && onSelectVariantForRegister && (
                  <button
                    onClick={() => {
                      onSelectVariantForRegister(selectedHarga);
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] font-black text-xs rounded-xl transition shadow-md shadow-[#D4AF37]/30 cursor-pointer active:scale-95"
                  >
                    <span>Daftarkan Peserta dengan Varian Ini</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DAFTAR 12 PILIHAN RESMI (KLIK KOTAK MANA PUN UNTUK LANGSUNG GANTI HERO)  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-[#0A192F] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B8860B]"></span>
                <span>Pilih / Ganti Varian Lainnya (Klik untuk langsung melihat rincian di atas):</span>
              </h4>
              <span className="text-[11px] text-slate-400">Total 12 Pilihan Resmi</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {optionsToUse.map((item) => {
                const isSelected = selectedHarga === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => {
                      setSelectedHarga(item.value);
                      if (modalBodyRef.current) {
                        modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`cursor-pointer rounded-xl p-3 transition text-center relative border-2 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-[#D4AF37] ring-2 ring-[#D4AF37] shadow-md scale-[1.03]'
                        : 'bg-[#FAF8F5] border-slate-200 hover:border-[#D4AF37]/70 hover:bg-amber-50/40 hover:shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#B8860B] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <span className={`text-[10px] font-bold block truncate ${isSelected ? 'text-[#8C6D23]' : 'text-slate-500'}`}>
                      {item.grade.replace('Kambing ', '')}
                    </span>
                    <div className={`text-xs font-black font-serif-brand mt-1 ${isSelected ? 'text-[#0A192F]' : 'text-slate-800'}`}>
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Syariat Hadith Note */}
          <div className="bg-amber-50/70 border border-[#D4AF37]/40 p-3.5 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
            <HeartHandshake className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#8C6D23]">
                "Daging (hewan qurban) dan darahnya itu sekali-kali tidak akan sampai kepada Allah, tetapi yang sampai kepada-Nya adalah ketakwaan kamu." (QS. Al-Hajj: 37)
              </p>
              <p className="text-[11px] text-amber-800">
                Semua varian kambing dipastikan memenuhi ketentuan syariat: sehat, bertanduk/tegap, cukup umur (musinnah), dan dipelihara secara amanah.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <a
            href={waTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            <span>Admin WA: <strong>087874586603</strong></span>
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0A192F] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
