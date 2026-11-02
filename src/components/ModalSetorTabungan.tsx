import React, { useState, useEffect, useRef } from 'react';
import { Peserta, formatRupiah } from '../types/qurban';
import { X, Wallet, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

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
  const sisa = peserta ? Math.max(0, peserta.targetKurban - peserta.totalTerkumpul) : 0;

  const [jumlahInput, setJumlahInput] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>('');
  const [metode, setMetode] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [keterangan, setKeterangan] = useState<string>('Setoran Cicilan Tabungan Qurban');
  const [penerima, setPenerima] = useState<string>('Pengurus Ridho Ok Qurban');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const prevIsOpenRef = useRef(false);
  const prevPesertaIdRef = useRef<string | null>(null);

  // Initialize form state ONLY when modal transitions from closed -> open or participant changes
  useEffect(() => {
    const isJustOpening = isOpen && !prevIsOpenRef.current;
    const isDifferentParticipant = peserta && peserta.id !== prevPesertaIdRef.current;

    if (isOpen && peserta && (isJustOpening || isDifferentParticipant)) {
      const defaultVal = sisa > 0 && sisa <= 500000 ? sisa : 500000;
      setJumlahInput(defaultVal.toLocaleString('id-ID'));
      setTanggal(new Date().toISOString().slice(0, 10));
      setMetode('Tunai');
      setKeterangan('Setoran Cicilan Tabungan Qurban');
      setPenerima('Pengurus Ridho Ok Qurban');
      setIsLoading(false);
      setErrorMsg('');
      setSuccessMsg('');
      prevPesertaIdRef.current = peserta.id;
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, peserta, sisa]);

  if (!isOpen || !peserta) return null;

  // Clean raw numeric value from user input string (e.g. "1.500.000" -> 1500000)
  const parseNumericValue = (val: string): number => {
    if (!val) return 0;
    const digitsOnly = String(val).replace(/[^0-9]/g, '');
    return digitsOnly ? Number(digitsOnly) : 0;
  };

  const currentNumericAmount = parseNumericValue(jumlahInput);

  // Handle typing in the input field with automatic Indonesian thousand separators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numeric = rawVal.replace(/[^0-9]/g, '');
    if (!numeric) {
      setJumlahInput('');
      setErrorMsg('');
      return;
    }
    const num = Number(numeric);
    setJumlahInput(num.toLocaleString('id-ID'));
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numericAmount = parseNumericValue(jumlahInput);

    if (numericAmount <= 0) {
      setErrorMsg('Nominal setoran harus lebih besar dari Rp 0!');
      return;
    }

    setIsLoading(true);

    const payload = {
      jumlah: numericAmount,
      tanggal: tanggal || new Date().toISOString().slice(0, 10),
      metode,
      keterangan: keterangan.trim() || 'Setoran Cicilan Tabungan Qurban',
      penerima: penerima.trim() || 'Pengurus Ridho Ok Qurban'
    };

    try {
      const success = await onSaveSetoran(peserta.id, payload);
      setIsLoading(false);

      if (success) {
        setSuccessMsg(`Setoran sebesar ${formatRupiah(numericAmount)} berhasil disimpan!`);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg('Gagal menyimpan setoran ke server. Silakan periksa koneksi dan coba lagi.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan setoran.');
    }
  };

  const handleApplyPreset = (amount: number) => {
    setJumlahInput(amount.toLocaleString('id-ID'));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
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
                Peserta: <strong className="text-amber-300">{peserta.nama}</strong> ({peserta.kodePeserta})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Info Ringkasan Sisa Target */}
          <div className="bg-amber-50/80 border border-[#D4AF37]/40 p-3.5 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Terkumpul Saat Ini:</span>
              <span className="font-bold text-emerald-800 text-sm">{formatRupiah(peserta.totalTerkumpul)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Sisa Kekurangan Target:</span>
              <span className="font-bold text-amber-900 text-sm">{formatRupiah(sisa)}</span>
            </div>
          </div>

          {/* Nominal Setoran Input */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
              Nominal Setoran (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={jumlahInput}
                onChange={handleInputChange}
                placeholder="Contoh: 1.500.000"
                className="w-full px-3.5 py-3 text-lg rounded-xl border-2 border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#B8860B] bg-white font-black text-[#0A192F] shadow-inner"
              />
            </div>

            {/* Formatted Currency Preview */}
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">
                Setoran: <strong className="text-[#0A192F] font-black">{formatRupiah(currentNumericAmount)}</strong>
              </span>
              {currentNumericAmount > sisa && sisa > 0 && (
                <span className="text-amber-700 text-[11px] font-bold">
                  (Melebihi sisa kekurangan Rp {formatRupiah(currentNumericAmount - sisa)})
                </span>
              )}
            </div>

            {/* Quick Preset Buttons */}
            <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Pilih Cepat:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset(250000)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
              >
                Rp 250rb
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(500000)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
              >
                Rp 500rb
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(1000000)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
              >
                Rp 1 Juta
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(1500000)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
              >
                Rp 1,5 Juta
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(2000000)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
              >
                Rp 2 Juta
              </button>
              {sisa > 0 && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset(sisa)}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 rounded-lg text-xs font-black transition shadow-xs active:scale-95"
                >
                  Pelunasan ({formatRupiah(sisa)})
                </button>
              )}
            </div>
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Metode Pembayaran
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#D4AF37]"
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#D4AF37]"
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
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] text-xs font-black transition shadow-md shadow-[#D4AF37]/25 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan Setoran...' : 'Simpan Setoran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

