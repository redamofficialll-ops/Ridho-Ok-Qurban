/**
 * Google Auth Service - Bebas Firebase
 * Menggunakan Google Identity Services OAuth 2.0 & Supabase Auth
 */

const GOOGLE_TOKEN_KEY = 'RIDHO_OK_GOOGLE_ACCESS_TOKEN';
const GOOGLE_USER_KEY = 'RIDHO_OK_GOOGLE_USER_PROFILE';

export interface PersistedGoogleUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null;

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
  _onAuthFailure?: () => void
) => {
  const savedToken = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null);
  const savedUser = getSavedGoogleUser();
  if (savedUser && onAuthSuccess) {
    onAuthSuccess(savedUser, savedToken || '');
  }

  // Return unsubscribe dummy
  return () => {};
};

export const googleSignIn = async (
  expectedAuthorizedEmail?: string
): Promise<{ user: PersistedGoogleUser; accessToken: string } | null> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if Google GIS client script is loaded, if not load it dynamically
      const setupTokenClient = () => {
        const client_id = '638093405907-g07krv5ma8h3g6n4mjokd4o6svh30c69.apps.googleusercontent.com';
        
        if (typeof (window as any).google !== 'undefined' && (window as any).google.accounts?.oauth2) {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id,
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            callback: async (response: any) => {
              if (response.error) {
                reject(new Error(response.error_description || response.error));
                return;
              }

              const accessToken = response.access_token;
              cachedAccessToken = accessToken;
              localStorage.setItem(GOOGLE_TOKEN_KEY, accessToken);

              // Fetch user profile info
              let userProfile: PersistedGoogleUser = {
                email: expectedAuthorizedEmail || 'redamofficialll@gmail.com',
                displayName: 'Pengurus Ridho Ok Qurban',
                photoURL: null,
                uid: 'usr-google-' + Date.now()
              };

              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (userRes.ok) {
                  const info = await userRes.json();
                  userProfile = {
                    email: info.email || userProfile.email,
                    displayName: info.name || userProfile.displayName,
                    photoURL: info.picture || null,
                    uid: info.sub || userProfile.uid
                  };
                }
              } catch (e) {
                console.warn('Could not fetch Google userinfo, using fallback:', e);
              }

              // Check authorized email if strict
              if (expectedAuthorizedEmail && expectedAuthorizedEmail.trim()) {
                const allowed = expectedAuthorizedEmail.trim().toLowerCase();
                const current = (userProfile.email || '').trim().toLowerCase();
                if (allowed && current !== allowed) {
                  googleLogout();
                  reject(new Error(`Akses Ditolak: Hanya akun Google (${expectedAuthorizedEmail}) yang diizinkan.`));
                  return;
                }
              }

              localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(userProfile));
              resolve({ user: userProfile, accessToken });
            }
          });

          client.requestAccessToken({ prompt: 'consent' });
        } else {
          // Dynamically load Google Identity Services
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => setupTokenClient();
          script.onerror = () => reject(new Error('Gagal memuat Google Identity Services'));
          document.head.appendChild(script);
        }
      };

      setupTokenClient();
    } catch (err) {
      reject(err);
    }
  });
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
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_USER_KEY);
  }
};
