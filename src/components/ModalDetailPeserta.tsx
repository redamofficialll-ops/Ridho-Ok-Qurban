import React, { useState } from 'react';
import { Peserta, formatRupiah, Setoran } from '../types/qurban';
import {
  X,
  MapPin,
  Phone,
  Heart,
  Receipt,
  MessageCircle,
  PlusCircle,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ModalDetailPesertaProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: Peserta | null;
  isAdmin: boolean;
  onCatatSetoran: (peserta: Peserta) => void;
  onCetakKwitansi: (peserta: Peserta) => void;
  onEditPeserta: (peserta: Peserta) => void;
  onHapusSetoran: (pesertaId: string, setoranId: string) => Promise<boolean>;
  onUpdateSetoran?: (pesertaId: string, setoranId: string, payload: { jumlah: number; tanggal: string; metode: string; keterangan: string; penerima: string }) => Promise<boolean>;
}

export const ModalDetailPeserta: React.FC<ModalDetailPesertaProps> = ({
  isOpen,
  onClose,
  peserta,
  isAdmin,
  onCatatSetoran,
  onCetakKwitansi,
  onEditPeserta,
  onHapusSetoran,
  onUpdateSetoran
}) => {
  const [editingSetoran, setEditingSetoran] = useState<Setoran | null>(null);
  const [editJumlah, setEditJumlah] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editMetode, setEditMetode] = useState('Tunai');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editPenerima, setEditPenerima] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  if (!isOpen || !peserta) return null;

  const sisa = Math.max(0, peserta.targetKurban - peserta.totalTerkumpul);
  const pct =
    peserta.targetKurban > 0
      ? Math.round((peserta.totalTerkumpul / peserta.targetKurban) * 100)
      : 0;
  const isLunas = peserta.status === 'Lunas';

  const getWaLink = () => {
    if (!peserta.noHp || peserta.noHp === '-') return null;
    let cleanPhone = peserta.noHp.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const text = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Bapak/Ibu ${peserta.nama},\n\nRekap Tabungan Qurban "RIDHO OK QURBAN":\n• No. Peserta: ${peserta.kodePeserta}\n• Alamat: ${peserta.alamat}\n• Varian: ${peserta.namaVarian}\n• Target: ${formatRupiah(peserta.targetKurban)}\n• Terkumpul: ${formatRupiah(peserta.totalTerkumpul)} (${pct}%)\n• Sisa: ${formatRupiah(sisa)}\n• Status: ${peserta.status.toUpperCase()}\n\nJazakumullah khairan katsiran atas kepercayaan yang diberikan.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const waLink = getWaLink();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 sm:p-6 border-b border-[#D4AF37]/40 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                {peserta.kodePeserta}
              </span>
              {isLunas ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  LUNAS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  MENCICIL ({pct}%)
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#FAF8F5] font-serif-brand">
              {peserta.nama}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>{peserta.alamat}</span>
            </div>
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
          {/* Status Lunas Banner if Lunas */}
          {isLunas && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-3 text-emerald-900 text-xs shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold block text-sm">Status: LUNAS (Target Tercapai 100%)</span>
                <span className="text-[11px] text-emerald-700">
                  Tabungan qurban peserta ini telah lunas sepenuhnya. Tombol tambah setoran ditutup. Gunakan tombol edit (ikon pensil) pada tabel riwayat cicilan di bawah jika ada koreksi input (dapat menyebabkan batal lunas).
                </span>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Varian Hewan</span>
              <span className="text-xs font-bold text-[#8C6D23] block mt-0.5">{peserta.namaVarian}</span>
              <span className="text-sm font-black text-[#0A192F] block mt-1">{formatRupiah(peserta.targetKurban)}</span>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-sm">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">Total Terkumpul</span>
              <span className="text-sm font-black text-emerald-900 block mt-1">{formatRupiah(peserta.totalTerkumpul)}</span>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">{pct}% dari Target</span>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">Sisa Pembayaran</span>
              <span className={`text-sm font-black block mt-1 ${sisa === 0 ? 'text-slate-500' : 'text-orange-700'}`}>
                {formatRupiah(sisa)}
              </span>
              <span className="text-[11px] text-amber-800 font-medium block mt-0.5">
                {sisa === 0 ? 'Target telah terpenuhi' : 'Perlu dicicil kembali'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Progres Tabungan</span>
              <span className={pct >= 100 ? 'text-emerald-700' : 'text-[#8C6D23]'}>
                {formatRupiah(peserta.totalTerkumpul)} / {formatRupiah(peserta.targetKurban)} ({pct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  isLunas ? 'bg-emerald-600' : 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              ></div>
            </div>
          </div>

          {/* Niat & Detail Kontak */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            {peserta.catatanNiat && (
              <div className="flex items-start gap-2 text-slate-700">
                <Heart className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Niat Qurban: </span>
                  <span className="italic">"{peserta.catatanNiat}"</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Terdaftar sejak: {peserta.tanggalDaftar || '-'}</span>
              </div>
              {peserta.noHp && peserta.noHp !== '-' && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp: {peserta.noHp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Setoran Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#B8860B]" />
                <span>Riwayat Setoran Tabungan ({peserta.riwayatSetoran?.length || 0})</span>
              </h3>

              {isAdmin && !isLunas && (
                <button
                  onClick={() => {
                    onClose();
                    onCatatSetoran(peserta);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D4AF37] hover:bg-[#E5C07B] text-[#0A192F] transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tambah Setoran</span>
                </button>
              )}
            </div>

            {(!peserta.riwayatSetoran || peserta.riwayatSetoran.length === 0) ? (
              <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                Belum ada catatan setoran tabungan.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#0A192F] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">No. Kwitansi</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Nominal (Rp)</th>
                        <th className="py-2.5 px-3">Metode</th>
                        <th className="py-2.5 px-3">Penerima</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                        {isAdmin && <th className="py-2.5 px-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {peserta.riwayatSetoran.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {s.nomorKwitansi}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {s.tanggal}
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-800 whitespace-nowrap">
                            {formatRupiah(s.jumlah)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700">
                              {s.metode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {s.penerima || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">
                            {s.keterangan || '-'}
                          </td>
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSetoran(s);
                                    setEditJumlah(String(s.jumlah));
                                    setEditTanggal(s.tanggal);
                                    setEditMetode(s.metode || 'Tunai');
                                    setEditKeterangan(s.keterangan || '');
                                    setEditPenerima(s.penerima || '');
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                                  title="Edit Riwayat Setoran (Bisa Batal Lunas jika total kurang dari target)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus catatan setoran ${formatRupiah(s.jumlah)} ini?`)) {
                                      onHapusSetoran(peserta.id, s.id);
                                    }
                                  }}
                                  className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 rounded-lg transition border border-red-200"
                                  title="Hapus Riwayat Setoran"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCetakKwitansi(peserta)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/50 transition shadow-sm"
            >
              <Receipt className="w-4 h-4" />
              <span>Cetak Kwitansi Tanda Terima</span>
            </button>

            {isAdmin && waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Rekap WhatsApp</span>
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Edit Setoran Modal Sub-dialog */}
      {editingSetoran && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-blue-500 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Cicilan ({editingSetoran.nomorKwitansi})</span>
              </h4>
              <button
                onClick={() => setEditingSetoran(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!onUpdateSetoran) return;
                setIsSubmittingEdit(true);
                const success = await onUpdateSetoran(peserta.id, editingSetoran.id, {
                  jumlah: Number(editJumlah),
                  tanggal: editTanggal,
                  metode: editMetode,
                  keterangan: editKeterangan,
                  penerima: editPenerima
                });
                setIsSubmittingEdit(false);
                if (success) {
                  setEditingSetoran(null);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Setoran (Rp)</label>
                <input
                  type="number"
                  value={editJumlah}
                  onChange={(e) => setEditJumlah(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <span className="text-[10px] text-orange-600 font-medium block mt-1">
                  ⚠️ Perhatian: Mengurangi nominal di bawah target akan menyebabkan status peserta berubah kembali menjadi MENCICIL (Batal Lunas).
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Setoran</label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={editMetode}
                  onChange={(e) => setEditMetode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="QRIS / Digital">QRIS / Digital</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Penerima</label>
                <input
                  type="text"
                  value={editPenerima}
                  onChange={(e) => setEditPenerima(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingSetoran(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan Cicilan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
