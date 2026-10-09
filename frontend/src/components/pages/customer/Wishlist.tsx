import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { Product } from '../../../types';
import { ProductGrid } from '../../shop/ProductGrid';
import { useCartStore } from '../../../store/useCartStore';

export const Wishlist: React.FC = () => {
  const { setCart, openCart } = useCartStore();

  const { data: products, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['wishlist-items'],
    queryFn: async () => {
      const res = await axiosClient.get('/wishlist');
      return res.data.data;
    },
  });

  const handleAddToCart = async (product: Product) => {
    try {
      const res = await axiosClient.post('/cart/items', { productId: product.id, quantity: 1 });
      if (res.data.success) {
        setCart(res.data.data);
        openCart();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveWishlist = async (productId: number) => {
    try {
      await axiosClient.delete(`/wishlist/${productId}`);
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
          <Heart className="w-5 h-5 fill-rose-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Your Saved Wishlist</h1>
          <p className="text-xs text-slate-500">Handcrafted products saved for your next impact purchase.</p>
        </div>
      </div>

      <ProductGrid
        products={products || []}
        isLoading={isLoading}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleRemoveWishlist}
      />
    </div>
  );
};
