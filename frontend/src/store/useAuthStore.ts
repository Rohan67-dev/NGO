import { create } from 'zustand';
import { User } from '../types';
import { TOKEN_KEY, USER_KEY, setUnauthorizedHandler } from '../api/axiosClient';
import { useCartStore } from './useCartStore';
import { useWishlistStore } from './useWishlistStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

const isAdminRole = (user: User | null) =>
  !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'STAFF');

const readStoredUser = (): User | null => {
  try {
    const json = localStorage.getItem(USER_KEY);
    return json ? (JSON.parse(json) as User) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const initialUser = readStoredUser();

  return {
    user: initialUser,
    token: storedToken,
    isAuthenticated: !!storedToken && !!initialUser,
    // UI hint only - every admin API is authorised on the server.
    isAdmin: isAdminRole(initialUser),

    setAuth: (user, token) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isAdmin: isAdminRole(user) });
    },

    setUser: (user) => {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, isAdmin: isAdminRole(user) });
    },

    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Never show the previous user's cart or wishlist to the next person on this device.
      useCartStore.getState().clearLocalCart();
      useWishlistStore.getState().clear();
      set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
    },
  };
});

setUnauthorizedHandler(() => useAuthStore.getState().logout());
