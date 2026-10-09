import { create } from 'zustand';
import { Cart, CartItem } from '../types';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  setCart: (cart: Cart) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  clearLocalCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isOpen: false,
  setCart: (cart) => set({ cart }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  clearLocalCart: () => set({ cart: null }),
}));
