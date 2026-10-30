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
): () => void => {
  const savedToken = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(GOOGLE_TOKEN_KEY) : null);
  const savedUser = getSavedGoogleUser();
  if (savedUser && onAuthSuccess && savedToken) {
    onAuthSuccess(savedUser, savedToken);
  } else if (onAuthFailure) {
    onAuthFailure();
  }
  return () => {};
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignIn = async (): Promise<{ user: PersistedGoogleUser; accessToken: string } | null> => {
  const savedUser = getSavedGoogleUser();
  const mockUser: PersistedGoogleUser = savedUser || {
    email: 'redamofficialll@gmail.com',
    displayName: 'Panitia Ridho OK Qurban',
    photoURL: '/logo-qurban.jpg',
    uid: 'google-auth-ridho-ok-' + Date.now()
  };
  const mockToken = 'ya29.mock-google-sheets-access-token-ridho-ok-' + Date.now();
  
  cachedAccessToken = mockToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem(GOOGLE_TOKEN_KEY, mockToken);
    localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(mockUser));
  }

  return { user: mockUser, accessToken: mockToken };
};

export const googleLogout = async () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
    localStorage.removeItem(GOOGLE_USER_KEY);
  }
};
