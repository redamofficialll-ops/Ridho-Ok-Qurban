import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, Peserta, VarianKambingOption, PengurusAccount, HARGA_KAMBING_OPTIONS } from '../types/qurban';

const STORAGE_KEY = 'ROQ_SUPABASE_CONFIG';

export interface StoredSupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSavedSupabaseConfig(): StoredSupabaseConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  } catch {}
}

export function clearSupabaseConfig() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export const SUPABASE_DEFAULT_URL = 'https://jtcugpnxnlpeoibsgodg.supabase.co';
export const SUPABASE_DEFAULT_ANON_KEY = 'sb_publishable_denr1089Qaty2Gp6PSaVjA_RKJRdm9z';

export function getSupabaseCredentials(settings?: { supabaseUrl?: string; supabaseAnonKey?: string }): { url: string; anonKey: string; isConfigured: boolean } {
  const saved = getSavedSupabaseConfig();
  let url = settings?.supabaseUrl?.trim() || saved?.url?.trim() || (import.meta as any).env?.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
  let anonKey = settings?.supabaseAnonKey?.trim() || saved?.anonKey?.trim() || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_ANON_KEY;

  // Clean old / outdated project reference if any
  if (!url || url.includes('ahiwwauydluqarbqyfwj')) {
    url = SUPABASE_DEFAULT_URL;
    anonKey = SUPABASE_DEFAULT_ANON_KEY;
  }

  const isConfigured = Boolean(url && anonKey && url.startsWith('https://') && url.includes('.supabase.co'));
  return { url, anonKey, isConfigured };
}

let activeClient: SupabaseClient | null = null;
let currentClientKey = '';
let lastConnectionFailedAt = 0;

export function initSupabaseClient(settings?: Partial<AppSettings>, forceNew = false): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials(settings as any);
  
  if (!isConfigured) {
    activeClient = null;
    currentClientKey = '';
    return null;
  }

  const clientKey = `${url}___${anonKey}`;
  if (!forceNew && activeClient && currentClientKey === clientKey) {
    return activeClient;
  }

  try {
    activeClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'roq_supabase_auth_session'
      }
    });
    currentClientKey = clientKey;
    return activeClient;
  } catch (err) {
    console.warn('Notice initializing Supabase client:', err);
    return null;
  }
}

export function markConnectionFailed() {
  lastConnectionFailedAt = Date.now();
  activeClient = null;
}

export function resetSupabaseClient() {
  activeClient = null;
  currentClientKey = '';
  lastConnectionFailedAt = 0;
}

export interface SupabaseHealthReport {
  connected: boolean;
  status: 'connected' | 'unreachable' | 'auth_error' | 'not_configured' | 'tables_missing';
  message: string;
  url: string;
  needsSchemaSetup?: boolean;
  tables: {
    peserta: boolean;
    appSettings: boolean;
    varianKambing: boolean;
    pengurus: boolean;
    appData: boolean;
  };
}

