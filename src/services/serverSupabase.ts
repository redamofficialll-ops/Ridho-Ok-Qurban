import { createClient, SupabaseClient } from '@supabase/supabase-js';

let customUrl: string = '';
let customKey: string = '';
let clientInstance: SupabaseClient | null = null;
let lastFailureTime = 0;

export function updateServerSupabaseCredentials(url: string, key: string) {
  customUrl = (url || '').trim();
  customKey = (key || '').trim();
  clientInstance = null;
  lastFailureTime = 0;
}

export function getServerSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const url = customUrl || (process.env.VITE_SUPABASE_URL || '').trim();
  const key = customKey || (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const isConfigured = Boolean(url && key && url.startsWith('https://') && url.includes('.supabase.co'));
  return { url, key, isConfigured };
}

export function getServerSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getServerSupabaseConfig();
  if (!isConfigured) return null;

  // Don't hammer unreachable domain within 30 seconds of failure
  if (Date.now() - lastFailureTime < 30000) {
    return null;
  }

  if (clientInstance) return clientInstance;

  try {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return clientInstance;
  } catch (err) {
    console.warn('Notice creating server Supabase client:', err);
    return null;
  }
}

export function markServerSupabaseFailed() {
  lastFailureTime = Date.now();
  clientInstance = null;
}

function createMockPostgrestBuilder(): any {
  const dummyResult = Promise.resolve({ data: null, error: { message: 'Supabase standby / not reachable' } });

  const mockBuilder: any = new Proxy(dummyResult, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return dummyResult.then.bind(dummyResult);
      }
      if (prop === 'catch') {
        return dummyResult.catch.bind(dummyResult);
      }
      if (prop === 'finally') {
        return dummyResult.finally.bind(dummyResult);
      }
      return () => mockBuilder;
    }
  });

  return mockBuilder;
}

function wrapSupabaseQuery(builder: any): any {
  if (!builder) return createMockPostgrestBuilder();

  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (onfulfilled?: any, onrejected?: any) => {
          return Promise.resolve(target)
            .then((res: any) => {
              if (res && res.error) {
                const errMsg = String(res.error.message || res.error || '');
                if (errMsg.includes('FetchError') || errMsg.includes('ENOTFOUND') || errMsg.includes('Failed to fetch')) {
                  markServerSupabaseFailed();
                }
              }
              return res;
            })
            .catch((err: any) => {
              markServerSupabaseFailed();
              return { data: null, error: err };
            })
            .then(onfulfilled, onrejected);
        };
      }

      if (prop === 'catch') {
        return (onrejected?: any) => {
          return Promise.resolve(target)
            .catch((err: any) => {
              markServerSupabaseFailed();
              return { data: null, error: err };
            })
            .then(undefined, onrejected);
        };
      }

      const original = Reflect.get(target, prop, receiver);
      if (typeof original === 'function') {
        return (...args: any[]) => {
          try {
            const result = original.apply(target, args);
            if (result && typeof result === 'object') {
              return wrapSupabaseQuery(result);
            }
            return result;
          } catch (err) {
            markServerSupabaseFailed();
            return createMockPostgrestBuilder();
          }
        };
      }

      return original;
    }
  });
}

export const supabaseServer = {
  from: (table: string) => {
    const client = getServerSupabase();
    if (!client) {
      return createMockPostgrestBuilder();
    }
    try {
      const tableRef = client.from(table);
      return wrapSupabaseQuery(tableRef);
    } catch (err) {
      markServerSupabaseFailed();
      return createMockPostgrestBuilder();
    }
  }
};

