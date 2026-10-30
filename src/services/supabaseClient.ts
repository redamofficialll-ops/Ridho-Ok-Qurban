import { createClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const defaultUrl = 'https://ahiwwauydluqarbqyfwj.supabase.co';
  const defaultAnonKey = 'sb_publishable_z1svJ8s4sZtMYSUCNuSUfg_13PkD-7n';

  try {
    const cached = localStorage.getItem('RIDHO_OK_QURBAN_CACHE');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.settings?.supabaseUrl && parsed.settings?.supabaseAnonKey) {
        return {
          url: parsed.settings.supabaseUrl,
          anonKey: parsed.settings.supabaseAnonKey
        };
      }
    }
  } catch {}

  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || defaultUrl,
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || defaultAnonKey
  };
}

export function initSupabaseClient() {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch (err) {
    console.error('Failed to init Supabase client:', err);
    return null;
  }
}
