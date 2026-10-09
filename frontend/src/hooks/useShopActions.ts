import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { axiosClient, getErrorMessage } from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { toast } from '../store/useToastStore';
import { Cart, Product } from '../types';

/**
 * Shared add-to-cart / wishlist behaviour for every page (previously copy-pasted into five pages,
 * each silently swallowing errors). Guests are sent to sign in and brought back afterwards.
 */
export const useShopActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { setCart, openCart } = useCartStore();
  const wishlist = useWishlistStore();
  const [pendingId, setPendingId] = useState<number | null>(null);

  const requireLogin = (message: string) => {
    toast.info(message);
    navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
  };

  /** Returns true when the item was added. */
  const addToCart = async (product: Pick<Product, 'id' | 'name'>, quantity = 1, open = true): Promise<boolean> => {
    if (!isAuthenticated) {
      requireLogin('Please sign in to add items to your cart.');
      return false;
    }
    setPendingId(product.id);
    try {
      const res = await axiosClient.post('/cart/items', { productId: product.id, quantity });
      setCart(res.data.data as Cart);
      if (open) openCart();
      else toast.success(`${product.name} added to cart`);
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not add this item to your cart.'));
      return false;
    } finally {
      setPendingId(null);
    }
  };

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      requireLogin('Please sign in to save items to your wishlist.');
      return;
    }
    const saved = wishlist.isInWishlist(product.id);
    // Optimistic update, rolled back on failure
    if (saved) wishlist.remove(product.id);
    else wishlist.add(product);
    try {
      if (saved) await axiosClient.delete(`/wishlist/${product.id}`);
      else await axiosClient.post(`/wishlist/${product.id}`);
      toast.success(saved ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch (e) {
      if (saved) wishlist.add(product);
      else wishlist.remove(product.id);
      toast.error(getErrorMessage(e, 'Could not update your wishlist.'));
    }
  };

  return { addToCart, toggleWishlist, pendingId };
};
