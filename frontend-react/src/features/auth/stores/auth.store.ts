import { create } from 'zustand';
import { setAccessToken } from '../../../shared/lib/axios';
import type { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** true until the initial silent-refresh-on-load attempt finishes. */
  isInitializing: boolean;
  login: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  finishInitializing: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,

  login: (user, token) => {
    setAccessToken(token);
    set({ user, accessToken: token, isAuthenticated: true, isInitializing: false });
  },

  setUser: (user) => set({ user }),

  setAccessToken: (token) => {
    setAccessToken(token);
    set({ accessToken: token, isAuthenticated: true });
  },

  logout: () => {
    setAccessToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false });
  },

  finishInitializing: () => set({ isInitializing: false }),
}));
