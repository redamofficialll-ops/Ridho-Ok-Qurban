import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive');

const GOOGLE_USER_KEY = 'RIDHO_OK_GOOGLE_USER_PROFILE';
const CUSTOM_CLIENT_ID_KEY = 'RIDHO_OK_CUSTOM_GOOGLE_CLIENT_ID';
const ACCESS_TOKEN_KEY = 'RIDHO_OK_ACCESS_TOKEN';
const DEFAULT_OAUTH_CLIENT_ID = (firebaseConfig as any).oAuthClientId || '638093405907-g07krv5ma8h3g6n4mjokd4o6svh30c69.apps.googleusercontent.com';

let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
let isSigningIn = false;

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
  return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || DEFAULT_OAUTH_CLIENT_ID;
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
    if (raw) return JSON.parse(raw);
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
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getSavedAccessToken() || '';
      const persistedUser: PersistedGoogleUser = {
        email: user.email,
        displayName: user.displayName || 'Panitia Qurban',
        photoURL: user.photoURL,
        uid: user.uid
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(persistedUser));
      }
      if (onAuthSuccess) onAuthSuccess(persistedUser, token);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GOOGLE_USER_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
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

/**
 * Execute Google Identity Services (GIS) direct OAuth popup
 */
export const signInWithGis = async (
  clientId: string,
  expectedAuthorizedEmail?: string
): Promise<{ user: PersistedGoogleUser; accessToken: string }> => {
  await loadGisScript();
  return new Promise((resolve, reject) => {
    try {
      if (!(window as any).google?.accounts?.oauth2) {
        throw new Error('Google Identity Services (GIS) tidak tersedia.');
      }

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            const accessToken = tokenResponse.access_token;
            let user: PersistedGoogleUser = {
              email: expectedAuthorizedEmail || 'redamofficialll@gmail.com',
              displayName: 'Panitia Qurban',
              photoURL: null,
              uid: 'google-user-' + Date.now()
            };

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
            } catch (e) {}

            if (typeof window !== 'undefined') {
              localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
              localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
              cachedAccessToken = accessToken;
            }

            resolve({ user, accessToken });
          } else if (tokenResponse && tokenResponse.error) {
            reject(new Error(`GIS_ERROR: ${tokenResponse.error_description || tokenResponse.error}`));
          } else {
            reject(new Error('User menutup dialog login Google GIS.'));
          }
        },
        error_callback: (err: any) => {
          console.error('GIS Error:', err);
          const msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
          reject(new Error(`ORIGIN_MISMATCH: ${msg}`));
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
};

export const googleSignIn = async (
  expectedAuthorizedEmail?: string
): Promise<{ user: PersistedGoogleUser; accessToken: string } | null> => {
  const customId = typeof window !== 'undefined' ? localStorage.getItem(CUSTOM_CLIENT_ID_KEY) : null;

  // 1. If custom Client ID is configured, use GIS direct popup
  if (customId && customId.trim()) {
    return await signInWithGis(customId.trim(), expectedAuthorizedEmail);
  }

  // 2. Try Firebase Auth popup flow first
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google dari Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    const userProfile: PersistedGoogleUser = {
      email: result.user.email,
      displayName: result.user.displayName || 'Panitia Qurban',
      photoURL: result.user.photoURL,
      uid: result.user.uid
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(userProfile));
      localStorage.setItem(ACCESS_TOKEN_KEY, cachedAccessToken);
    }

    return { user: userProfile, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errCode = error?.code || '';
    const errMessage = String(error?.message || error || '');

    const isDomainError =
      errCode === 'auth/unauthorized-domain' ||
      errMessage.includes('unauthorized-domain') ||
      errMessage.includes('auth/unauthorized-domain');

    console.warn('Firebase popup sign-in notice:', error);

    // 3. Fallback to Google Identity Services popup with OAuth Client ID if domain restriction hit
    try {
      const clientId = getOAuthClientId();
      if (clientId) {
        console.info('Attempting Google GIS OAuth sign-in fallback...');
        const gisResult = await signInWithGis(clientId, expectedAuthorizedEmail);
        return gisResult;
      }
    } catch (gisError: any) {
      console.warn('GIS sign-in fallback notice:', gisError);
    }

    // 4. If domain error, format explicit error message so UI renders domain authorization guide
    if (isDomainError) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://...netlify.app';
      throw new Error(
        `Firebase: Error (auth/unauthorized-domain). Domain "${origin}" belum didaftarkan di Authorized Domains Firebase Console.`
      );
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getSavedAccessToken();
};

export const googleLogout = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GOOGLE_USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

