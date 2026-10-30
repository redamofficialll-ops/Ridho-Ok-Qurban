import React from 'react';
import { Peserta, AppSettings, formatRupiah } from '../types/qurban';
import { LogoEmblem } from './LogoEmblem';
import { X, Printer, MessageCircle, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KwitansiModalProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: Peserta | null;
  settings: AppSettings;
}

export const KwitansiModal: React.FC<KwitansiModalProps> = ({
  isOpen,
  onClose,
  peserta,
  settings
}) => {
  if (!isOpen || !peserta) return null;

  const sisa = Math.max(0, peserta.targetKurban - peserta.totalTerkumpul);
  const pct =
    peserta.targetKurban > 0
      ? Math.round((peserta.totalTerkumpul / peserta.targetKurban) * 100)
      : 0;
  const isLunas = peserta.status === 'Lunas';
  const latestSetoran = peserta.riwayatSetoran && peserta.riwayatSetoran.length > 0
    ? peserta.riwayatSetoran[peserta.riwayatSetoran.length - 1]
    : null;

  const noKwitansi = latestSetoran?.nomorKwitansi || `KW-${peserta.kodePeserta}-OFFICIAL`;
  const tanggalKwitansi = latestSetoran?.tanggal || new Date().toISOString().slice(0, 10);

  const handlePrint = async () => {
    try {
      const logoUrl = settings.customLogoUrl || '/logo-qurban.jpg';
      const logoBase64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();

            const offsetX = (img.width - size) / 2;
            const offsetY = (img.height - size) / 2;
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve('');
          }
        };
        img.onerror = () => resolve('');
        img.src = logoUrl;
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(10, 25, 47); // #0A192F
      doc.text('RIDHO OK QURBAN', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(184, 134, 11); // #B8860B
      doc.text(`TANDA TERIMA TABUNGAN QURBAN (${settings.tahunHijriyah || '1448 H'} / ${settings.tahunMasehi || '2027 M'})`, 14, 26);

      // Line
      doc.setDrawColor(212, 175, 55); // #D4AF37
      doc.setLineWidth(0.5);
      doc.line(14, 30, 196, 30);

      // Meta box
      doc.setFillColor(250, 248, 245);
      doc.rect(14, 34, 182, 16, 'F');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`No. Kwitansi: ${noKwitansi}`, 18, 44);
      doc.text(`Kode Peserta: ${peserta.kodePeserta}`, 90, 44);
      doc.text(`Tanggal: ${tanggalKwitansi}`, 150, 44);

      // Biodata
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      let startY = 60;
      const addRow = (label: string, val: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${val}`, 65, startY);
        startY += 7;
      };

      addRow('Telah Diterima Dari', peserta.nama);
      addRow('Alamat Peserta', peserta.alamat);
      addRow('No. Telepon/WhatsApp', peserta.noHp || '-');
      addRow('Varian Hewan Kambing', peserta.namaVarian);
      if (peserta.catatanNiat) {
        addRow('Niat / Peruntukan', peserta.catatanNiat);
      }

      startY += 5;

      // Table 1: Itemized Deposit History
      const tableBody = (peserta.riwayatSetoran || []).map((s) => [
        `${s.nomorKwitansi}\n${s.tanggal}`,
        s.keterangan || 'Setoran Tabungan Qurban',
        `${s.metode} (${s.penerima})`,
        formatRupiah(s.jumlah)
      ]);

      if (tableBody.length === 0) {
        tableBody.push([
          `${noKwitansi}\n${tanggalKwitansi}`,
          'Tabungan Kambing Qurban',
          'Tunai',
          formatRupiah(peserta.totalTerkumpul)
        ]);
      }

      autoTable(doc, {
        startY: startY,
        head: [['No. Kwitansi & Tanggal', 'Uraian / Keterangan', 'Metode & Penerima', 'Nominal Setoran']],
        body: tableBody,
        headStyles: { fillColor: [10, 25, 47], textColor: [212, 175, 55], fontStyle: 'bold' },
        bodyStyles: { textColor: [30, 41, 59], fontSize: 8 },
        theme: 'grid',
      });

      const tableFinalY = (doc as any).lastAutoTable.finalY + 4;

      // Table 2: Financial Summary
      autoTable(doc, {
        startY: tableFinalY,
        head: [['Target Biaya', 'Total Terkumpul', 'Sisa Target']],
        body: [
          [
            formatRupiah(peserta.targetKurban),
            formatRupiah(peserta.totalTerkumpul),
            formatRupiah(sisa)
          ]
        ],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontStyle: 'bold', textColor: [30, 41, 59], fontSize: 9, halign: 'center' },
        theme: 'grid',
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Status & Capaian
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`Status Tabungan Saat Ini: ${peserta.status.toUpperCase()} (${pct}% Capaian)`, 14, finalY);

      const sigY = finalY + 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Peserta Tabungan,', 50, sigY, { align: 'center' });
      doc.text('Panitia RIDHO OK QURBAN,', 150, sigY, { align: 'center' });
      doc.text('Petugas Penerima Amanah', 150, sigY + 4, { align: 'center' });

      // Stamp Image with 30% transparency & circular border
      const stampX = 150;
      const stampY = sigY + 22;
      if (logoBase64) {
        try {
          doc.saveGraphicsState();
          doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
          doc.addImage(logoBase64, 'PNG', stampX - 12, stampY - 12, 24, 24);
          doc.restoreGraphicsState();
        } catch {
          doc.addImage(logoBase64, 'PNG', stampX - 12, stampY - 12, 24, 24);
        }
      }

      doc.setDrawColor(46, 133, 94); // emerald ring border
      doc.setLineWidth(0.6);
      doc.circle(stampX, stampY, 12, 'S');

      // Names & Lines
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(peserta.nama, 50, sigY + 35, { align: 'center' });
      doc.setDrawColor(100, 100, 100);
      doc.line(30, sigY + 37, 70, sigY + 37);

      doc.text(latestSetoran?.penerima || 'Pengurus Ridho Ok Qurban', 150, sigY + 35, { align: 'center' });
      doc.line(130, sigY + 37, 170, sigY + 37);

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Kwitansi sah yang diterbitkan melalui Sistem Keuangan Tabungan Qurban Real-time "RIDHO OK QURBAN".', 14, sigY + 50);

      doc.save(`Kwitansi_${peserta.kodePeserta}_${noKwitansi}.pdf`);
    } catch (e) {
      console.error('PDF generation error, falling back to window.print():', e);
      window.print();
    }
  };

  const getWaLink = () => {
    if (!peserta.noHp || peserta.noHp === '-') return null;
    let cleanPhone = peserta.noHp.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const text = encodeURIComponent(
      `*KWITANSI TANDA TERIMA TABUNGAN QURBAN*\n*RIDHO OK QURBAN (${settings.tahunHijriyah})*\n\n` +
      `No. Kwitansi : ${noKwitansi}\n` +
      `Nama Peserta : ${peserta.nama}\n` +
      `Alamat       : ${peserta.alamat}\n` +
      `Varian Hewan : ${peserta.namaVarian}\n` +
      `Target Biaya : ${formatRupiah(peserta.targetKurban)}\n` +
      `Terkumpul    : ${formatRupiah(peserta.totalTerkumpul)} (${pct}%)\n` +
      `Sisa Target  : ${formatRupiah(sisa)}\n` +
      `Status       : ${peserta.status.toUpperCase()}\n\n` +
      `Jazakumullah Khairan Katsiran atas amanah dan niat tulus qurban ini.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const waLink = getWaLink();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print bg-[#0A192F] text-white p-4 flex items-center justify-between border-b border-[#D4AF37]/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              Pratinjau Kwitansi Digital Resmi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE KWITANSI CONTAINER */}
        <div id="printable-kwitansi" className="p-6 sm:p-8 bg-white text-slate-800">
          {/* Header Kop Surat */}
          <div className="border-b-2 border-double border-[#D4AF37] pb-4 mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoEmblem size="lg" customLogoUrl={settings.customLogoUrl} />
            </div>

            <div className="text-right">
              <div className="text-xs font-arabic text-[#8C6D23] font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
              <h1 className="text-base sm:text-lg font-black text-[#0A192F] font-serif-brand tracking-wider">
                TANDA TERIMA TABUNGAN QURBAN
              </h1>
              <div className="text-xs font-bold text-[#B8860B]">
                RIDHO OK QURBAN {settings.tahunHijriyah || '1447 H'} / {settings.tahunMasehi || '2026 M'}
              </div>
            </div>
          </div>

          {/* Nomor & Tanggal Kwitansi Bar */}
          <div className="bg-[#FAF8F5] border border-[#D4AF37]/40 rounded-xl p-3 mb-5 flex flex-wrap items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Nomor Kwitansi: </span>
              <span className="font-mono font-bold text-[#0A192F]">{noKwitansi}</span>
            </div>
            <div>
              <span className="text-slate-500">Kode Peserta: </span>
              <span className="font-mono font-bold text-[#8C6D23]">{peserta.kodePeserta}</span>
            </div>
            <div>
              <span className="text-slate-500">Tanggal: </span>
              <span className="font-semibold text-slate-800">{tanggalKwitansi}</span>
            </div>
          </div>

          {/* Biodata Peserta & Alamat */}
          <div className="space-y-2.5 text-xs mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Telah Diterima Dari</span>
              <span className="sm:col-span-3 font-bold text-slate-900 text-sm">
                : {peserta.nama}
              </span>
            </div>

            {/* Alamat Peserta (Mandatory & Prominent) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Alamat Peserta</span>
              <span className="sm:col-span-3 font-semibold text-slate-800">
                : {peserta.alamat}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">No. Telepon/WhatsApp</span>
              <span className="sm:col-span-3 text-slate-800">
                : {peserta.noHp || '-'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Varian Hewan Kambing</span>
              <span className="sm:col-span-3 font-bold text-[#8C6D23]">
                : {peserta.namaVarian}
              </span>
            </div>

            {peserta.catatanNiat && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Niat / Peruntukan</span>
                <span className="sm:col-span-3 italic text-slate-700">
                  : "{peserta.catatanNiat}"
                </span>
              </div>
            )}
          </div>

          {/* Rincian Finansial Tabungan & Riwayat Setoran */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0A192F] text-white">
                <tr>
                  <th className="py-2.5 px-3">No. Kwitansi & Tanggal</th>
                  <th className="py-2.5 px-3">Uraian / Keterangan</th>
                  <th className="py-2.5 px-3">Metode & Penerima</th>
                  <th className="py-2.5 px-3 text-right">Nominal Setoran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-[#FAF8F5]/60">
                {peserta.riwayatSetoran && peserta.riwayatSetoran.length > 0 ? (
                  peserta.riwayatSetoran.map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-[#0A192F]">{s.nomorKwitansi}</div>
                        <div className="text-[10px] text-slate-500">{s.tanggal}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{s.keterangan || 'Setoran Tabungan Qurban'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{s.metode}</div>
                        <div className="text-[10px] text-slate-500">{s.penerima}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                        {formatRupiah(s.jumlah)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-center text-slate-500 italic">
                      Belum ada riwayat setoran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ringkasan Target */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="py-2 px-3 text-center">Target Biaya</th>
                  <th className="py-2 px-3 text-center">Total Terkumpul</th>
                  <th className="py-2 px-3 text-center">Sisa Target</th>
                </tr>
              </thead>
              <tbody className="bg-slate-50 font-bold text-center">
                <tr>
                  <td className="py-2.5 px-3 text-slate-800">{formatRupiah(peserta.targetKurban)}</td>
                  <td className="py-2.5 px-3 text-emerald-800">{formatRupiah(peserta.totalTerkumpul)}</td>
                  <td className="py-2.5 px-3 text-orange-700">{formatRupiah(sisa)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Status Badge Box */}
          <div className="p-3.5 rounded-xl border border-dashed border-[#D4AF37] bg-amber-50/50 flex items-center justify-between mb-8">
            <div>
              <span className="text-[11px] text-slate-600 block">Status Tabungan Saat Ini:</span>
              <span className="text-xs font-semibold text-slate-800">
                Progres Capaian: {pct}%
              </span>
            </div>
            {isLunas ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>LUNAS - SIAP HEWAN QURBAN</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#0A192F] text-xs font-black tracking-wider">
                MENCICIL (SISA {formatRupiah(sisa)})
              </div>
            )}
          </div>

          {/* Tanda Tangan & Stempel Resmi */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
            <div>
              <div className="text-slate-500 mb-14">Peserta Tabungan,</div>
              <div className="font-bold text-slate-900 border-b border-slate-400 inline-block px-6 pb-0.5">
                {peserta.nama}
              </div>
            </div>

            <div className="relative">
              <div className="text-slate-500 mb-1">Panitia RIDHO OK QURBAN,</div>
              <div className="text-[10px] text-slate-400 mb-12">Petugas Penerima Amanah</div>

              {/* Decorative Stempel Logo Resmi (30% Transparency) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-2 border-emerald-600/60 bg-emerald-50/20 flex items-center justify-center -rotate-12 pointer-events-none overflow-hidden shadow-sm">
                <img
                  src={settings.customLogoUrl || '/logo-qurban.jpg'}
                  alt="Stempel Panitia"
                  className="w-full h-full object-cover opacity-30 rounded-full"
                />
              </div>

              <div className="font-bold text-slate-900 border-b border-slate-400 inline-block px-6 pb-0.5">
                {latestSetoran?.penerima || 'Pengurus Ridho Ok Qurban'}
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-8 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            * Kwitansi sah yang diterbitkan melalui Sistem Keuangan Tabungan Qurban Real-time "RIDHO OK QURBAN".
          </div>
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="no-print bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4AF37] hover:bg-[#E5C07B] text-[#0A192F] font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </a>
          )}
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
