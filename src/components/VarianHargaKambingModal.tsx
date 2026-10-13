import React, { useState } from 'react';
import { HARGA_KAMBING_OPTIONS, formatRupiah, VarianKambingOption } from '../types/qurban';
import { X, Sparkles, Calculator, Check, ArrowRight, HeartHandshake } from 'lucide-react';

interface VarianHargaKambingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariantForRegister?: (harga: number) => void;
  isAdmin: boolean;
  varianOptions?: VarianKambingOption[];
}

export const VarianHargaKambingModal: React.FC<VarianHargaKambingModalProps> = ({
  isOpen,
  onClose,
  onSelectVariantForRegister,
  isAdmin,
  varianOptions = []
}) => {
  const optionsToUse = varianOptions.length > 0 ? varianOptions : HARGA_KAMBING_OPTIONS;
  const [selectedHarga, setSelectedHarga] = useState<number>(optionsToUse[1]?.value || 4500000);
  const [periodeBulan, setPeriodeBulan] = useState<number>(5);

  if (!isOpen) return null;

  const cicilanPerBulan = Math.round(selectedHarga / (periodeBulan || 1));
  const cicilanPerPekan = Math.round(selectedHarga / ((periodeBulan || 1) * 4));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-5xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 sm:p-6 border-b border-[#D4AF37]/40 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Sesuai Kesepakatan & Ketulusan Niat</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#FAF8F5] font-serif-brand">
              Daftar 12 Varian Harga Hewan Kambing
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF8F5]/80">
              Pilihan varian harga kambing qurban RIDHO OK QURBAN yang disepakati bersama jamaah untuk memudahkan ibadah.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Note Banner */}
          <div className="bg-amber-50/80 border-l-4 border-[#B8860B] p-4 rounded-r-xl text-xs sm:text-sm text-amber-950">
            <p className="font-semibold text-[#8C6D23]">
              "Daging (hewan qurban) dan darahnya itu sekali-kali tidak akan sampai kepada Allah, tetapi yang sampai kepada-Nya adalah ketakwaan kamu." (QS. Al-Hajj: 37)
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Setiap hewan kambing dipastikan memenuhi syarat sah syar'i: cukup umur (musinnah/poel), sehat tanpa cacat, terawat, dan ditimbang secara transparan.
            </p>
          </div>

          {/* 12 Variants Grid */}
          <div>
            <h3 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B8860B]" />
              Pilihan Varian Harga (12 Pilihan Resmi)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {optionsToUse.map((item) => {
                const isSelected = selectedHarga === item.value;
                return (
                  <div
                    key={item.value}
                    onClick={() => setSelectedHarga(item.value)}
                    className={`cursor-pointer rounded-xl p-3.5 transition relative border-2 ${
                      isSelected
                        ? 'bg-amber-50/90 border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 scale-[1.02]'
                        : 'bg-white border-slate-200 hover:border-[#D4AF37]/60 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#B8860B] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-[#8C6D23] uppercase block">
                      {item.grade}
                    </span>
                    <div className="text-lg font-black text-[#0A192F] font-serif-brand mt-0.5">
                      {item.label}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {item.deskripsi}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Tabungan Calculator */}
          <div className="bg-[#0A192F] text-[#FAF8F5] rounded-2xl p-5 border border-[#D4AF37]/40 shadow-lg">
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm mb-3">
              <Calculator className="w-4 h-4" />
              <span>Simulasi Target Tabungan & Estimasi Cicilan</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-xs text-white/70 block mb-1">
                  Varian Pilihan
                </label>
                <div className="text-xl font-black text-[#D4AF37] font-serif-brand">
                  {formatRupiah(selectedHarga)}
                </div>
                <div className="text-xs text-white/60">
                  {optionsToUse.find(o => o.value === selectedHarga)?.grade}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">
                  Target Waktu Menabung: <span className="text-[#D4AF37] font-bold">{periodeBulan} Bulan</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={periodeBulan}
                  onChange={(e) => setPeriodeBulan(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/50 mt-1">
                  <span>1 Bulan</span>
                  <span>6 Bulan</span>
                  <span>12 Bulan</span>
                </div>
              </div>

              <div className="bg-[#1E293B] rounded-xl p-3 border border-white/10 flex flex-col justify-center">
                <div className="text-xs text-white/70">Perkiraan Tabungan Rutin:</div>
                <div className="text-base font-extrabold text-emerald-400 mt-1">
                  ~{formatRupiah(cicilanPerBulan)} <span className="text-xs text-white/70 font-normal">/ bulan</span>
                </div>
                <div className="text-xs text-amber-300 font-semibold mt-0.5">
                  atau ~{formatRupiah(cicilanPerPekan)} <span className="text-[10px] text-white/60 font-normal">/ pekan</span>
                </div>
              </div>
            </div>

            {isAdmin && onSelectVariantForRegister && (
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => {
                    onSelectVariantForRegister(selectedHarga);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C07B] text-[#0A192F] font-bold text-xs rounded-lg transition"
                >
                  <span>Daftarkan Peserta dengan Varian Ini</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
