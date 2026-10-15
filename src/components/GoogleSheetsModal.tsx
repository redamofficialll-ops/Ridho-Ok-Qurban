import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, googleLogout, getAccessToken, initAuth, getSavedGoogleUser } from '../services/googleAuth';
import {
  extractSpreadsheetId,
  fetchSpreadsheetDetails,
  populateSheetData,
  readSheetData,
  populateVarianKambingSheet,
  readVarianKambingSheet,
  populateRiwayatSetoranSheet,
  listDriveSheets,
  DriveSpreadsheetFile
} from '../services/googleSheets';
import { Peserta, AppSettings } from '../types/qurban';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertCircle,
  LogOut,
  FolderOpen,
  Link as LinkIcon,
  Radio,
  Lock,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
  UserCheck,
  Check
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pesertaList: Peserta[];
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  onUpdatePesertaFromSheets?: (importedPeserta: Peserta[]) => void;
  onExportPdf: () => void;
  isAdmin: boolean;
  onOpenLogin: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  pesertaList,
  settings,
  onSaveSettings,
  onUpdatePesertaFromSheets,
  onExportPdf,
  isAdmin,
  onOpenLogin
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Authorized single Google account
  const defaultAuthorizedEmail = settings.authorizedGoogleEmail || 'redamofficialll@gmail.com';
  const [authorizedEmailInput, setAuthorizedEmailInput] = useState<string>(defaultAuthorizedEmail);
  const [isEditingAuthorizedEmail, setIsEditingAuthorizedEmail] = useState(false);

  // Spreadsheet connection state
  const [spreadsheetInput, setSpreadsheetInput] = useState<string>(
    settings.connectedSpreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${settings.connectedSpreadsheetId}/edit`
      : ''
  );
  const [connectedId, setConnectedId] = useState<string>(settings.connectedSpreadsheetId || '');
  const [connectedTitle, setConnectedTitle] = useState<string>(settings.connectedSpreadsheetTitle || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoSync, setAutoSync] = useState<boolean>(settings.autoSyncSheets ?? true);

  // Drive sheets list
  const [existingSheets, setExistingSheets] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  // Live embed preview toggle
  const [showLiveEmbed, setShowLiveEmbed] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(settings.isSheetsLocked ?? false);

  // Operations state
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize Google Auth state from persistent storage and Firebase
  useEffect(() => {
    const saved = getSavedGoogleUser();
    if (saved) {
      setGoogleUser(saved as any);
      loadDriveFiles();
    }

    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user as any);
        if (token) {
          loadDriveFiles();
        }
      },
      () => {
        const stillSaved = getSavedGoogleUser();
        if (!stillSaved) {
          setGoogleUser(null);
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Keep state synced with settings
  useEffect(() => {
    if (settings.connectedSpreadsheetId) {
      setConnectedId(settings.connectedSpreadsheetId);
      setConnectedTitle(settings.connectedSpreadsheetTitle || 'Google Spreadsheet Terhubung');
      if (!spreadsheetInput) {
        setSpreadsheetInput(`https://docs.google.com/spreadsheets/d/${settings.connectedSpreadsheetId}/edit`);
      }
    }
    if (settings.authorizedGoogleEmail) {
      setAuthorizedEmailInput(settings.authorizedGoogleEmail);
    }
    if (settings.isSheetsLocked !== undefined) {
      setIsLocked(settings.isSheetsLocked);
    }
  }, [settings.connectedSpreadsheetId, settings.connectedSpreadsheetTitle, settings.authorizedGoogleEmail, settings.isSheetsLocked]);

  const loadDriveFiles = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      setIsLoadingSheets(true);
      const files = await listDriveSheets(token);
      setExistingSheets(files);
    } catch (err: any) {
      console.warn('Error loading drive sheets:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const targetEmail = (settings.authorizedGoogleEmail || defaultAuthorizedEmail).trim();
      const res = await googleSignIn(targetEmail);
      if (res) {
        setGoogleUser(res.user);
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung dengan Akun Google Resmi: ${res.user.email}`
        });

        // Ensure authorized email is locked in settings
        if (!settings.authorizedGoogleEmail) {
          await onSaveSettings({ authorizedGoogleEmail: res.user.email || '' });
        }

        const files = await listDriveSheets(res.accessToken);
        setExistingSheets(files);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Gagal masuk dengan Google.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setExistingSheets([]);
    setStatusMessage(null);
  };

  const handleSaveAuthorizedEmail = async () => {
    if (!authorizedEmailInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Email akun resmi tidak boleh kosong.' });
      return;
    }
    const clean = authorizedEmailInput.trim().toLowerCase();
    await onSaveSettings({ authorizedGoogleEmail: clean });
    setIsEditingAuthorizedEmail(false);
    setStatusMessage({
      type: 'success',
      text: `Akun Google Sheet resmi tunggal diperbarui menjadi: ${clean}`
    });
  };

  // Connect to an existing spreadsheet (NEVER creates a new spreadsheet)
  const handleConnectSpreadsheet = async () => {
    if (!spreadsheetInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Masukkan link atau ID Google Spreadsheet yang sudah Anda buat.'
      });
      return;
    }

    const cleanId = extractSpreadsheetId(spreadsheetInput);
    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'Format link atau ID Google Spreadsheet tidak valid.' });
      return;
    }

    try {
      setIsConnecting(true);
      setStatusMessage(null);
      const token = await getAccessToken();

      if (token) {
        // Verify access to existing spreadsheet
        const details = await fetchSpreadsheetDetails(token, cleanId);
        setConnectedId(cleanId);
        setConnectedTitle(details.title);
        setIsLocked(true);

        // Save to settings & lock
        await onSaveSettings({
          connectedSpreadsheetId: cleanId,
          connectedSpreadsheetTitle: details.title,
          autoSyncSheets: true,
          isSheetsLocked: true
        });

        // Instant initial sync of peserta data
        try {
          await populateSheetData(token, cleanId, details.sheetName, details.sheetId, pesertaList);
          await onSaveSettings({ lastSheetsSyncTime: new Date().toISOString() });
        } catch (syncErr) {
          console.warn('Initial sync warning:', syncErr);
        }

        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung ke "${details.title}", DIKUNCI PERMANEN, dan tersinkronisasi secara real-time!`
        });
      } else {
        // Save link and lock permanently in settings
        setConnectedId(cleanId);
        setConnectedTitle('Google Spreadsheet Panitia');
        setIsLocked(true);
        await onSaveSettings({
          connectedSpreadsheetId: cleanId,
          connectedSpreadsheetTitle: 'Google Spreadsheet Panitia',
          autoSyncSheets: true,
          isSheetsLocked: true
        });
        setStatusMessage({
          type: 'success',
          text: 'Tautan Google Spreadsheet berhasil disimpan dan DIKUNCI PERMANEN! Masuk dengan Google resmi untuk mengaktifkan sinkronisasi langsung.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menghubungkan Google Spreadsheet. Pastikan ID/link benar dan akun memiliki hak akses.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Toggle permanent lock
  const handleToggleLock = async () => {
    const nextState = !isLocked;
    setIsLocked(nextState);
    await onSaveSettings({ isSheetsLocked: nextState });
    setStatusMessage({
      type: 'success',
      text: nextState
        ? '🔒 Tautan Google Spreadsheet telah DIKUNCI PERMANEN dan tidak dapat dirubah!'
        : 'Kunci tautan spreadsheet telah dibuka.'
    });
  };

  // Push data (write to the connected spreadsheet)
  const handlePushData = async () => {
    if (!connectedId) {
      setStatusMessage({ type: 'error', text: 'Hubungkan Google Spreadsheet terlebih dahulu.' });
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        setStatusMessage({ type: 'error', text: 'Silakan masuk dengan akun Google terlebih dahulu.' });
        return;
      }

      setIsPushing(true);
      setStatusMessage(null);

      const details = await fetchSpreadsheetDetails(token, connectedId);
      await populateSheetData(token, connectedId, details.sheetName, details.sheetId, pesertaList);
      
      // Sync Varian_Kambing
      try {
        await populateVarianKambingSheet(token, connectedId, details.sheetId);
      } catch (e) {
        console.warn('Gagal sinkronisasi Varian_Kambing:', e);
      }

      // Sync Riwayat_Setoran
      try {
        await populateRiwayatSetoranSheet(token, connectedId, pesertaList);
      } catch (e) {
        console.warn('Gagal sinkronisasi Riwayat_Setoran:', e);
      }

      const nowIso = new Date().toISOString();
      await onSaveSettings({ lastSheetsSyncTime: nowIso });

      setStatusMessage({
        type: 'success',
        text: `Sukses! Seluruh data ${pesertaList.length} peserta telah disinkronkan real-time ke "${connectedTitle}".`
      });
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') {
        setStatusMessage({ type: 'error', text: 'Sesi Google Anda telah berakhir. Silakan Putus Akun Google lalu Masuk kembali.' });
      } else {
        setStatusMessage({ type: 'error', text: err.message || 'Gagal mengirim data ke Google Sheets.' });
      }
    } finally {
      setIsPushing(false);
    }
  };

  // Pull data (read from the connected spreadsheet into the app)
  const handlePullData = async () => {
    if (!connectedId) {
      setStatusMessage({ type: 'error', text: 'Hubungkan Google Spreadsheet terlebih dahulu.' });
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        setStatusMessage({ type: 'error', text: 'Silakan masuk dengan akun Google terlebih dahulu.' });
        return;
      }

      setIsPulling(true);
      setStatusMessage(null);

      const details = await fetchSpreadsheetDetails(token, connectedId);
      const imported = await readSheetData(token, connectedId, details.sheetName);

      if (imported.length === 0) {
        setStatusMessage({
          type: 'error',
          text: `Tidak ada baris data peserta yang ditemukan pada spreadsheet "${connectedTitle}".`
        });
      } else {
        if (onUpdatePesertaFromSheets) {
          onUpdatePesertaFromSheets(imported);
        }
        
        // Also pull and sync latest Varian_Kambing options from spreadsheet
        try {
          const variants = await readVarianKambingSheet(token, connectedId);
          if (variants && variants.length > 0) {
            await fetch('/api/qurban/varian-kambing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ varianKambing: variants })
            });
          }
        } catch {}

        setStatusMessage({
          type: 'success',
          text: `Berhasil membaca & mengimpor ${imported.length} peserta dan menyinkronkan 12 Varian Kambing dari spreadsheet!`
        });
      }
    } catch (err: any) {
      if (err.message === 'AUTH_EXPIRED') {
        setStatusMessage({ type: 'error', text: 'Sesi Google Anda telah berakhir. Silakan Putus Akun Google lalu Masuk kembali.' });
      } else {
        setStatusMessage({ type: 'error', text: err.message || 'Gagal membaca data dari Google Spreadsheet.' });
      }
    } finally {
      setIsPulling(false);
    }
  };

  const handleDisconnect = async () => {
    if (isLocked) {
      setStatusMessage({
        type: 'error',
        text: 'Tautan Google Spreadsheet sedang TERKUNCI PERMANEN dan tidak dapat dirubah atau diputus. Buka kunci terlebih dahulu jika ingin mengganti.'
      });
      return;
    }

    setConnectedId('');
    setConnectedTitle('');
    setSpreadsheetInput('');
    setShowLiveEmbed(false);
    await onSaveSettings({
      connectedSpreadsheetId: '',
      connectedSpreadsheetTitle: '',
      autoSyncSheets: false
    });
    setStatusMessage({ type: 'success', text: 'Sambungan Google Spreadsheet telah diputuskan.' });
  };

  const spreadsheetUrl = connectedId
    ? `https://docs.google.com/spreadsheets/d/${connectedId}/edit`
    : null;

  if (!isOpen) return null;

  // RULE 9: HANYA PENGURUS YANG DAPAT MEMBUKA GOOGLE SHEETS
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
        <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-red-500/50 overflow-hidden my-6">
          <div className="bg-[#0A192F] text-[#FAF8F5] p-5 border-b border-red-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Akses Khusus Pengurus Dibatasi</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center text-red-600 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-serif-brand">
                Hanya Pengurus yang Dapat Membuka Google Sheets
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Sesuai kebijakan keamanan data keuangan <strong>RIDHO OK QURBAN</strong>, akses langsung ke Google Sheets hanya diberikan kepada pengurus resmi melalui verifikasi PIN.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Masuk Sebagai Pengurus (PIN)</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 sm:p-6 border-b border-[#D4AF37]/40 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Sheets Terhubung Real-time</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30">
                <Shield className="w-3 h-3" />
                <span>Akses Pengurus & 1 Akun Tunggal</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#FAF8F5] font-serif-brand">
              Hubungkan Google Spreadsheet yang Sudah Dibuat
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              Menghubungkan langsung ke spreadsheet yang telah dibuat di Google Sheets Anda tanpa membuat spreadsheet baru.
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
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border border-red-300 text-red-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* POLICY BANNER: Single Account Policy */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-[#D4AF37]/40 rounded-xl text-xs text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#8C6D23] shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">
                  Kebijakan Keamanan: Hanya 1 Akun Google Sheet yang Terhubung Langsung
                </span>
                <span className="text-[11px] text-slate-600">
                  Akun resmi panitia yang diizinkan:{' '}
                  <strong className="text-blue-900 font-mono">
                    {settings.authorizedGoogleEmail || defaultAuthorizedEmail}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {!isEditingAuthorizedEmail ? (
                <button
                  onClick={() => setIsEditingAuthorizedEmail(true)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-300 rounded-lg transition"
                >
                  Ubah Akun Resmi
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="email"
                    value={authorizedEmailInput}
                    onChange={(e) => setAuthorizedEmailInput(e.target.value)}
                    placeholder="email@gmail.com"
                    className="px-2 py-1 text-[11px] border rounded bg-white font-mono w-48"
                  />
                  <button
                    onClick={handleSaveAuthorizedEmail}
                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                    title="Simpan"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setAuthorizedEmailInput(settings.authorizedGoogleEmail || defaultAuthorizedEmail);
                      setIsEditingAuthorizedEmail(false);
                    }}
                    className="p-1 bg-slate-300 text-slate-700 rounded text-[11px]"
                    title="Batal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 1. Google Account Login Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {googleUser ? (
                <>
                  <img
                    src={googleUser.photoURL || '/logo-qurban.jpg'}
                    alt={googleUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">
                        {googleUser.displayName || 'Akun Google'}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        1 Akun Resmi Terhubung
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{googleUser.email}</span>
                  </div>
                </>
              ) : (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Masuk dengan Akun Google Resmi ({settings.authorizedGoogleEmail || defaultAuthorizedEmail})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Hanya akun resmi ini yang dapat mengakses Google Sheets secara langsung.
                  </p>
                </div>
              )}
            </div>

            {googleUser ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Putus Akun Google</span>
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>

          {/* 2. Connected Spreadsheet Status */}
          {connectedId && (
            <div className="bg-emerald-50/90 border-2 border-emerald-400/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Google Spreadsheet Terhubung Real-time
                  </span>
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Lock className="w-3 h-3 text-amber-700" />
                      Terkunci Permanen
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Koneksi Aktif
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-slate-900">
                  {connectedTitle || 'Google Spreadsheet'}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  ID: {connectedId}
                  {settings.lastSheetsSyncTime && (
                    <span className="ml-2 text-emerald-700 font-sans font-semibold">
                      (Sinkron Terakhir: {new Date(settings.lastSheetsSyncTime).toLocaleTimeString('id-ID')})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] font-bold text-xs rounded-lg transition shadow-xs"
                    title="Buka Spreadsheet di Tab Baru (Hanya Pengurus)"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Google Sheets</span>
                  </a>
                )}
                <button
                  onClick={() => setShowLiveEmbed(!showLiveEmbed)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-emerald-400 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold rounded-lg transition"
                >
                  {showLiveEmbed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showLiveEmbed ? 'Tutup Pratinjau' : 'Pratinjau Live'}</span>
                </button>
                <button
                  onClick={handleToggleLock}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition ${
                    isLocked
                      ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title={isLocked ? "Buka kunci untuk mengganti tautan" : "Kunci permanen agar tidak dapat dirubah"}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLocked ? 'Terkunci' : 'Kunci Tautan'}</span>
                </button>
                {!isLocked && (
                  <button
                    onClick={handleDisconnect}
                    className="px-2.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg transition"
                  >
                    Ganti
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Embedded Live Spreadsheet Preview */}
          {connectedId && showLiveEmbed && (
            <div className="bg-white p-3 rounded-xl border-2 border-emerald-400 shadow-md space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                  Pratinjau Langsung Spreadsheet Terhubung
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Diperbarui secara real-time
                </span>
              </div>
              <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <iframe
                  src={`https://docs.google.com/spreadsheets/d/${connectedId}/preview`}
                  title="Google Sheets Live Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* 3. Connect Form (URL / Pick from Drive - NO CREATING NEW SPREADSHEET) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Hubungkan Google Spreadsheet yang Sudah Ada (Tidak Membuat Baru)</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Salin tautan dari Google Spreadsheet yang sudah Anda buat di Google Drive Anda (contoh: <code>https://docs.google.com/spreadsheets/d/.../edit</code>)
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/ID_SPREADSHEET_ANDA/edit"
                  value={spreadsheetInput}
                  disabled={isLocked}
                  onChange={(e) => setSpreadsheetInput(e.target.value)}
                  className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-mono ${
                    isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800'
                  }`}
                />
                <button
                  onClick={handleConnectSpreadsheet}
                  disabled={isConnecting || !spreadsheetInput.trim() || isLocked}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isConnecting ? 'Memverifikasi...' : 'Hubungkan & Kunci'}</span>
                </button>
              </div>
              {isLocked && (
                <p className="text-[11px] text-amber-800 font-bold mt-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tautan Google Spreadsheet ini sedang dikunci permanen dan tidak dapat dirubah.</span>
                </p>
              )}
            </div>

            {/* Or pick from Google Drive files */}
            {googleUser && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Atau Pilih Dari Spreadsheet yang Sudah Ada di Drive:</span>
                  </span>
                  <button
                    onClick={loadDriveFiles}
                    disabled={isLoadingSheets}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                    title="Perbarui daftar file Google Drive"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                </div>

                <select
                  value={connectedId}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) {
                      setSpreadsheetInput(`https://docs.google.com/spreadsheets/d/${id}/edit`);
                      const file = existingSheets.find((f) => f.id === id);
                      if (file) {
                        setConnectedTitle(file.name);
                        setConnectedId(id);
                        onSaveSettings({
                          connectedSpreadsheetId: id,
                          connectedSpreadsheetTitle: file.name
                        });
                        setStatusMessage({
                          type: 'success',
                          text: `Terhubung ke "${file.name}".`
                        });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="">-- Pilih file Google Sheets yang sudah Anda buat di Drive --</option>
                  {existingSheets.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name}{' '}
                      {file.modifiedTime
                        ? `(${new Date(file.modifiedTime).toLocaleDateString('id-ID')})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 4. Real-time Actions: Push & Pull */}
          {connectedId && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Aksi Sinkronisasi Real-time</span>
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAutoSync(val);
                        onSaveSettings({ autoSyncSheets: val });
                      }}
                      className="rounded accent-[#D4AF37]"
                    />
                    <span>Auto-Sync Otomatis Setiap Ada Transaksi</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Push Sync Button */}
                <button
                  onClick={handlePushData}
                  disabled={isPushing || !googleUser}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A192F] hover:bg-[#1E293B] text-[#D4AF37] font-bold text-xs transition border border-[#D4AF37]/50 shadow-sm disabled:opacity-50 active:scale-95"
                >
                  <ArrowUpFromLine className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                  <span>
                    {isPushing
                      ? 'Menyinkronkan...'
                      : `Kirim & Perbarui Data (${pesertaList.length} Peserta) ke Spreadsheet`}
                  </span>
                </button>

                {/* Pull Sync Button */}
                <button
                  onClick={handlePullData}
                  disabled={isPulling || !googleUser}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-300 disabled:opacity-50 active:scale-95"
                >
                  <ArrowDownToLine className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>{isPulling ? 'Membaca Data...' : 'Tarik Data dari Spreadsheet ke Aplikasi'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick CSV Export Backup */}
          <div className="p-3.5 bg-slate-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-700">Ekspor File Cadangan Spreadsheet Offline</span>
              <p className="text-[11px] text-slate-500">
                Unduh file .CSV untuk dibuka di Microsoft Excel atau Google Sheets kapan saja secara gratis.
              </p>
            </div>
            <button
              onClick={onExportPdf}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-lg transition self-end sm:self-auto"
            >
              Unduh PDF
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
