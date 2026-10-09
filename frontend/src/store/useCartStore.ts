import { create } from 'zustand';
import { Cart } from '../types';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  setCart: (cart: Cart) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  clearLocalCart: () => void;
}

/** Mirror of the server-side cart (the backend is the source of truth; this is never persisted locally). */
export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isOpen: false,
  setCart: (cart) => set({ cart }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  clearLocalCart: () => set({ cart: null, isOpen: false }),
}));
