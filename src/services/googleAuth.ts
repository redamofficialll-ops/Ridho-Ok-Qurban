import { supabase } from './supabase';

const GOOGLE_TOKEN_KEY = 'RIDHO_OK_GOOGLE_ACCESS_TOKEN';
const GOOGLE_USER_KEY = 'RIDHO_OK_GOOGLE_USER_PROFILE';

let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null;

export interface PersistedGoogleUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

export const getSavedGoogleUser = (): PersistedGoogleUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GOOGLE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const initAuth = (
  onAuthSuccess?: (user: PersistedGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  const savedToken = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null);
  const savedUser = getSavedGoogleUser();
  if (savedUser && onAuthSuccess) {
    onAuthSuccess(savedUser, savedToken || '');
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user: PersistedGoogleUser = {
        email: session.user.email || null,
        displayName: session.user.user_metadata?.full_name || session.user.email || null,
        photoURL: session.user.user_metadata?.avatar_url || null,
        uid: session.user.id
      };
      const token = session.provider_token || cachedAccessToken || '';
      if (token) {
        cachedAccessToken = token;
        localStorage.setItem(GOOGLE_TOKEN_KEY, token);
      }
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken || token);
      }
    } else {
      const fallbackUser = getSavedGoogleUser();
      if (fallbackUser && cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(fallbackUser, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

export const googleSignIn = async (
  expectedAuthorizedEmail?: string
): Promise<{ user: PersistedGoogleUser; accessToken: string } | null> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(GOOGLE_TOKEN_KEY);
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  }
  const { data } = await supabase.auth.getSession();
  if (data?.session?.provider_token) {
    cachedAccessToken = data.session.provider_token;
    localStorage.setItem(GOOGLE_TOKEN_KEY, data.session.provider_token);
    return data.session.provider_token;
  }
  return null;
};

export const googleLogout = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_USER_KEY);
  }
};
