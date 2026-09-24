import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        try {
          localStorage.setItem('zb_token', token);
        } catch {
          // localStorage unavailable — auth still works for this session via store state
        }
        set({ token, user });
      },
      clearAuth: () => {
        try {
          localStorage.removeItem('zb_token');
        } catch {
          // ignore
        }
        set({ token: null, user: null });
      },
    }),
    { name: 'zb_auth' }
  )
);
