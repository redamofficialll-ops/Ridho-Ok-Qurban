import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  User,
  Users
} from 'lucide-react';
import { ActiveAdminSession } from '../types/qurban';

interface ModalAdminPinProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { username?: string; password?: string; pin?: string }) => Promise<boolean>;
  activePengurus?: ActiveAdminSession | null;
}

export const LIST_PENGURUS_RESMI = [
  { username: 'Kemal1208', label: 'Kemal1208', nama: 'Kemal1208' },
  { username: 'Addin7846', label: 'Addin7846', nama: 'Addin7846' },
  { username: 'Gilang2356', label: 'Gilang2356', nama: 'Gilang2356' },
  { username: 'Apni4638', label: 'Apni4638', nama: 'Apni4638' },
  { username: 'Ridho9856', label: 'Ridho9856', nama: 'Ridho9856' }
];

export const ModalAdminPin: React.FC<ModalAdminPinProps> = ({
  isOpen,
  onClose,
  onLogin,
  activePengurus
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'change-password'>('login');
  
  // Login Form State (User types directly)
  const [typedUsername, setTypedUsername] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Change Password Form State (User types directly)
  const [changeTypedUsername, setChangeTypedUsername] = useState<string>('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setChangeError('');
      setChangeSuccess('');
      setPassword('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // If active pengurus already exists, we can prefill or leave blank for fresh typing
      if (activePengurus?.username) {
        setTypedUsername(activePengurus.username);
        setChangeTypedUsername(activePengurus.username);
      } else {
        setTypedUsername('');
        setChangeTypedUsername('');
      }

      // Auto-focus username input after modal animation
      const timer = setTimeout(() => {
        if (usernameInputRef.current) {
          usernameInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activePengurus]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = typedUsername.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMsg('Ketik nama akun / username pengurus terlebih dahulu!');
      if (usernameInputRef.current) usernameInputRef.current.focus();
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Ketik kata sandi pengurus terlebih dahulu!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const success = await onLogin({
      username: cleanUser,
      password: cleanPass
    });
    setIsLoading(false);

    if (success) {
      setSuccessMsg(`Berhasil masuk sebagai ${cleanUser}`);
      setPassword('');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg('Nama akun atau kata sandi tidak cocok! Pastikan mengetik nama akun dan kata sandi pengurus dengan benar.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    const cleanUser = changeTypedUsername.trim();
    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanUser) {
      setChangeError('Ketik nama akun pengurus yang ingin diubah kata sandinya!');
      return;
    }
    if (!cleanNew || cleanNew.length < 4) {
      setChangeError('Kata sandi baru minimal 4 karakter!');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setChangeError('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }

    setIsChanging(true);
    try {
      const res = await fetch('/api/qurban/pengurus/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          oldPassword: cleanOld,
          newPassword: cleanNew
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChangeSuccess(`Kata sandi untuk ${cleanUser} berhasil diubah!`);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Switch back to login after short delay with username filled
        setTimeout(() => {
          setTypedUsername(cleanUser);
          setActiveTab('login');
        }, 1200);
      } else {
        setChangeError(data.message || 'Gagal mengubah kata sandi.');
      }
    } catch {
      setChangeError('Terjadi kesalahan koneksi server.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0A192F] text-[#FAF8F5] p-5 text-center relative border-b border-[#D4AF37]/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-2 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-black font-serif-brand text-white">
            Masuk Pengurus
          </h2>
          <p className="text-xs text-[#FAF8F5]/80 mt-1">
            Ketik langsung nama akun dan kata sandi pengurus Anda
          </p>

          {/* Navigation Tabs */}
          <div className="mt-4 flex rounded-xl bg-slate-900/60 p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#0A192F] shadow'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ketik Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('change-password')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'change-password'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#0A192F] shadow'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Ubah Kata Sandi</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Login Pengurus - Typing Directly */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Direct Input: Nama Akun / Username */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Ketik Nama Akun / Username</span>
                </span>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                  Wajib Diketik
                </span>
              </label>
              <div className="relative">
                <input
                  ref={usernameInputRef}
                  type="text"
                  placeholder="Ketik akun Anda..."
                  value={typedUsername}
                  onChange={(e) => {
                    setTypedUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 bg-white text-[#0A192F] font-bold text-sm tracking-wide transition shadow-2xs"
                  autoComplete="username"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Direct Input: Kata Sandi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Ketik Kata Sandi / Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ketik kata sandi Anda..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 bg-white text-[#0A192F] font-semibold text-sm transition shadow-2xs"
                  autoComplete="current-password"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>


            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !typedUsername.trim() || !password}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] font-black text-xs uppercase tracking-wider transition shadow-md shadow-[#D4AF37]/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun Pengurus...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      {typedUsername.trim() ? `Masuk Sebagai ${typedUsername.trim()}` : 'Masuk Sebagai Pengurus'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Ubah Kata Sandi - Typing Directly */}
        {activeTab === 'change-password' && (
          <form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-3.5">
            {changeError && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{changeSuccess}</span>
              </div>
            )}

            {/* Direct Input: Nama Pengurus yang ingin diubah */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Ketik Nama Akun Pengurus
              </label>
              <input
                type="text"
                placeholder="Ketik nama akun..."
                value={changeTypedUsername}
                onChange={(e) => setChangeTypedUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-[#0A192F] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                required
              />
            </div>

            {/* Kata Sandi Lama */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kata Sandi Lama / Awal (Default: nama akun atau 4 angka)
              </label>
              <input
                type="password"
                placeholder="Ketik kata sandi lama..."
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Kata Sandi Baru */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Kata Sandi Baru (Minimal 4 Karakter)
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showNewPassword ? 'Tutup' : 'Lihat'}</span>
                </button>
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Ketik kata sandi baru..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                required
              />
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Ulangi kata sandi baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChanging || !changeTypedUsername.trim() || !newPassword}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isChanging ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Simpan Kata Sandi Baru</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Sesi Pengurus dan akun Google resmi akan tetap tersimpan saat halaman di-refresh.
        </div>
      </div>
    </div>
  );
};
