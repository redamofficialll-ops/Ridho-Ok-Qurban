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

export const SUPABASE_DEFAULT_URL = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_URL) || 'https://ahiwwauydluqarbqyfwj.supabase.co';
export const SUPABASE_DEFAULT_ANON_KEY = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_ANON_KEY) || 'sb_publishable_z1svJ8s4sZtMYSUCNuSUfg_13PkD-7n';

export function getSupabaseCredentials(settings?: { supabaseUrl?: string; supabaseAnonKey?: string }): { url: string; anonKey: string; isConfigured: boolean } {
  // 1. Check user-configured in settings or localStorage or defaults
  const saved = getSavedSupabaseConfig();
  const rawUrl = settings?.supabaseUrl?.trim() || saved?.url?.trim() || (import.meta as any).env?.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
  const rawKey = settings?.supabaseAnonKey?.trim() || saved?.anonKey?.trim() || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_ANON_KEY;

  // Sanitize out old non-existent fallback domain if cached in localStorage
  const url = (rawUrl && !rawUrl.includes('aohduzcoavfmrxsbroun')) ? rawUrl : SUPABASE_DEFAULT_URL;
  const anonKey = (rawKey && !rawKey.includes('C9VUe1cSlEv6JQh1LibzQ')) ? rawKey : SUPABASE_DEFAULT_ANON_KEY;

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
    return null;
  }

  // If connection failed recently (e.g. unresolvable domain), avoid spamming network for 45s
  if (!forceNew && Date.now() - lastConnectionFailedAt < 45000) {
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
        autoRefreshToken: false
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

  // 1. Ping the REST endpoint with timeout to verify domain and auth
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const pingRes = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (pingRes.status === 401 || pingRes.status === 403) {
      report.status = 'auth_error';
      report.message = 'Kunci Anon API Key tidak valid untuk project URL ini.';
      return report;
    }
  } catch (err: any) {
    markConnectionFailed();
    report.status = 'unreachable';
    report.message = `Domain Supabase (${url}) tidak dapat dijangkau. Pastikan project URL aktif dan tidak paused.`;
    return report;
  }

  // 2. Client query to inspect tables
  try {
    const tempClient = createClient(url, anonKey);
    const [pRes, sRes, vRes, pgRes, adRes] = await Promise.all([
      tempClient.from('peserta').select('id').limit(1),
      tempClient.from('app_settings').select('id').limit(1),
      tempClient.from('varian_kambing').select('kode').limit(1),
      tempClient.from('pengurus').select('id').limit(1),
      tempClient.from('app_data').select('id').limit(1)
    ]);

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
      report.message = 'Koneksi ke Supabase aktif! Siap disinkronkan.';
    }

    return report;
  } catch (err: any) {
    report.status = 'unreachable';
    report.message = `Koneksi gagal: ${err.message || 'Periksa konfigurasi'}`;
    return report;
  }
}

// Helper to seed initial data if tables are empty
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
    // 1. Seed varian_kambing
    const { count: varianCount, error: vErr } = await client.from('varian_kambing').select('kode', { count: 'exact', head: true });
    if (!vErr && (varianCount === 0 || varianCount === null)) {
      await client.from('varian_kambing').upsert(seedData.varianKambing);
    }

    // 2. Seed app_settings
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

    // 3. Seed pengurus
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

    // 4. Seed peserta
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

    // 5. Seed app_data (jsonb) if table exists
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

// Fetch all Peserta directly from Supabase Cloud
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

// Upsert Peserta into Supabase Cloud
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

// Delete Peserta from Supabase Cloud
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

// Sync all app data to Supabase Cloud
export async function syncAllDataWithSupabase(
  data: {
    settings: AppSettings;
    peserta: Peserta[];
    varianKambing: VarianKambingOption[];
    pengurus: PengurusAccount[];
  }
): Promise<boolean> {
  const client = initSupabaseClient(data.settings, true);
  if (!client) return false;

  try {
    await seedSupabaseIfEmpty(client, data);
    await syncPesertaToSupabase(data.peserta, data.settings);
    return true;
  } catch {
    return false;
  }
}
