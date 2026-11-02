const GOOGLE_USER_KEY = 'RIDHO_OK_GOOGLE_USER_PROFILE';
const CUSTOM_CLIENT_ID_KEY = 'RIDHO_OK_CUSTOM_GOOGLE_CLIENT_ID';
const ACCESS_TOKEN_KEY = 'RIDHO_OK_ACCESS_TOKEN';
const DEFAULT_OAUTH_CLIENT_ID = '638093405907-g07krv5ma8h3g6n4mjokd4o6svh30c69.apps.googleusercontent.com';

let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

export interface PersistedGoogleUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

export const getOAuthClientId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(CUSTOM_CLIENT_ID_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_OAUTH_CLIENT_ID;
};

export const setCustomOAuthClientId = (clientId: string): void => {
  if (typeof window === 'undefined') return;
  if (clientId && clientId.trim()) {
    localStorage.setItem(CUSTOM_CLIENT_ID_KEY, clientId.trim());
  } else {
    localStorage.removeItem(CUSTOM_CLIENT_ID_KEY);
  }
};

export const getSavedGoogleUser = (): PersistedGoogleUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GOOGLE_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
};

export function getSavedAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || cachedAccessToken;
  }
  return cachedAccessToken;
}

export const initAuth = (
  onAuthSuccess?: (user: PersistedGoogleUser, token: string) => void,
  _onAuthFailure?: () => void
) => {
  const savedUser = getSavedGoogleUser();
  const savedToken = getSavedAccessToken();
  if (savedUser && onAuthSuccess) {
    onAuthSuccess(savedUser, savedToken || '');
  }
  return () => {};
};

function loadGisScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-gis-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export const googleSignIn = async (
  _expectedAuthorizedEmail?: string
): Promise<{ user: PersistedGoogleUser; accessToken: string } | null> => {
  await loadGisScript();

  return new Promise((resolve) => {
    try {
      const clientId = getOAuthClientId();
      if (!(window as any).google?.accounts?.oauth2) {
        throw new Error('Google Identity Services not available');
      }

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            const accessToken = tokenResponse.access_token;
            let user: PersistedGoogleUser = {
              email: _expectedAuthorizedEmail || 'redamofficialll@gmail.com',
              displayName: 'Panitia Qurban',
              photoURL: null,
              uid: 'google-user-' + Date.now()
            };

            // Fetch user profile info using the access token
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (res.ok) {
                const info = await res.json();
                user = {
                  email: info.email || user.email,
                  displayName: info.name || info.given_name || user.displayName,
                  photoURL: info.picture || null,
                  uid: info.sub || user.uid
                };
              }
            } catch (e) {
              console.warn('UserInfo fetch warning:', e);
            }

            if (typeof window !== 'undefined') {
              localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
              localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
              cachedAccessToken = accessToken;
            }

            resolve({ user, accessToken });
          } else {
            resolve(null);
          }
        },
        error_callback: (err: any) => {
          console.error('Google GIS Token error:', err);
          resolve(null);
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error('Google Sign-In initialization error:', err);
      resolve(null);
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return getSavedAccessToken();
};

export const googleLogout = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GOOGLE_USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  cachedAccessToken = null;
};
