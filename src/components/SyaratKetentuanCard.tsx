import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck } from 'lucide-react';

export const SyaratKetentuanCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const syaratList = [
    "Penyetoran tabungan dapat dilakukan setiap saat.",
    "Besarnya penyetoran tabungan tidak dibatasi setiap minggunya.",
    "Setiap penyetoran akan dicatat di buku tabungan ini dan akan terus update lewat Aplikasi Ridho Ok Qurban yang akan dikirim oleh petugas Ridho Ok Qurban melalui WhatsApp.",
    "Apabila di akhir tabungan, peserta ingin mengurangi atau menambahkan uang untuk mendapatkan hewan qurban yang sesuai dengan kapasitas kemampuan maka dipersilahkan.",
    "Apabila terdapat perbedaan antara saldo tabungan yang tertera pada buku peserta dengan pengurus/petugas, maka yang dijadikan pedoman adalah catatan pada pengurus/petugas.",
    "Apabila peserta meninggal dunia, tabungan dapat diteruskan oleh ahli warisnya, sebagaimana yang sudah disepakati.",
    "Ahli waris dapat mengurangi atau menambahkan uang untuk mendapatkan hewan qurban yang sesuai dengan kapasitas kemampuan, maka dipersilahkan.",
    "Dengan mengharap ridho Allah SWT, saya menyatakan niat dan keseriusan penuh untuk berikhtiar menabung secara rutin dalam Program Tabungan Qurban, saya berkomitmen penuh untuk mengikuti Tabungan Qurban ini hingga selesai. Peserta dapat mengawali dengan pembayaran sebesar Rp150.000 sebagai tanda jadi."
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 hover:bg-amber-50/80 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-[#D4AF37]/50 flex items-center justify-center text-[#B8860B] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider flex items-center gap-2">
              <span>Syarat & Ketentuan Program Tabungan Qurban</span>
              <span className="text-[10px] font-normal text-[#8C6D23] bg-amber-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
                Ketentuan Resmi Lembaga
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Panduan, komitmen, dan ketentuan lengkap keikutsertaan program tabungan qurban.
            </p>
          </div>
        </div>

        <button
          className="text-xs font-bold text-[#8C6D23] hover:text-[#B8860B] flex items-center gap-1 p-1.5 rounded-lg bg-amber-100/50 border border-[#D4AF37]/30 transition"
        >
          <span className="hidden sm:inline">{isOpen ? 'Tutup Ringkasan' : 'Baca Ketentuan'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-5 border-t border-slate-100 bg-[#FAF8F5]/50 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {syaratList.map((item, index) => (
              <div 
                key={index}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-start gap-3 text-xs sm:text-sm leading-relaxed"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 text-[#B8860B] font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs font-serif-brand border border-[#D4AF37]/40">
                  {index + 1}
                </div>
                <div className="text-slate-700 font-normal">
                  {item}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 text-center text-xs text-[#8C6D23] font-serif-brand italic">
            "Semoga Allah SWT memberkahi niat suci dan ikhtiar ibadah qurban kita semua. Aamiin."
          </div>
        </div>
      )}
    </div>
  );
};
