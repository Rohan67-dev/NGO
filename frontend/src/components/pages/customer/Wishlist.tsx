import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { Product } from '../../../types';
import { ProductGrid } from '../../shop/ProductGrid';
import { useWishlistStore } from '../../../store/useWishlistStore';
import { useShopActions } from '../../../hooks/useShopActions';

export const Wishlist: React.FC = () => {
  const { items, setWishlist } = useWishlistStore();
  const { addToCart, toggleWishlist, pendingId } = useShopActions();

  // Refresh from the server on visit; the shared store keeps hearts/counts in sync everywhere else.
  const { data, isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: ['wishlist-items'],
    queryFn: async () => (await axiosClient.get('/wishlist')).data.data,
  });
  useEffect(() => {
    if (data) setWishlist(data);
  }, [data, setWishlist]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
          <Heart className="w-5 h-5 fill-rose-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Your Saved Wishlist ({items.length})</h1>
          <p className="text-xs text-slate-500">Products saved for later. Out-of-stock items stay here until you remove them.</p>
        </div>
      </div>

      <ProductGrid
        products={items}
        isLoading={isLoading && items.length === 0}
        isError={isError}
        onRetry={() => refetch()}
        onAddToCart={(p) => addToCart(p)}
        onToggleWishlist={toggleWishlist}
        busyProductId={pendingId}
        emptyTitle="Your wishlist is empty"
        emptyMessage="Tap the heart on any product to save it here."
        emptyAction={<Link to="/shop" className="btn-primary px-4 py-2 inline-block">Browse products</Link>}
      />
    </div>
  );
};
