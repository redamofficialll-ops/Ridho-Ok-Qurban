import React, { useState } from 'react';
import { Peserta, formatRupiah } from '../types/qurban';
import { X, Wallet, CheckCircle2 } from 'lucide-react';

interface ModalSetorTabunganProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: Peserta | null;
  onSaveSetoran: (pesertaId: string, payload: any) => Promise<boolean>;
}

export const ModalSetorTabungan: React.FC<ModalSetorTabunganProps> = ({
  isOpen,
  onClose,
  peserta,
  onSaveSetoran
}) => {
  if (!isOpen || !peserta) return null;

  const sisa = Math.max(0, peserta.targetKurban - peserta.totalTerkumpul);

  const [jumlah, setJumlah] = useState<number>(sisa > 0 && sisa <= 500000 ? sisa : 500000);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [metode, setMetode] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [keterangan, setKeterangan] = useState<string>(`Setoran Cicilan Tabungan Qurban`);
  const [penerima, setPenerima] = useState<string>('Ust. Ridwan (Bendahara)');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumlah || jumlah <= 0) {
      return;
    }

    setIsLoading(true);

    const payload = {
      jumlah: Number(jumlah),
      tanggal,
      metode,
      keterangan: keterangan.trim(),
      penerima: penerima.trim()
    };

    const success = await onSaveSetoran(peserta.id, payload);
    setIsLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 border-b border-[#D4AF37]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#FAF8F5] font-serif-brand">
                Catat Setoran Tabungan Qurban
              </h2>
              <p className="text-xs text-white/70">
                Data setoran akan langsung tercatat di kwitansi & laporan peserta
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
          {/* Nominal Setoran Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
              Nominal Setoran (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1000"
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className="w-full px-3.5 py-3 text-base rounded-xl border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#B8860B] bg-white font-black text-[#0A192F] shadow-inner"
            />
          </div>

          {/* Tanggal & Metode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Tanggal Setoran
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Metode Pembayaran
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="Tunai">Tunai / Cash</option>
                <option value="Transfer Bank">Transfer Bank (BSI / Lainnya)</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          {/* Petugas Penerima & Keterangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Petugas / Pengurus Penerima
              </label>
              <input
                type="text"
                required
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Keterangan / Catatan
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] text-xs font-bold transition shadow-md shadow-[#D4AF37]/25 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan...' : 'Simpan Setoran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