export async function checkSupabaseHealth(
  optionsOrUrl?: string | Partial<AppSettings>,
  customKey?: string
): Promise<SupabaseHealthReport> {
  let targetUrl = '';
  let targetKey = '';

  if (typeof optionsOrUrl === 'string') {
    targetUrl = optionsOrUrl;
    targetKey = customKey || '';
  } else if (optionsOrUrl && typeof optionsOrUrl === 'object') {
    targetUrl = optionsOrUrl.supabaseUrl || '';
    targetKey = optionsOrUrl.supabaseAnonKey || '';
  }

  const creds = getSupabaseCredentials({ supabaseUrl: targetUrl, supabaseAnonKey: targetKey });
  const url = creds.url;
  const anonKey = creds.anonKey;

  const report: SupabaseHealthReport = {
    connected: false,
    status: 'not_configured',
    message: 'Supabase URL dan Anon Key belum dikonfigurasi.',
    url,
    needsSchemaSetup: false,
    tables: {
      peserta: false,
      appSettings: false,
      varianKambing: false,
      pengurus: false,
      appData: false
    }
  };

  if (!url || !anonKey || !url.startsWith('https://')) {
    return report;
  }

  try {
    const client = initSupabaseClient({ supabaseUrl: url, supabaseAnonKey: anonKey });
    if (!client) {
      report.status = 'unreachable';
      report.message = 'Klien Supabase tidak dapat diinisialisasi.';
      return report;
    }

    const [pRes, sRes, vRes, pgRes, adRes] = await Promise.all([
      client.from('peserta').select('id').limit(1),
      client.from('app_settings').select('id').limit(1),
      client.from('varian_kambing').select('kode').limit(1),
      client.from('pengurus').select('id').limit(1),
      client.from('app_data').select('id').limit(1)
    ]);

    const isAuthError = (res: any) => res.error && (res.error.code === 'PGRST301' || res.error.message?.includes('JWT') || res.error.message?.includes('invalid API key'));
    if (isAuthError(pRes) && isAuthError(sRes)) {
      report.status = 'auth_error';
      report.message = 'Kunci Anon / Publishable Key tidak valid untuk project URL ini.';
      return report;
    }

    report.tables.peserta = !pRes.error;
    report.tables.appSettings = !sRes.error;
    report.tables.varianKambing = !vRes.error;
    report.tables.pengurus = !pgRes.error;
    report.tables.appData = !adRes.error;

    const hasTables = report.tables.peserta || report.tables.appData;
    report.needsSchemaSetup = !hasTables;

    if (hasTables) {
      report.connected = true;
      report.status = 'connected';
      report.message = 'Terhubung sempurna ke database Supabase Cloud!';
    } else {
      report.connected = true;
      report.status = 'tables_missing';
      report.message = 'Koneksi ke Supabase aktif! Silakan jalankan Skrip SQL di Supabase SQL Editor jika tabel belum dibuat.';
    }

    return report;
  } catch (err: any) {
    report.status = 'unreachable';
    report.message = `Koneksi gagal: ${err.message || 'Periksa konfigurasi'}`;
    return report;
  }
}

