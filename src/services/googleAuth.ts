import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

// Persistent token and user profile caching
const GOOGLE_TOKEN_KEY = 'RIDHO_OK_GOOGLE_ACCESS_TOKEN';
const GOOGLE_USER_KEY = 'RIDHO_OK_GOOGLE_USER_PROFILE';

let isSigningIn = false;
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
  onAuthSuccess?: (user: User | PersistedGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  // First check immediately if we have a persisted session from localStorage
  const savedToken = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null);
  const savedUser = getSavedGoogleUser();
  if (savedUser && onAuthSuccess) {
    onAuthSuccess(savedUser, savedToken || '');
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    const currentToken = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null);
    if (user) {
      if (currentToken) {
        cachedAccessToken = currentToken;
      }
      // Keep saved user updated
      if (typeof window !== 'undefined') {
        localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid
        }));
      }
      if (onAuthSuccess) {
        onAuthSuccess(user, currentToken || '');
      }
    } else {
      // If Firebase user is not loaded yet or null, but savedUser exists, keep it
      const fallbackUser = getSavedGoogleUser();
      if (fallbackUser && currentToken) {
        if (onAuthSuccess) onAuthSuccess(fallbackUser, currentToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_USER_KEY);
        }
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (
  expectedAuthorizedEmail?: string
): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    // Enforce 1 authorized account rule if specified
    if (expectedAuthorizedEmail && expectedAuthorizedEmail.trim()) {
      const allowed = expectedAuthorizedEmail.trim().toLowerCase();
      const current = (result.user.email || '').trim().toLowerCase();
      if (allowed && current !== allowed) {
        await auth.signOut();
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
          localStorage.removeItem(GOOGLE_USER_KEY);
        }
        throw new Error(
          `Akses Ditolak: Hanya 1 akun Google Sheet yang diizinkan terhubung langsung (${expectedAuthorizedEmail}). Akun yang Anda gunakan (${result.user.email}) tidak berwenang.`
        );
      }
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem(GOOGLE_TOKEN_KEY, credential.accessToken);
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify({
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        uid: result.user.uid
      }));
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
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
  return null;
};

export const googleLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_USER_KEY);
  }
};
