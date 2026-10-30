import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseCredentials } from './supabaseClient';

const { url, anonKey, isConfigured } = getSupabaseCredentials();

function createDummySupabaseProxy(): any {
  const dummyResult = Promise.resolve({ data: null, error: null });
  const proxy: any = new Proxy(dummyResult, {
    get(_target, prop) {
      if (prop === 'then') return dummyResult.then.bind(dummyResult);
      if (prop === 'catch') return dummyResult.catch.bind(dummyResult);
      return () => proxy;
    }
  });
  return proxy;
}

export const supabase: SupabaseClient = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : (createDummySupabaseProxy() as SupabaseClient);

