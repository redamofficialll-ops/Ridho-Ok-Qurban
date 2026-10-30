import React, { useState, useEffect } from 'react';
import { Peserta, HARGA_KAMBING_OPTIONS, VarianKambingOption, formatRupiah } from '../types/qurban';
import { X, Edit2, MapPin, Phone, Heart, Check, AlertCircle } from 'lucide-react';

interface ModalEditPesertaProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: Peserta | null;
  onUpdatePeserta: (pesertaId: string, payload: any) => Promise<boolean>;
  varianOptions?: VarianKambingOption[];
}

export const ModalEditPeserta: React.FC<ModalEditPesertaProps> = ({
  isOpen,
  onClose,
  peserta,
  onUpdatePeserta,
  varianOptions = []
}) => {
  const optionsToUse = varianOptions.length > 0 ? varianOptions : HARGA_KAMBING_OPTIONS;
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const [varianKode, setVarianKode] = useState<string>('');
  const [catatanNiat, setCatatanNiat] = useState('');
  const [tanggalDaftar, setTanggalDaftar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const previousPesertaId = React.useRef<string | null>(null);

  useEffect(() => {
    if (peserta && peserta.id !== previousPesertaId.current) {
      previousPesertaId.current = peserta.id;
      setNama(peserta.nama || '');
      setAlamat(peserta.alamat || '');
      setNoHp(peserta.noHp || '');
      // If codeVarian is available, use it, otherwise map harga to kode
      setVarianKode(peserta.kodeVarian || optionsToUse.find(o => o.value === peserta.varianHarga)?.kode || optionsToUse[0]?.kode || '');
      setCatatanNiat(peserta.catatanNiat || '');
      setTanggalDaftar(peserta.tanggalDaftar || '');
    } else if (!peserta) {
      previousPesertaId.current = null;
    }
  }, [peserta, optionsToUse]);

  if (!isOpen || !peserta) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama peserta wajib diisi!');
      return;
    }
    if (!alamat.trim()) {
      setErrorMsg('Alamat peserta wajib diisi!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const selectedVarian = optionsToUse.find(o => o.kode === varianKode);
    const payload = {
      nama: nama.trim(),
      alamat: alamat.trim(),
      noHp: noHp.trim() || '-',
      varianHarga: selectedVarian?.value || 0,
      kodeVarian: varianKode,
      catatanNiat: catatanNiat.trim(),
      tanggalDaftar
    };

    const success = await onUpdatePeserta(peserta.id, payload);
    setIsLoading(false);
    if (success) {
      onClose();
    }
  };

  const selectedTier = optionsToUse.find(o => o.kode === varianKode);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 border-b border-[#D4AF37]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#FAF8F5] font-serif-brand">
                Ubah Data Peserta ({peserta.kodePeserta})
              </h2>
              <p className="text-xs text-white/70">
                Perbarui nama, alamat, nomor kontak, atau varian target kambing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Peserta */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Nama Lengkap Peserta <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setNama('')}
                className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition"
              >
                <X className="w-3 h-3" /> Hapus
              </button>
            </div>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium shadow-inner"
            />
          </div>

          {/* Alamat Peserta (Mandatory) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Alamat Lengkap Peserta <span className="text-red-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={() => setAlamat('')}
                className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition"
              >
                <X className="w-3 h-3" /> Hapus
              </button>
            </div>
            <textarea
              required
              rows={2}
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium shadow-inner resize-none"
            />
          </div>

          {/* Nomor WhatsApp & Tanggal Daftar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>Nomor WhatsApp / HP</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNoHp('')}
                  className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition"
                >
                  <X className="w-3 h-3" /> Hapus
                </button>
              </div>
              <input
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tanggal Terdaftar
                </label>
                <button
                  type="button"
                  onClick={() => setTanggalDaftar('')}
                  className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition"
                >
                  <X className="w-3 h-3" /> Hapus
                </button>
              </div>
              <input
                type="date"
                value={tanggalDaftar}
                onChange={(e) => setTanggalDaftar(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium"
              />
            </div>
          </div>

          {/* Pemilihan Varian Harga Kambing (12 Pilihan) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <label className="text-xs font-bold text-[#0A192F] uppercase tracking-wider block">
              Pilihan Varian Harga Kambing (12 Pilihan Resmi) <span className="text-red-500">*</span>
            </label>
            <select
              value={varianKode}
              onChange={(e) => {
                setVarianKode(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-[#D4AF37] bg-amber-50/50 font-bold text-[#0A192F] focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
            >
              {optionsToUse.map((item) => (
                <option key={item.kode} value={item.kode}>
                  {item.label} — {item.grade}
                </option>
              ))}
            </select>

            {selectedTier && (
              <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-[#D4AF37]/40 text-xs text-amber-950 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#B8860B]" />
                <span className="font-semibold text-[#8C6D23]">Target Baru: {formatRupiah(selectedTier.value)}</span>
              </div>
            )}
          </div>

          {/* Catatan Niat */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>Niat / Doa Qurban</span>
              </label>
              <button
                type="button"
                onClick={() => setCatatanNiat('')}
                className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition"
              >
                <X className="w-3 h-3" /> Hapus
              </button>
            </div>
            <input
              type="text"
              value={catatanNiat}
              onChange={(e) => setCatatanNiat(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setNama('');
                setAlamat('');
                setNoHp('');
                setCatatanNiat('');
                setTanggalDaftar('');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Kosongkan Form
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] text-xs font-bold transition shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Edit2 className="w-4 h-4" />
                <span>{isLoading ? 'Menyimpan...' : 'Perbarui Data Peserta'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
