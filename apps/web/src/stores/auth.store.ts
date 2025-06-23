import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@nutrabiotics-system/shared-types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, tokens) => {
        localStorage.setItem('auth-tokens', JSON.stringify(tokens));
        localStorage.setItem('auth-user', JSON.stringify(user));
        set({ user, tokens, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('auth-tokens');
        localStorage.removeItem('auth-user');
        set({ user: null, tokens: null, isAuthenticated: false });
      },
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
