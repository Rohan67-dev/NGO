import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('ngo_auth_token');
  const storedUserJson = localStorage.getItem('ngo_auth_user');
  let initialUser: User | null = null;

  if (storedUserJson) {
    try {
      initialUser = JSON.parse(storedUserJson);
    } catch (e) {
      initialUser = null;
    }
  }

  return {
    user: initialUser,
    token: storedToken,
    isAuthenticated: !!storedToken && !!initialUser,
    isAdmin: !!initialUser && (initialUser.role === 'ADMIN' || initialUser.role === 'SUPER_ADMIN' || initialUser.role === 'STAFF'),

    setAuth: (user, token) => {
      localStorage.setItem('ngo_auth_token', token);
      localStorage.setItem('ngo_auth_user', JSON.stringify(user));
      const isAdminRole = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'STAFF';
      set({ user, token, isAuthenticated: true, isAdmin: isAdminRole });
    },

    logout: () => {
      localStorage.removeItem('ngo_auth_token');
      localStorage.removeItem('ngo_auth_user');
      set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
    },
  };
});
