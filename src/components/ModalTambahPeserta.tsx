import React, { useState } from 'react';
import { formatRupiah, VarianKambingOption } from '../types/qurban';
import { X, UserPlus, MapPin, Phone, Heart, Wallet, Check, AlertCircle } from 'lucide-react';

interface ModalTambahPesertaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<boolean>;
  initialVarianHarga?: number;
  varianOptions: VarianKambingOption[];
}

export const ModalTambahPeserta: React.FC<ModalTambahPesertaProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVarianHarga = 4500000,
  varianOptions = []
}) => {
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const [varianKode, setVarianKode] = useState<string>(
    varianOptions.find(o => o.value === initialVarianHarga)?.kode || varianOptions[0]?.kode || ''
  );
  const [catatanNiat, setCatatanNiat] = useState('');
  const [tanggalDaftar, setTanggalDaftar] = useState(new Date().toISOString().slice(0, 10));
  const [setoranAwal, setSetoranAwal] = useState<string>('0');
  const [metodeSetoranAwal, setMetodeSetoranAwal] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [penerima, setPenerima] = useState('Pengurus Ridho OK');
  const [manualSisaTabungan, setManualSisaTabungan] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    if (isOpen && varianOptions.length > 0) {
      const selected = varianOptions.find(o => o.value === initialVarianHarga) || varianOptions[0];
      if (selected) {
        setVarianKode(selected.kode);
      }
    }
  }, [isOpen, initialVarianHarga]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit initiated');
    setErrorMsg('');

    if (!nama.trim()) {
      setErrorMsg('Nama peserta wajib diisi!');
      setCurrentPage(1);
      return;
    }
    if (!alamat.trim()) {
      setErrorMsg('Alamat peserta wajib diisi!');
      setCurrentPage(1);
      return;
    }

    setIsLoading(true);

    const selectedVarian = varianOptions.find(o => o.kode === varianKode);
    const payload = {
      nama: nama.trim(),
      alamat: alamat.trim(),
      noHp: noHp.trim() || '-',
      varianHarga: selectedVarian?.value || 0,
      kodeVarian: varianKode,
      catatanNiat: catatanNiat.trim(),
      tanggalDaftar,
      setoranAwal: Number(setoranAwal) || 0,
      metodeSetoranAwal,
      penerima: penerima.trim(),
      sisaTabungan: manualSisaTabungan !== null ? manualSisaTabungan : (selectedVarian ? Math.max(0, selectedVarian.value - (Number(setoranAwal) || 0)) : 0)
    };

    console.log('Submitting payload:', payload);

    try {
      const success = await onSave(payload);
      console.log('onSave called, success:', success);
      setIsLoading(false);
      if (success) {
        // reset form
        setNama('');
        setAlamat('');
        setNoHp('');
        setCatatanNiat('');
        setSetoranAwal('0');
        setManualSisaTabungan(null);
        setCurrentPage(1);
        onClose();
      } else {
        setErrorMsg('Gagal menyimpan data. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setIsLoading(false);
      setErrorMsg('Terjadi kesalahan saat menyimpan.');
    }
  };

  const selectedTier = varianOptions.find(o => o.kode === varianKode);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 border-b border-[#D4AF37]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#FAF8F5] font-serif-brand">
                Pendaftaran Peserta (Halaman {currentPage} / 3)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {currentPage === 1 && (
            <div className="space-y-4">
              {/* Nama Peserta */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Nama Lengkap Peserta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. H. Ahmad Fauzi / Ibu Khadijah"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium shadow-inner"
                />
              </div>

              {/* Alamat Peserta (Mandatory) */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Alamat Lengkap Peserta <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Jl. Mawar No. 15, RT 02/RW 04, Kelurahan Mekarwangi, Kec. Sukasari"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium shadow-inner resize-none"
                />
              </div>

              {/* Nomor WhatsApp & Tanggal Daftar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Nomor WhatsApp / HP</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Tanggal Terdaftar
                  </label>
                  <input
                    type="date"
                    value={tanggalDaftar}
                    onChange={(e) => setTanggalDaftar(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {currentPage === 2 && (
            <div className="space-y-4">
              {/* Pemilihan Varian Harga Kambing (12 Pilihan) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <label className="text-xs font-bold text-[#0A192F] uppercase tracking-wider block">
                  Pilihan Varian Harga Kambing (Sesuai Kesepakatan & Niat) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Pilih salah satu dari 12 varian harga kambing qurban resmi:
                </p>

                <select
                  value={varianKode}
                  onChange={(e) => {
                    setVarianKode(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border-2 border-[#D4AF37] bg-amber-50/50 font-bold text-[#0A192F] focus:outline-none focus:ring-2 focus:ring-[#B8860B]"
                >
                  {varianOptions.map((item) => (
                    <option key={item.kode} value={item.kode}>
                      {item.label} — {item.grade} ({item.deskripsi.slice(0, 30)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Catatan Niat / Doa */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span>Niat / Doa Qurban (Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Qurban atas nama Ayahanda Alm. H. Ahmad & Keluarga"
                  value={catatanNiat}
                  onChange={(e) => setCatatanNiat(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white font-medium"
                />
              </div>
            </div>
          )}

          {currentPage === 3 && (
            <div className="space-y-4">
              {/* Setoran Awal (Jika Ada) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase">
                  <Wallet className="w-4 h-4 text-[#B8860B]" />
                  <span>Setoran Awal / Uang Muka (Opsional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Nominal (Rp)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="50000"
                        value={setoranAwal}
                        onChange={(e) => {
                          setSetoranAwal(e.target.value);
                          setManualSisaTabungan(null);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-bold text-[#0A192F]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Hitung button clicked');
                          console.log('Current varianKode:', varianKode);
                          console.log('Current setoranAwal:', setoranAwal);
                          const currentTier = varianOptions.find(o => o.kode === varianKode);
                          console.log('Found currentTier:', currentTier);
                          if (currentTier) {
                            const harga = Number(currentTier.value);
                            const bayar = Number(setoranAwal) || 0;
                            const sisa = Math.max(0, harga - bayar);
                            console.log('Calculated sisa:', sisa);
                            setManualSisaTabungan(sisa);
                          } else {
                            console.error('No currentTier found for varianKode:', varianKode);
                          }
                        }}
                        className="px-3 py-2 bg-[#0A192F] text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition"
                      >
                        Hitung
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Metode</label>
                    <select
                      value={metodeSetoranAwal}
                      onChange={(e) => setMetodeSetoranAwal(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium"
                    >
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="Transfer Bank">Transfer Bank (BSI / Lainnya)</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Nama Petugas Penerima</label>
                    <input
                      type="text"
                      value={penerima}
                      onChange={(e) => setPenerima(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium"
                    />
                  </div>
                </div>

                {/* Sisa Tabungan */}
                {selectedTier && manualSisaTabungan !== null && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase">Sisa Tabungan</span>
                    <span className="text-sm font-black text-emerald-800">
                      {formatRupiah(manualSisaTabungan)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Sebelumnya
                </button>
              )}
              {currentPage < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    // Simple validation for page 1
                    if (currentPage === 1 && (!nama.trim() || !alamat.trim())) {
                      setErrorMsg('Nama dan Alamat wajib diisi!');
                      return;
                    }
                    setErrorMsg('');
                    setCurrentPage(p => p + 1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0A192F] text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] text-xs font-bold transition shadow-md shadow-[#D4AF37]/25 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Menyimpan...' : 'Simpan & Daftarkan Peserta'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
