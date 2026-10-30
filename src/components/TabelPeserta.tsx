import React, { useState } from 'react';
import { Peserta, formatRupiah } from '../types/qurban';
import {
  Search,
  PlusCircle,
  Eye,
  Receipt,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle,
  Clock,
  Phone,
  MessageCircle,
  LayoutGrid,
  Table as TableIcon,
  Download,
  AlertCircle
} from 'lucide-react';

interface TabelPesertaProps {
  peserta: Peserta[];
  isAdmin: boolean;
  onTambahPeserta: () => void;
  onCatatSetoran: (peserta: Peserta) => void;
  onLihatDetail: (peserta: Peserta) => void;
  onCetakKwitansi: (peserta: Peserta) => void;
  onEditPeserta: (peserta: Peserta) => void;
  onHapusPeserta: (peserta: Peserta) => void;
  onExportPdf: () => void;
}

export const TabelPeserta: React.FC<TabelPesertaProps> = ({
  peserta,
  isAdmin,
  onTambahPeserta,
  onCatatSetoran,
  onLihatDetail,
  onCetakKwitansi,
  onEditPeserta,
  onHapusPeserta,
  onExportPdf
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lunas' | 'Dalam Proses'>('Semua');
  const [viewMode, setViewMode] = useState<'tabel' | 'kartu'>(window.innerWidth < 768 ? 'kartu' : 'tabel');

  // Filtered participants
  const filteredPeserta = peserta.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.nama.toLowerCase().includes(term) ||
      p.kodePeserta.toLowerCase().includes(term) ||
      (p.alamat && p.alamat.toLowerCase().includes(term)) ||
      (p.noHp && p.noHp.includes(term));

    const matchStatus =
      statusFilter === 'Semua' ? true : p.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const getWaLink = (p: Peserta) => {
    if (!p.noHp || p.noHp === '-') return null;
    let cleanPhone = p.noHp.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const sisa = Math.max(0, p.targetKurban - p.totalTerkumpul);
    const text = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Bapak/Ibu ${p.nama},\n\nBerikut rekap Tabungan Qurban "RIDHO OK QURBAN":\n• Kode: ${p.kodePeserta}\n• Alamat: ${p.alamat}\n• Varian: ${p.namaVarian}\n• Target: ${formatRupiah(p.targetKurban)}\n• Terkumpul: ${formatRupiah(p.totalTerkumpul)}\n• Sisa: ${formatRupiah(sisa)}\n• Status: ${p.status.toUpperCase()}\n\nJazakumullah khairan katsiran atas kepercayaan & keistiqomahan dalam tabungan qurban ini.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Dalam Mode Peserta (!isAdmin), pop up / tabel laporan disembunyikan (tidak terlihat)
  // Hanya terlihat saat dalam Mode Pengurus (isAdmin === true)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
      {/* Header controls bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-[#FAF8F5] to-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#0A192F] font-serif-brand flex items-center gap-2">
            <span style={{ fontFamily: 'Trajan Pro, serif', fontWeight: '700' }}>Daftar Peserta & Laporan Tabungan</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8C6D23] border border-[#D4AF37]/30">
              {filteredPeserta.length} Peserta
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua data tersimpan aman secara terpusat, transparan, dan tidak hilang saat halaman di-refresh.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              onClick={onTambahPeserta}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#E5C07B] text-[#0A192F] transition shadow-md shadow-[#D4AF37]/25 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Peserta Baru</span>
            </button>
          )}

          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Ekspor PDF</span>
          </button>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('tabel')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'tabel'
                  ? 'bg-white text-[#0A192F] shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('kartu')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'kartu'
                  ? 'bg-white text-[#0A192F] shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama peserta, kode, atau alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent bg-white shadow-inner"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['Semua', 'Dalam Proses', 'Lunas'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-[#0A192F] text-[#FAF8F5] shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {filteredPeserta.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">Tidak ada data peserta ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">
            Coba sesuaikan kata kunci pencarian atau filter status tabungan.
          </p>
          {isAdmin && (
            <button
              onClick={onTambahPeserta}
              className="mt-4 px-4 py-2 bg-[#D4AF37] text-[#0A192F] font-bold text-xs rounded-xl shadow hover:bg-[#E5C07B] transition"
            >
              + Tambah Peserta Baru
            </button>
          )}
        </div>
      ) : viewMode === 'tabel' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0A192F] text-[#FAF8F5] uppercase text-[11px] tracking-wider border-b border-[#D4AF37]/30">
              <tr>
                <th className="py-3.5 px-4 font-bold">No / Kode</th>
                <th className="py-3.5 px-4 font-bold">Nama Peserta</th>
                <th className="py-3.5 px-4 font-bold">Alamat Peserta</th>
                <th className="py-3.5 px-4 font-bold">Varian Kambing & Target</th>
                <th className="py-3.5 px-4 font-bold">Terkumpul</th>
                <th className="py-3.5 px-4 font-bold">Sisa Target</th>
                <th className="py-3.5 px-4 font-bold text-center">Progres</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPeserta.map((p, idx) => {
                const sisa = Math.max(0, p.targetKurban - p.totalTerkumpul);
                const pct =
                  p.targetKurban > 0
                    ? Math.round((p.totalTerkumpul / p.targetKurban) * 100)
                    : 0;
                const isLunas = p.status === 'Lunas';
                const waLink = getWaLink(p);

                return (
                  <tr
                    key={p.id || `peserta-${idx}`}
                    className="hover:bg-amber-50/40 transition group"
                  >
                    {/* Kode */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                      <span className="font-bold text-[#0A192F] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {p.kodePeserta}
                      </span>
                    </td>

                    {/* Nama */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {p.nama}
                      </div>
                      {p.catatanNiat && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                          "{p.catatanNiat}"
                        </div>
                      )}
                      {p.noHp && p.noHp !== '-' && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{p.noHp}</span>
                        </div>
                      )}
                    </td>

                    {/* Alamat Peserta (Mandatory) */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="flex items-start gap-1.5 text-xs text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-[#B8860B] shrink-0 mt-0.5" />
                        <span className="font-medium leading-snug">
                          {p.alamat || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Varian & Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#0A192F]">
                        {formatRupiah(p.targetKurban)}
                      </div>
                      <div className="text-[11px] text-[#8C6D23] font-medium">
                        {p.namaVarian}
                      </div>
                    </td>

                    {/* Terkumpul */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-emerald-800 text-sm">
                        {formatRupiah(p.totalTerkumpul)}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {p.riwayatSetoran?.length || 0}x setoran
                      </div>
                    </td>

                    {/* Sisa */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          sisa === 0 ? 'text-slate-400' : 'text-orange-700'
                        }`}
                      >
                        {formatRupiah(sisa)}
                      </span>
                    </td>

                    {/* Progres */}
                    <td className="py-3.5 px-4 min-w-[120px]">
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className={pct >= 100 ? 'text-emerald-700' : 'text-slate-600'}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLunas
                              ? 'bg-emerald-600'
                              : 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B]'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isLunas ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>LUNAS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>MENCICIL</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Detail / Riwayat */}
                        <button
                          onClick={() => onLihatDetail(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#0A192F] hover:bg-slate-100 transition"
                          title="Lihat Rincian & Riwayat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cetak Kwitansi */}
                        <button
                          onClick={() => onCetakKwitansi(p)}
                          className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition"
                          title="Cetak Kwitansi Tanda Terima"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Rekap */}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
                            title="Kirim Rekap WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* Pengurus Only Actions */}
                        {isAdmin && (
                          <>
                            {/* Catat Setoran or Cetak Kwitansi when Lunas */}
                            {isLunas ? (
                              <button
                                onClick={() => onCetakKwitansi(p)}
                                className="px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition flex items-center gap-1 shadow-xs"
                                title="Cetak Kwitansi Pelunasan PDF"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Cetak</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onCatatSetoran(p)}
                                className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#D4AF37] hover:bg-[#E5C07B] text-[#0A192F] transition shadow-xs"
                                title="Catat Setoran Baru"
                              >
                                + Setor
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => onEditPeserta(p)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                              title="Edit Peserta & Alamat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Hapus */}
                            <button
                              onClick={() => onHapusPeserta(p)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                              title="Hapus Peserta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View (Mobile & Tablet Friendly) */
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeserta.map((p, idx) => {
            const sisa = Math.max(0, p.targetKurban - p.totalTerkumpul);
            const pct =
              p.targetKurban > 0
                ? Math.round((p.totalTerkumpul / p.targetKurban) * 100)
                : 0;
            const isLunas = p.status === 'Lunas';
            const waLink = getWaLink(p);

            return (
              <div
                key={p.id || `peserta-${idx}`}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#0A192F] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {p.kodePeserta}
                    </span>
                    {isLunas ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        LUNAS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" />
                        MENCICIL
                      </span>
                    )}
                  </div>

                  {/* Nama */}
                  <h3 className="font-bold text-slate-900 text-base">{p.nama}</h3>
                  {p.catatanNiat && (
                    <p className="text-xs text-slate-500 italic mt-0.5">"{p.catatanNiat}"</p>
                  )}

                  {/* Alamat (Mandatory) */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-[#B8860B] shrink-0 mt-0.5" />
                    <span>{p.alamat || 'Alamat belum diisi'}</span>
                  </div>

                  {/* Varian & Biaya */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Varian Hewan</span>
                      <span className="font-bold text-[#8C6D23] line-clamp-1">{p.namaVarian}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Target Biaya</span>
                      <span className="font-bold text-[#0A192F]">{formatRupiah(p.targetKurban)}</span>
                    </div>
                  </div>

                  {/* Terkumpul vs Sisa */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs bg-amber-50/50 p-2 rounded-lg">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Terkumpul</span>
                      <span className="font-black text-emerald-800 text-sm">
                        {formatRupiah(p.totalTerkumpul)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Sisa Target</span>
                      <span className={`font-bold text-sm ${sisa === 0 ? 'text-slate-400' : 'text-orange-700'}`}>
                        {formatRupiah(sisa)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Progres</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLunas
                            ? 'bg-emerald-600'
                            : 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onLihatDetail(p)}
                      className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition"
                      title="Lihat Riwayat Setoran"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onCetakKwitansi(p)}
                      className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition"
                      title="Cetak Kwitansi"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                        title="Kirim ke WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      {isLunas ? (
                        <button
                          onClick={() => onCetakKwitansi(p)}
                          className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 transition flex items-center gap-1"
                          title="Cetak Kwitansi Pelunasan PDF"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onCatatSetoran(p)}
                          className="px-2.5 py-1.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-[#0A192F] font-bold text-xs rounded-lg transition"
                        >
                          + Setor
                        </button>
                      )}
                      <button
                        onClick={() => onEditPeserta(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Data"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onHapusPeserta(p)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
