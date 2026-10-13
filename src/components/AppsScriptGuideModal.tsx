import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, FileSpreadsheet, Download, Cloud } from 'lucide-react';
import { AppSettings } from '../types/qurban';

interface AppsScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveWebhookUrl: (url: string) => Promise<boolean>;
  onExportCsv: () => void;
  isAdmin: boolean;
}

export const AppsScriptGuideModal: React.FC<AppsScriptGuideModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveWebhookUrl,
  onExportCsv,
  isAdmin
}) => {
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(settings.appsScriptWebhookUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const appScriptCode = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: RIDHO OK QURBAN - SISTEM TABUNGAN REALTIME & FREE
 * =========================================================================
 * 1. Buka https://sheets.new (Google Spreadsheet Gratis)
 * 2. Beri nama spreadsheet: "Laporan Tabungan Qurban - RIDHO OK QURBAN"
 * 3. Klik menu: Ekstensi > Apps Script
 * 4. Tempel (Paste) seluruh kode di bawah ini, lalu klik Simpan (Ctrl+S)
 * 5. Klik tombol "Jalankan" fungsi "setupSheets" untuk membuat tabel otomatis
 * 6. Klik "Deploy" > "New Deployment" > Jenis: Web app > Who has access: Anyone
 * =========================================================================
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.setName("Peserta_Qurban");
  
  // Format Header
  var headers = [
    ["No", "Kode Peserta", "Nama Peserta", "Alamat Peserta", "No WhatsApp", 
     "Varian Kambing", "Target Biaya (Rp)", "Total Terkumpul (Rp)", 
     "Sisa Target (Rp)", "Status", "Tanggal Daftar", "Niat Qurban"]
  ];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length)
       .setBackground("#0A192F")
       .setFontColor("#FAF8F5")
       .setFontWeight("bold")
       .setHorizontalAlignment("center");
       
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert("✅ Berhasil! Tabel 'RIDHO OK QURBAN' siap digunakan.");
}

// Endpoint HTTP GET untuk dibaca oleh Web App / Peserta
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Peserta_Qurban") || ss.getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    data.push({
      kodePeserta: rows[i][1],
      nama: rows[i][2],
      alamat: rows[i][3],
      noHp: rows[i][4],
      namaVarian: rows[i][5],
      targetKurban: rows[i][6],
      totalTerkumpul: rows[i][7],
      sisa: rows[i][8],
      status: rows[i][9],
      tanggalDaftar: rows[i][10],
      catatanNiat: rows[i][11]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    program: "RIDHO OK QURBAN",
    totalPeserta: data.length,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

// Endpoint HTTP POST untuk menerima data setoran / peserta baru
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Peserta_Qurban") || ss.getActiveSheet();
    
    var lastRow = sheet.getLastRow();
    var no = lastRow;
    var target = Number(contents.targetKurban) || 0;
    var terkumpul = Number(contents.totalTerkumpul) || 0;
    var sisa = Math.max(0, target - terkumpul);
    var status = terkumpul >= target ? "Lunas" : "Dalam Proses";
    
    sheet.appendRow([
      no,
      contents.kodePeserta || ("ROQ-" + Utilities.formatString("%03d", no)),
      contents.nama,
      contents.alamat,
      contents.noHp || "-",
      contents.namaVarian || ("Rp " + target),
      target,
      terkumpul,
      sisa,
      status,
      contents.tanggalDaftar || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
      contents.catatanNiat || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Tersimpan di Google Sheets!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveWebhook = async () => {
    setIsSaving(true);
    const ok = await onSaveWebhookUrl(webhookUrl.trim());
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 sm:p-6 border-b border-[#D4AF37]/40 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Gratis 100% Berbasis Google Apps Script & Sheets</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#FAF8F5] font-serif-brand">
              Integrasi Google Apps Script (RIDHO OK QURBAN)
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              Aplikasi ini sudah menyimpan data secara permanen di server & browser agar tidak hilang saat di-refresh. Anda juga dapat menghubungkannya ke Google Sheets Anda secara gratis.
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
          {/* Quick Explainer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-[#0A192F] text-amber-300 font-bold flex items-center justify-center mb-2">1</span>
              <h4 className="font-bold text-slate-900 mb-1">Buka Google Sheets Gratis</h4>
              <p className="text-slate-500">
                Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">sheets.new</a> dengan akun Google Anda tanpa biaya langganan.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-[#0A192F] text-amber-300 font-bold flex items-center justify-center mb-2">2</span>
              <h4 className="font-bold text-slate-900 mb-1">Salin Script Code.gs</h4>
              <p className="text-slate-500">
                Salin kode di bawah ini, buka <b>Ekstensi &gt; Apps Script</b> di spreadsheet, lalu tempel kode dan klik Simpan.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-[#0A192F] text-amber-300 font-bold flex items-center justify-center mb-2">3</span>
              <h4 className="font-bold text-slate-900 mb-1">Deploy & Sinkron</h4>
              <p className="text-slate-500">
                Jalankan fungsi <code>setupSheets</code> dan deploy sebagai Web App untuk cadangan data di cloud Google Drive.
              </p>
            </div>
          </div>

          {/* Webhook Connection (If Admin) */}
          {isAdmin && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Tautkan URL Web App Google Apps Script (Opsional)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Jika Anda telah men-deploy Web App dari Google Sheets, tempelkan URL-nya di sini untuk sinkronisasi otomatis:
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <button
                  onClick={handleSaveWebhook}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan URL'}
                </button>
              </div>
              {saveSuccess && (
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>URL Google Apps Script berhasil disimpan!</span>
                </div>
              )}
            </div>
          )}

          {/* Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <span>Kode Sumber:</span>
                <code className="text-[#8C6D23] bg-amber-100/70 px-2 py-0.5 rounded">Code.gs</code>
              </span>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] font-bold text-xs rounded-lg transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Kode Apps Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-[#0F172A] text-slate-200 text-xs font-mono max-h-80 overflow-y-auto p-4 shadow-inner">
              <pre>{appScriptCode}</pre>
            </div>
          </div>

          {/* Direct CSV Alternative */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-[#D4AF37]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-[#8C6D23]">
                Atau Unduh File Data Langsung (.CSV / Excel)
              </h4>
              <p className="text-slate-600 mt-0.5">
                Dapat langsung dibuka di Microsoft Excel, Google Spreadsheet, atau aplikasi spreadsheet lainnya.
              </p>
            </div>
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-[#E5C07B] text-[#0A192F] font-bold rounded-lg transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV Sekarang</span>
            </button>
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
