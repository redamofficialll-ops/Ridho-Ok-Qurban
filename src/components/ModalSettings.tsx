import React, { useState } from 'react';
import { AppSettings } from '../types/qurban';
import { X, Settings, Key, Building2, Calendar, Phone, CreditCard, Image, Check, AlertCircle } from 'lucide-react';

interface ModalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
}

export const ModalSettings: React.FC<ModalSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [namaProgram, setNamaProgram] = useState(settings.namaProgram || 'RIDHO OK QURBAN');
  const [namaLembaga, setNamaLembaga] = useState(settings.namaLembaga || 'RIDHO OK QURBAN');
  const [targetIdulAdha, setTargetIdulAdha] = useState(settings.targetIdulAdha || '2027-05-16');
  const [tahunHijriyah, setTahunHijriyah] = useState(settings.tahunHijriyah || '1448 H');
  const [tahunMasehi, setTahunMasehi] = useState(settings.tahunMasehi || '2027 M');
  const [adminPin, setAdminPin] = useState('');
  const [kontakPengurus, setKontakPengurus] = useState(settings.kontakPengurus || '');
  const [rekeningTujuan, setRekeningTujuan] = useState(settings.rekeningTujuan || '');
  const [customLogoUrl, setCustomLogoUrl] = useState(settings.customLogoUrl || '');
  const [authorizedGoogleEmail, setAuthorizedGoogleEmail] = useState(settings.authorizedGoogleEmail || 'redamofficialll@gmail.com');

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const previousIsOpen = React.useRef(false);

  React.useEffect(() => {
    if (isOpen && !previousIsOpen.current) {
      setNamaProgram(settings.namaProgram || 'RIDHO OK QURBAN');
      setNamaLembaga(settings.namaLembaga || 'RIDHO OK QURBAN');
      setTargetIdulAdha(settings.targetIdulAdha || '2027-05-16');
      setTahunHijriyah(settings.tahunHijriyah || '1448 H');
      setTahunMasehi(settings.tahunMasehi || '2027 M');
      setKontakPengurus(settings.kontakPengurus || '');
      setRekeningTujuan(settings.rekeningTujuan || '');
      setCustomLogoUrl(settings.customLogoUrl || '');
      setAuthorizedGoogleEmail(settings.authorizedGoogleEmail || 'redamofficialll@gmail.com');
      setAdminPin('');
      setIsUploadingLogo(false);
      setErrorMsg('');
      setSuccessMsg('');
    }
    previousIsOpen.current = isOpen;
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran file logo maksimal 2MB!');
        return;
      }
      setIsUploadingLogo(true);
      setErrorMsg('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogoUrl(reader.result as string);
        setIsUploadingLogo(false);
      };
      reader.onerror = () => {
        setIsUploadingLogo(false);
        setErrorMsg('Gagal membaca file logo.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingLogo) {
      setErrorMsg('Mohon tunggu sebentar, logo sedang dimuat...');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload: Partial<AppSettings> = {
      namaProgram: namaProgram.trim(),
      namaLembaga: namaLembaga.trim(),
      targetIdulAdha,
      tahunHijriyah: tahunHijriyah.trim(),
      tahunMasehi: tahunMasehi.trim(),
      kontakPengurus: kontakPengurus.trim(),
      rekeningTujuan: rekeningTujuan.trim(),
      customLogoUrl,
      authorizedGoogleEmail: authorizedGoogleEmail.trim().toLowerCase()
    };

    if (adminPin.trim()) {
      payload.adminPin = adminPin.trim();
    }

    const success = await onSaveSettings(payload);
    setIsLoading(false);
    if (success) {
      setSuccessMsg('Pengaturan berhasil disimpan!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg('Gagal menyimpan pengaturan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 border-b border-[#D4AF37]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#FAF8F5] font-serif-brand">
                Pengaturan Sistem & Panitia
              </h2>
              <p className="text-xs text-white/70">
                Kelola informasi lembaga, PIN keamanan, dan data rekening tabungan
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

          {successMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Logo Kustom Upload */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden shrink-0">
              {customLogoUrl ? (
                <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Image className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Logo Khusus Panitia (Opsional)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Unggah file gambar logo resmi untuk ditampilkan di aplikasi & kwitansi:
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0A192F] file:text-[#D4AF37] hover:file:bg-[#1E293B] cursor-pointer"
              />
              {customLogoUrl && (
                <button
                  type="button"
                  onClick={() => setCustomLogoUrl('')}
                  className="mt-1 text-[11px] text-red-600 hover:underline block"
                >
                  Hapus Logo Kustom (Gunakan Logo Medali Emas Default)
                </button>
              )}
            </div>
          </div>

          {/* Nama Lembaga & Program */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Nama Program
              </label>
              <input
                type="text"
                value={namaProgram}
                onChange={(e) => setNamaProgram(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-[#0A192F]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Nama Lembaga / Masjid</span>
              </label>
              <input
                type="text"
                value={namaLembaga}
                onChange={(e) => setNamaLembaga(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>

          {/* Periode Hijriyah & Masehi & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Tahun Hijriyah
              </label>
              <input
                type="text"
                value={tahunHijriyah}
                onChange={(e) => setTahunHijriyah(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Tahun Masehi
              </label>
              <input
                type="text"
                value={tahunMasehi}
                onChange={(e) => setTahunMasehi(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Target Idul Adha</span>
              </label>
              <input
                type="date"
                value={targetIdulAdha}
                onChange={(e) => setTargetIdulAdha(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>

          {/* Rekening Tujuan Tabungan & Kontak */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Informasi Rekening Bank Tujuan Tabungan</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Bank Syariah Indonesia (BSI) No. Rek: 7788990011 a.n. Tabungan Qurban Ridho"
                value={rekeningTujuan}
                onChange={(e) => setRekeningTujuan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kontak Layanan Pengurus (WhatsApp)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 087874586603 (Admin Ridho Ok Qurban)"
                value={kontakPengurus}
                onChange={(e) => setKontakPengurus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
              />
            </div>

            {/* Single Authorized Google Account (Rule 9) */}
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-1">
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Akun Google Sheet Resmi (Hanya 1 Akun Terhubung Langsung)</span>
              </label>
              <input
                type="email"
                placeholder="email.panitia@gmail.com"
                value={authorizedGoogleEmail}
                onChange={(e) => setAuthorizedGoogleEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 bg-white font-mono text-slate-800"
              />
              <p className="text-[11px] text-blue-700/80">
                Hanya 1 akun Google ini yang berwenang menghubungkan dan menyinkronkan data langsung ke Google Sheets.
              </p>
            </div>
          </div>

          {/* Ganti PIN Keamanan */}
          <div className="bg-amber-50/80 p-4 rounded-xl border border-[#D4AF37]/50 space-y-2">
            <label className="text-xs font-bold text-[#8C6D23] uppercase tracking-wider block flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#B8860B]" />
              <span>Ganti PIN Pengurus (Kosongkan jika tidak diubah)</span>
            </label>
            <input
              type="password"
              placeholder="Masukkan PIN baru (angka)"
              maxLength={8}
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold"
            />
            <p className="text-[11px] text-slate-500">
              PIN ini digunakan untuk masuk ke mode Pengurus untuk menambah/mengedit peserta dan setoran.
            </p>
          </div>

          {/* Footer */}
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
              className="px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] text-xs font-bold transition shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