export async function seedSupabaseIfEmpty(
  client: SupabaseClient,
  seedData: {
    settings: AppSettings;
    peserta: Peserta[];
    varianKambing: VarianKambingOption[];
    pengurus: PengurusAccount[];
  }
): Promise<boolean> {
  try {
    const { count: varianCount, error: vErr } = await client.from('varian_kambing').select('kode', { count: 'exact', head: true });
    if (!vErr && (varianCount === 0 || varianCount === null)) {
      await client.from('varian_kambing').upsert(seedData.varianKambing);
    }

    const { count: settingsCount, error: sErr } = await client.from('app_settings').select('id', { count: 'exact', head: true });
    if (!sErr && (settingsCount === 0 || settingsCount === null)) {
      await client.from('app_settings').upsert({
        id: 'main_settings',
        nama_program: seedData.settings.namaProgram,
        nama_lembaga: seedData.settings.namaLembaga,
        target_idul_adha: seedData.settings.targetIdulAdha,
        tahun_hijriyah: seedData.settings.tahunHijriyah,
        tahun_masehi: seedData.settings.tahunMasehi,
        kontak_pengurus: seedData.settings.kontakPengurus,
        rekening_tujuan: seedData.settings.rekeningTujuan,
        admin_pin: seedData.settings.adminPin || '1234',
        connected_spreadsheet_id: seedData.settings.connectedSpreadsheetId || '',
        authorized_google_email: seedData.settings.authorizedGoogleEmail || 'redamofficialll@gmail.com'
      });
    }

    const { count: pengurusCount, error: pErr } = await client.from('pengurus').select('id', { count: 'exact', head: true });
    if (!pErr && (pengurusCount === 0 || pengurusCount === null)) {
      const pengurusDb = seedData.pengurus.map(p => ({
        id: p.id,
        username: p.username,
        nama: p.nama,
        password: p.password,
        role: p.role,
        status: p.status
      }));
      await client.from('pengurus').upsert(pengurusDb);
    }

    const { count: pesertaCount, error: psErr } = await client.from('peserta').select('id', { count: 'exact', head: true });
    if (!psErr && (pesertaCount === 0 || pesertaCount === null) && seedData.peserta.length > 0) {
      const pesertaDb = seedData.peserta.map(p => ({
        id: p.id,
        kode_peserta: p.kodePeserta,
        nama: p.nama,
        alamat: p.alamat,
        no_hp: p.noHp,
        varian_harga: p.varianHarga,
        nama_varian: p.namaVarian,
        kode_varian: p.kodeVarian,
        target_kurban: p.targetKurban,
        total_terkumpul: p.totalTerkumpul,
        status: p.status,
        tanggal_daftar: p.tanggalDaftar,
        catatan_niat: p.catatanNiat || '',
        riwayat_setoran: p.riwayatSetoran || []
      }));
      await client.from('peserta').upsert(pesertaDb);
    }

    await client.from('app_data').upsert({
      id: 1,
      data: seedData,
      updated_at: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.warn('Notice seeding Supabase:', err);
    return false;
  }
}

export async function fetchPesertaFromSupabase(settings?: AppSettings): Promise<Peserta[] | null> {
  const client = initSupabaseClient(settings);
  if (!client) return null;
  try {
    const { data, error } = await client.from('peserta').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((r: any) => ({
      id: r.id,
      kodePeserta: r.kode_peserta,
      nama: r.nama,
      alamat: r.alamat,
      noHp: r.no_hp || '-',
      varianHarga: Number(r.varian_harga),
      namaVarian: r.nama_varian,
      kodeVarian: r.kode_varian,
      targetKurban: Number(r.target_kurban),
      totalTerkumpul: Number(r.total_terkumpul || 0),
      status: r.status || 'Dalam Proses',
      tanggalDaftar: r.tanggal_daftar,
      catatanNiat: r.catatan_niat || '',
      riwayatSetoran: Array.isArray(r.riwayat_setoran) ? r.riwayat_setoran : []
    }));
  } catch {
    return null;
  }
}

export async function syncPesertaToSupabase(pesertaList: Peserta[], settings?: AppSettings): Promise<boolean> {
  const client = initSupabaseClient(settings);
  if (!client) return false;
  try {
    const rows = pesertaList.map(p => ({
      id: p.id,
      kode_peserta: p.kodePeserta,
      nama: p.nama,
      alamat: p.alamat,
      no_hp: p.noHp,
      varian_harga: p.varianHarga,
      nama_varian: p.namaVarian,
      kode_varian: p.kodeVarian,
      target_kurban: p.targetKurban,
      total_terkumpul: p.totalTerkumpul,
      status: p.status,
      tanggal_daftar: p.tanggalDaftar,
      catatan_niat: p.catatanNiat || '',
      riwayat_setoran: p.riwayatSetoran || [],
      updated_at: new Date().toISOString()
    }));
    const { error } = await client.from('peserta').upsert(rows);
    return !error;
  } catch {
    return false;
  }
}

export async function deletePesertaFromSupabase(id: string, settings?: AppSettings): Promise<boolean> {
  const client = initSupabaseClient(settings);
  if (!client) return false;
  try {
    const { error } = await client.from('peserta').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function saveSinglePesertaToSupabase(p: Peserta, settings?: AppSettings): Promise<boolean> {
  const client = initSupabaseClient(settings);
  if (!client) return false;
  try {
    const row = {
      id: p.id,
      kode_peserta: p.kodePeserta,
      nama: p.nama,
      alamat: p.alamat,
      no_hp: p.noHp,
      varian_harga: p.varianHarga,
      nama_varian: p.namaVarian,
      kode_varian: p.kodeVarian,
      target_kurban: p.targetKurban,
      total_terkumpul: p.totalTerkumpul,
      status: p.status,
      tanggal_daftar: p.tanggalDaftar,
      catatan_niat: p.catatanNiat || '',
      riwayat_setoran: p.riwayatSetoran || [],
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('peserta').upsert([row]);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchSettingsFromSupabase(settings?: AppSettings): Promise<Partial<AppSettings> | null> {
  const client = initSupabaseClient(settings);
  if (!client) return null;
  try {
    const { data, error } = await client.from('app_settings').select('*').limit(1);
    if (error || !data || data.length === 0) return null;
    const s = data[0];
    return {
      namaProgram: s.nama_program,
      namaLembaga: s.nama_lembaga,
      targetIdulAdha: s.target_idul_adha,
      tahunHijriyah: s.tahun_hijriyah,
      tahunMasehi: s.tahun_masehi,
      kontakPengurus: s.kontak_pengurus,
      rekeningTujuan: s.rekening_tujuan,
      connectedSpreadsheetId: s.connected_spreadsheet_id,
      authorizedGoogleEmail: s.authorized_google_email
    };
  } catch {
    return null;
  }
}

export async function saveSettingsToSupabase(newSettings: Partial<AppSettings>, currentSettings?: AppSettings): Promise<boolean> {
  const client = initSupabaseClient(currentSettings);
  if (!client) return false;
  try {
    const row: any = {
      id: 'main_settings',
      updated_at: new Date().toISOString()
    };
    if (newSettings.namaProgram !== undefined) row.nama_program = newSettings.namaProgram;
    if (newSettings.namaLembaga !== undefined) row.nama_lembaga = newSettings.namaLembaga;
    if (newSettings.targetIdulAdha !== undefined) row.target_idul_adha = newSettings.targetIdulAdha;
    if (newSettings.tahunHijriyah !== undefined) row.tahun_hijriyah = newSettings.tahunHijriyah;
    if (newSettings.tahunMasehi !== undefined) row.tahun_masehi = newSettings.tahunMasehi;
    if (newSettings.kontakPengurus !== undefined) row.kontak_pengurus = newSettings.kontakPengurus;
    if (newSettings.rekeningTujuan !== undefined) row.rekening_tujuan = newSettings.rekeningTujuan;
    if (newSettings.adminPin !== undefined) row.admin_pin = newSettings.adminPin;
    if (newSettings.connectedSpreadsheetId !== undefined) row.connected_spreadsheet_id = newSettings.connectedSpreadsheetId;
    if (newSettings.authorizedGoogleEmail !== undefined) row.authorized_google_email = newSettings.authorizedGoogleEmail;

    const { error } = await client.from('app_settings').upsert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchVarianFromSupabase(settings?: AppSettings): Promise<VarianKambingOption[] | null> {
  const client = initSupabaseClient(settings);
  if (!client) return null;
  try {
    const { data, error } = await client.from('varian_kambing').select('*').order('value', { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data.map((v: any) => ({
      kode: v.kode,
      value: Number(v.value),
      label: v.label,
      grade: v.grade,
      deskripsi: v.deskripsi
    }));
  } catch {
    return null;
  }
}

export async function syncAllDataWithSupabase(
  data: {
    settings: AppSettings;
    peserta: Peserta[];
    varianKambing: VarianKambingOption[];
    pengurus: PengurusAccount[];
  }
): Promise<boolean> {
  const client = initSupabaseClient(data.settings);
  if (!client) return false;

  try {
    await seedSupabaseIfEmpty(client, data);
    await syncPesertaToSupabase(data.peserta, data.settings);
    return true;
  } catch {
    return false;
  }
}

export function subscribePesertaSupabase(
  onUpdate: () => void,
  settings?: AppSettings
): () => void {
  const client = initSupabaseClient(settings);
  if (!client) return () => {};

  try {
    const channel = client
      .channel('public:peserta:realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'peserta' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime notice:', err);
    return () => {};
  }
}

export function subscribeVarianSupabase(
  onUpdate: () => void,
  settings?: AppSettings
): () => void {
  const client = initSupabaseClient(settings);
  if (!client) return () => {};

  try {
    const channel = client
      .channel('public:varian_kambing:realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'varian_kambing' },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime Varian notice:', err);
    return () => {};
  }
}


