/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { TabelPeserta } from './components/TabelPeserta';
import { VarianHargaKambingModal } from './components/VarianHargaKambingModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ModalAdminPin } from './components/ModalAdminPin';
import { ModalTambahPeserta } from './components/ModalTambahPeserta';
import { ModalSetorTabungan } from './components/ModalSetorTabungan';
import { ModalDetailPeserta } from './components/ModalDetailPeserta';
import { KwitansiModal } from './components/KwitansiModal';
import { ModalEditPeserta } from './components/ModalEditPeserta';
import { ModalSettings } from './components/ModalSettings';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SyaratKetentuanCard } from './components/SyaratKetentuanCard';
import { WA_CHAT_URL, WA_PHONE, WhatsAppIcon } from './components/WhatsAppChatButton';
import { Peserta, AppSettings, SummaryStats, HARGA_KAMBING_OPTIONS, VarianKambingOption, formatRupiah, ActiveAdminSession } from './types/qurban';
import { Tag, ArrowRight, FileSpreadsheet, Lock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOCAL_STORAGE_KEY = 'RIDHO_OK_QURBAN_CACHE';
const ADMIN_PIN_KEY = 'RIDHO_OK_QURBAN_ADMIN_PIN';
const ACTIVE_PENGURUS_KEY = 'RIDHO_OK_ACTIVE_PENGURUS';

export default function App() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    namaProgram: 'RIDHO OK QURBAN',
    namaLembaga: 'RIDHO OK QURBAN',
    targetIdulAdha: '2027-05-16',
    tahunHijriyah: '1448 H',
    tahunMasehi: '2027 M',
    kontakPengurus: '0812-3456-7890',
    rekeningTujuan: 'Bank Syariah Indonesia (BSI) 7788990011 a.n. Tabungan Qurban Ridho'
  });
  const [summary, setSummary] = useState<SummaryStats>({
    totalPeserta: 0,
    totalTargetDana: 0,
    totalDanaTerkumpul: 0,
    totalSisaDana: 0,
    jumlahLunas: 0,
    jumlahProses: 0,
    persentaseTotal: 0
  });

  const [activePengurus, setActivePengurus] = useState<ActiveAdminSession | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_PENGURUS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return !!localStorage.getItem(ACTIVE_PENGURUS_KEY) || !!sessionStorage.getItem(ADMIN_PIN_KEY);
  });
  const [adminPin, setAdminPin] = useState<string>(() => {
    return sessionStorage.getItem(ADMIN_PIN_KEY) || '1234';
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    return sessionStorage.getItem(ADMIN_PIN_KEY) || '1234';
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [isVarianModalOpen, setIsVarianModalOpen] = useState(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTambahPesertaModalOpen, setIsTambahPesertaModalOpen] = useState(false);
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [selectedPesertaForSetor, setSelectedPesertaForSetor] = useState<Peserta | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPesertaForDetail, setSelectedPesertaForDetail] = useState<Peserta | null>(null);
  const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState(false);
  const [selectedPesertaForKwitansi, setSelectedPesertaForKwitansi] = useState<Peserta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPesertaForEdit, setSelectedPesertaForEdit] = useState<Peserta | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [presetVariantForRegister, setPresetVariantForRegister] = useState<number>(4500000);
  const [varianOptions, setVarianOptions] = useState<VarianKambingOption[]>(HARGA_KAMBING_OPTIONS);

  }, []);

  // Load from API with localStorage fallback
  const fetchData = useCallback(async (isSilent = false): Promise<Peserta[]> => {
    if (!isSilent) setIsRefreshing(true);
    let fetchedPeserta: Peserta[] = [];
    try {
      const res = await fetch(`/api/qurban/data?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          fetchedPeserta = json.peserta || [];
          setPeserta(fetchedPeserta);
          if (json.settings) setSettings(json.settings);
          if (json.summary) setSummary(json.summary);
          if (json.varianKambing) setVarianOptions(json.varianKambing);
          setLastUpdatedTime(json.lastUpdated || new Date().toISOString());

          // Save to local cache
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json));
        }
      }
    } catch (err) {
      console.warn('Gagal fetch data dari server, menggunakan cache lokal:', err);
      // Fallback to local cache
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.peserta) {
            fetchedPeserta = parsed.peserta;
            setPeserta(fetchedPeserta);
          }
          if (parsed.settings) setSettings(parsed.settings);
          if (parsed.summary) setSummary(parsed.summary);
        } catch {}
      }
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
    return fetchedPeserta;
  }, []);

  // Initial fetch and automatic real-time sync polling (every 6 seconds)
  useEffect(() => {
    fetchData();
    pollingIntervalRef.current = setInterval(() => {
      fetchData(true);
    }, 6000);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [fetchData]);

  // Keep detail modal participant synced if list updates
  useEffect(() => {
    if (selectedPesertaForDetail) {
      const updated = peserta.find(p => p.id === selectedPesertaForDetail.id);
      if (updated) setSelectedPesertaForDetail(updated);
    }
    if (selectedPesertaForSetor) {
      const updated = peserta.find(p => p.id === selectedPesertaForSetor.id);
      if (updated) setSelectedPesertaForSetor(updated);
    }
    if (selectedPesertaForKwitansi) {
      const updated = peserta.find(p => p.id === selectedPesertaForKwitansi.id);
      if (updated) setSelectedPesertaForKwitansi(updated);
    }
    if (selectedPesertaForEdit) {
      const updated = peserta.find(p => p.id === selectedPesertaForEdit.id);
      if (updated) setSelectedPesertaForEdit(updated);
    }
  }, [peserta]);



  // Handle Admin Login (supports 5 pengurus accounts or PIN)
  const handleAdminLogin = async (credentials: { username?: string; password?: string; pin?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/qurban/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdmin(true);
        const session: ActiveAdminSession = data.pengurus || {
          id: 'adm-001',
          username: credentials.username || 'Pengurus',
          nama: credentials.username || 'Pengurus Aktif',
          role: 'Pengurus Aktif',
          loginTime: new Date().toISOString()
        };
        setActivePengurus(session);
        localStorage.setItem(ACTIVE_PENGURUS_KEY, JSON.stringify(session));

        const pinVal = credentials.pin || credentials.password || '1234';
        setAdminPin(pinVal);
        sessionStorage.setItem(ADMIN_PIN_KEY, pinVal);
        return true;
      }
      return false;
    } catch {
      // Local fallback for offline reliability
      if (credentials.username) {
        const allowed = ['Kemal1208', 'Addin7846', 'Gilang2356', 'Apni4638', 'Ridho9856'];
        const found = allowed.find(a => a.toLowerCase() === credentials.username?.toLowerCase());
        if (found) {
          const session: ActiveAdminSession = {
            id: `adm-${found}`,
            username: found,
            nama: found,
            role: 'Pengurus Aktif',
            loginTime: new Date().toISOString()
          };
          setIsAdmin(true);
          setActivePengurus(session);
          localStorage.setItem(ACTIVE_PENGURUS_KEY, JSON.stringify(session));
          return true;
        }
      } else if (credentials.pin === '1234') {
        setIsAdmin(true);
        return true;
      }
      return false;
    }
  };

  // Handle Admin Logout
  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    setActivePengurus(null);
    setAdminPin('');
    sessionStorage.removeItem(ADMIN_PIN_KEY);
    localStorage.removeItem(ACTIVE_PENGURUS_KEY);
  };



  // Handle Tambah Peserta
  const handleTambahPeserta = async (payload: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/qurban/peserta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin || '1234',
          'x-admin-username': activePengurus?.username || ''
        },
        body: JSON.stringify({ ...payload, adminPin, adminUsername: activePengurus?.username || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Handle Catat Setoran
  const handleSaveSetoran = async (pesertaId: string, payload: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/qurban/peserta/${pesertaId}/setoran`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin || '1234',
          'x-admin-username': activePengurus?.username || ''
        },
        body: JSON.stringify({ ...payload, adminPin, adminUsername: activePengurus?.username || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData(true);
        if (data.peserta) {
          const updatedList = peserta.map(p => p.id === pesertaId ? data.peserta : p);
          syncToConnectedSheet(updatedList);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Handle Update Peserta
  const handleUpdatePeserta = async (pesertaId: string, payload: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/qurban/peserta/${pesertaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin || '1234',
          'x-admin-username': activePengurus?.username || ''
        },
        body: JSON.stringify({ ...payload, adminPin, adminUsername: activePengurus?.username || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newPeserta = await fetchData(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Handle Hapus Peserta
  const handleHapusPeserta = async (p: Peserta) => {
    try {
      const res = await fetch(`/api/qurban/peserta/${p.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin || '1234',
          'x-admin-username': activePengurus?.username || ''
        },
        body: JSON.stringify({ adminPin, adminUsername: activePengurus?.username || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Hapus Setoran Riwayat
  const handleHapusSetoran = async (pesertaId: string, setoranId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/qurban/peserta/${pesertaId}/setoran/${setoranId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin || '1234',
          'x-admin-username': activePengurus?.username || ''
        },
        body: JSON.stringify({ adminPin: adminPin || '1234', adminUsername: activePengurus?.username || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData(true);
          const updatedTarget: Peserta = {
            ...target,
            riwayatSetoran: updatedRiwayat,
            totalTerkumpul: newTotal,
            status: newTotal >= target.targetKurban ? 'Lunas' : 'Dalam Proses'
          };
          const updatedList = peserta.map(p => p.id === pesertaId ? updatedTarget : p);
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Handle Update Setoran Riwayat
  const handleUpdateSetoran = async (pesertaId: string, setoranId: string, payload: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/qurban/peserta/${pesertaId}/setoran/${setoranId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin || '1234',
          'x-admin-username': activePengurus?.username || ''
        },
        body: JSON.stringify({ ...payload, adminPin, adminUsername: activePengurus?.username || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData(true);
        if (data.peserta) {
          const updatedList = peserta.map(p => p.id === pesertaId ? data.peserta : p);
          syncToConnectedSheet(updatedList);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      // Optimistic instant update so logo/settings reflect immediately
      setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.settings = updated;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
        }
        return updated;
      });

      const res = await fetch('/api/qurban/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin || '1234',
          'x-admin-username': activePengurus?.username || ''
        },
        body: JSON.stringify({ settings: newSettings, adminPin, adminUsername: activePengurus?.username || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (newSettings.adminPin) {
          setAdminPin(newSettings.adminPin);
          sessionStorage.setItem(ADMIN_PIN_KEY, newSettings.adminPin);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        await fetchData(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle Save Webhook URL
  const handleSaveWebhookUrl = async (url: string): Promise<boolean> => {
    return handleSaveSettings({ appsScriptWebhookUrl: url });
  };

  // Handle Export PDF
  const handleExportPdf = () => {
    const doc = new jsPDF('landscape');
    const tableColumn = ["Kode", "Nama", "Alamat", "Target", "Terkumpul", "Status"];
    const tableRows = peserta.map(p => [
      p.kodePeserta,
      p.nama,
      p.alamat,
      formatRupiah(p.targetKurban || 0),
      formatRupiah(p.totalTerkumpul || 0),
      p.status
    ]);

    doc.text("Laporan Peserta Qurban", 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("Laporan_Peserta_Qurban.pdf");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#0A192F]">
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        isAdmin={isAdmin}
        activePengurus={activePengurus}
        googleEmailConnected={googleEmailConnected}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenVarianKambing={() => setIsVarianModalOpen(true)}
        onOpenAppsScript={() => setIsAppsScriptModalOpen(true)}
        onRefresh={() => fetchData(false)}
        isRefreshing={isRefreshing}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Connected Google Spreadsheet Real-time Status Banner - Hanya tampil di Mode Pengurus */}
        {isAdmin && settings.connectedSpreadsheetId && (
          <div className="bg-[#0A192F] text-[#FAF8F5] border-2 border-[#D4AF37]/50 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                    Google Spreadsheet Terhubung Real-time
                  </span>
                </div>
                <div className="font-bold text-white text-sm mt-0.5 truncate max-w-md">
                  {settings.connectedSpreadsheetTitle || 'Google Spreadsheet'}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${settings.connectedSpreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C07B] hover:to-[#C59B27] text-[#0A192F] font-bold text-xs transition shadow-sm"
                  title="Buka Spreadsheet di Tab Baru"
                >
                  <span>Buka di Google Sheets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setIsAppsScriptModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/20 text-white font-semibold text-xs transition"
                >
                  Kelola Sinkron
                </button>
              </div>
            )}
          </div>
        )}

        {/* KPI & Header Statistics */}
        <StatsOverview summary={summary} settings={settings} />

        {/* 12 Varian Kambing Ribbon Showcase */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-[#D4AF37]/50 flex items-center justify-center text-[#B8860B]">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider flex items-center gap-2">
                  <span style={{ fontFamily: "'League Spartan', sans-serif" }}>12 Varian Harga Hewan Kambing Qurban</span>
                  <span className="text-[10px] font-normal text-[#8C6D23] bg-amber-100/60 px-2 py-0.5 rounded-full">
                    Sesuai kesepakatan & ketulusan niat
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Transparan dan siap dipilih sesuai kemampuan serta target tabungan jamaah.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsVarianModalOpen(true)}
              className="text-xs font-bold text-[#8C6D23] hover:text-[#B8860B] flex items-center gap-1 self-start md:self-auto"
            >
              <span>Lihat Detail Semua Varian</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick horizontal scrollable pill grid for 12 prices */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            {varianOptions.map((opt) => (
              <div
                key={opt.kode || `varian-${opt.value}`}
                onClick={() => {
                  setPresetVariantForRegister(opt.value);
                  setIsVarianModalOpen(true);
                }}
                className="cursor-pointer bg-[#FAF8F5] hover:bg-amber-50/80 border border-slate-200 hover:border-[#D4AF37] rounded-xl p-2.5 transition text-center group"
              >
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-[#8C6D23] block truncate">
                  {opt.grade.replace('Kambing ', '')}
                </span>
                <span className="text-xs font-black text-[#0A192F] group-hover:text-[#B8860B] font-serif-brand block mt-0.5">
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Syarat & Ketentuan Program Tabungan Qurban */}
        <SyaratKetentuanCard />

        {/* Tabel & Laporan Utama Data Peserta - Hanya terlihat di Mode Pengurus, dalam Mode Peserta tidak terlihat */}
        {isAdmin && (
          <TabelPeserta
            peserta={peserta}
            isAdmin={isAdmin}
            onTambahPeserta={() => {
              setPresetVariantForRegister(4500000);
              setIsTambahPesertaModalOpen(true);
            }}
            onCatatSetoran={(p) => {
              setSelectedPesertaForSetor(p);
              setIsSetorModalOpen(true);
            }}
            onLihatDetail={(p) => {
              setSelectedPesertaForDetail(p);
              setIsDetailModalOpen(true);
            }}
            onCetakKwitansi={(p) => {
              setSelectedPesertaForKwitansi(p);
              setIsKwitansiModalOpen(true);
            }}
            onEditPeserta={(p) => {
              setSelectedPesertaForEdit(p);
              setIsEditModalOpen(true);
            }}
            onHapusPeserta={handleHapusPeserta}
            onExportPdf={handleExportPdf}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-[#0A192F] text-[#FAF8F5] border-t-2 border-[#D4AF37]/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-serif-brand font-black text-[#D4AF37] text-sm">
              RIDHO OK QURBAN
            </span>
            <span className="text-[11px] text-white/60 mt-0.5">
              Sistem Laporan Keuangan Tabungan Qurban Real-time & Gratis ({settings.tahunHijriyah || '1447 H'} / {settings.tahunMasehi || '2026 M'})
            </span>
            <a
              href={WA_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:text-white hover:bg-[#25D366] transition text-[11px] font-semibold mt-1.5 shadow-sm active:scale-95"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <span>Layanan WhatsApp: <strong className="font-mono text-white">{WA_PHONE}</strong></span>
            </a>
          </div>

          <div className="text-center font-arabic text-sm text-[#D4AF37]">
            تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُمْ صَالِحَ الأَعْمَالِ
          </div>

          <div className="text-center md:text-right text-[11px]">
            <span>Data tersimpan aman & tidak hilang saat refresh halaman</span>
            <div className="text-white/40 mt-0.5">
              Berbasis Arsitektur Real-time & Google Apps Script
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Varian Harga Modal */}
      <VarianHargaKambingModal
        isOpen={isVarianModalOpen}
        onClose={() => setIsVarianModalOpen(false)}
        isAdmin={isAdmin}
        varianOptions={varianOptions}
        initialSelectedHarga={presetVariantForRegister}
        onSelectVariantForRegister={(harga) => {
          setPresetVariantForRegister(harga);
          setIsTambahPesertaModalOpen(true);
        }}
      />

      {/* 2. Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        pesertaList={peserta}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onUpdatePesertaFromSheets={handleUpdatePesertaFromSheets}
        onExportPdf={handleExportPdf}
        isAdmin={isAdmin}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* 3. Admin PIN Modal */}
      <ModalAdminPin
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleAdminLogin}
        activePengurus={activePengurus}
      />

      {/* 4. Tambah Peserta Modal */}
      <ModalTambahPeserta
        isOpen={isTambahPesertaModalOpen}
        onClose={() => setIsTambahPesertaModalOpen(false)}
        onSave={handleTambahPeserta}
        initialVarianHarga={presetVariantForRegister}
        varianOptions={varianOptions}
      />

      {/* 5. Catat Setoran Modal */}
      <ModalSetorTabungan
        isOpen={isSetorModalOpen}
        onClose={() => {
          setIsSetorModalOpen(false);
          setSelectedPesertaForSetor(null);
        }}
        peserta={selectedPesertaForSetor}
        onSaveSetoran={handleSaveSetoran}
      />

      {/* 6. Detail Peserta Modal */}
      <ModalDetailPeserta
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPesertaForDetail(null);
        }}
        peserta={selectedPesertaForDetail}
        isAdmin={isAdmin}
        onCatatSetoran={(p) => {
          setSelectedPesertaForSetor(p);
          setIsSetorModalOpen(true);
        }}
        onCetakKwitansi={(p) => {
          setSelectedPesertaForKwitansi(p);
          setIsKwitansiModalOpen(true);
        }}
        onEditPeserta={(p) => {
          setSelectedPesertaForEdit(p);
          setIsEditModalOpen(true);
        }}
        onHapusSetoran={handleHapusSetoran}
        onUpdateSetoran={handleUpdateSetoran}
      />

      {/* 7. Kwitansi Modal */}
      <KwitansiModal
        isOpen={isKwitansiModalOpen}
        onClose={() => {
          setIsKwitansiModalOpen(false);
          setSelectedPesertaForKwitansi(null);
        }}
        peserta={selectedPesertaForKwitansi}
        settings={settings}
      />

      {/* 8. Edit Peserta Modal */}
      <ModalEditPeserta
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPesertaForEdit(null);
        }}
        peserta={selectedPesertaForEdit}
        onUpdatePeserta={handleUpdatePeserta}
        varianOptions={varianOptions}
      />

      {/* 9. Settings Modal */}
      <ModalSettings
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
