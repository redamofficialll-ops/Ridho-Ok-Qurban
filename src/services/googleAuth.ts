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

export const googleSignIn = async (
  _expectedAuthorizedEmail?: string
): Promise<{ user: PersistedGoogleUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
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
    console.error('Firebase Auth Sign-In error:', error);
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
