import { create } from 'zustand';
import { Product } from '../types';

interface WishlistState {
  items: Product[];
  setWishlist: (items: Product[]) => void;
  isInWishlist: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  setWishlist: (items) => set({ items }),
  isInWishlist: (productId) => get().items.some((item) => item.id === productId),
}));
