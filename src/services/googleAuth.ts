const GOOGLE_USER_KEY = 'RIDHO_OK_GOOGLE_USER_PROFILE';
const OAUTH_CLIENT_ID = '638093405907-g07krv5ma8h3g6n4mjokd4o6svh30c69.apps.googleusercontent.com';

let cachedAccessToken: string | null = null;

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
  _onAuthFailure?: () => void
) => {
  const savedUser = getSavedGoogleUser();
  if (savedUser && onAuthSuccess) {
    onAuthSuccess(savedUser, cachedAccessToken || '');
  }
  return () => {};
};

export const googleSignIn = async (
  expectedAuthorizedEmail?: string
): Promise<{ user: PersistedGoogleUser; accessToken: string } | null> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const loadGsiScript = (): Promise<void> => {
      return new Promise((res) => {
        if ((window as any).google?.accounts?.oauth2) {
          res();
          return;
        }
        const existingScript = document.getElementById('gsi-client-script');
        if (existingScript) {
          existingScript.addEventListener('load', () => res());
          existingScript.addEventListener('error', () => res());
          return;
        }
        const script = document.createElement('script');
        script.id = 'gsi-client-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => res();
        script.onerror = () => res();
        document.head.appendChild(script);
      });
    };

    loadGsiScript()
      .then(() => {
        if (!(window as any).google?.accounts?.oauth2) {
          throw new Error('Gagal memuat pustaka otentikasi Google. Silakan periksa koneksi internet Anda.');
        }

        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: OAUTH_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          hint: expectedAuthorizedEmail || 'redamofficialll@gmail.com',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'access_denied') {
                console.info('Google sign in popup closed by user.');
                resolve(null);
              } else {
                reject(new Error(`Otorisasi Google gagal: ${tokenResponse.error}`));
              }
              return;
            }

            const accessToken = tokenResponse.access_token;
            cachedAccessToken = accessToken;

            let user: PersistedGoogleUser = {
              email: expectedAuthorizedEmail || 'redamofficialll@gmail.com',
              displayName: 'Pengurus Qurban Resmi',
              photoURL: null,
              uid: `g-${Date.now()}`
            };

            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (userInfoRes.ok) {
                const info = await userInfoRes.json();
                user = {
                  email: info.email || user.email,
                  displayName: info.name || info.given_name || user.displayName,
                  photoURL: info.picture || null,
                  uid: info.sub || user.uid
                };
              }
            } catch (e) {
              console.warn('Notice fetching Google userinfo:', e);
            }

            localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
            resolve({ user, accessToken });
          },
          error_callback: (err: any) => {
            if (err?.type === 'popup_closed') {
              console.info('Google OAuth popup closed.');
              resolve(null);
            } else {
              reject(new Error('Proses masuk Google dibatalkan atau pop-up diblokir.'));
            }
          }
        });

        client.requestAccessToken({ prompt: 'select_account' });
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GOOGLE_USER_KEY);
  }
};

