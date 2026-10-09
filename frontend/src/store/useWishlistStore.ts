import { create } from 'zustand';
import { Product } from '../types';

interface WishlistState {
  items: Product[];
  loaded: boolean;
  setWishlist: (items: Product[]) => void;
  add: (product: Product) => void;
  remove: (productId: number) => void;
  clear: () => void;
  isInWishlist: (productId: number) => boolean;
}

/** Mirror of the server-side wishlist so hearts and counts stay consistent across pages. */
export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loaded: false,
  setWishlist: (items) => set({ items, loaded: true }),
  add: (product) => {
    if (!get().items.some((i) => i.id === product.id)) set({ items: [...get().items, product] });
  },
  remove: (productId) => set({ items: get().items.filter((i) => i.id !== productId) }),
  clear: () => set({ items: [], loaded: false }),
  isInWishlist: (productId) => get().items.some((item) => item.id === productId),
}));
