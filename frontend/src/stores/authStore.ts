import { create } from 'zustand';
import type { User } from '../services/authService';

interface AuthState {
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  hydrate: () => {
    try {
      const token = localStorage.getItem('zerobite_token');
      const userStr = localStorage.getItem('zerobite_user');
      const user = userStr ? (JSON.parse(userStr) as User) : null;
      set({ token, user, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  setAuth: (token: string, user: User) => {
    try {
      localStorage.setItem('zerobite_token', token);
      localStorage.setItem('zerobite_user', JSON.stringify(user));
    } catch {
      /* ignore */
    }
    set({ token, user });
  },

  setUser: (user: User) => {
    try {
      localStorage.setItem('zerobite_user', JSON.stringify(user));
    } catch {
      /* ignore */
    }
    set({ user });
  },

  logout: () => {
    try {
      localStorage.removeItem('zerobite_token');
      localStorage.removeItem('zerobite_user');
    } catch {
      /* ignore */
    }
    set({ token: null, user: null });
  },
}));

export const roleToDashboardPath = (role: string): string => {
  switch (role) {
    case 'ministry':
    case 'admin':
      return '/national';
    case 'district_officer':
    case 'district':
      return '/district';
    case 'community_worker':
    case 'field_worker':
    case 'chw':
    case 'worker':
      return '/worker';
    case 'public':
    default:
      return '/public';
  }
};

export default useAuthStore;
