import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '@/api/axiosClient';
import { Product, Category } from '@/types';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ProductFilter } from '@/components/shop/ProductFilter';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') ? Number(searchParams.get('category')) : null;
  const initialQuery = searchParams.get('query') || '';

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('createdAt-desc');

  const { setCart, openCart } = useCartStore();
  const { isInWishlist } = useWishlistStore();

  // Fetch Categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axiosClient.get('/categories');
      return res.data.data;
    },
  });

  // Fetch Products with filters
  const [sortField, sortDir] = sortBy.split('-');
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', selectedCategoryId, searchQuery, sortField, sortDir],
    queryFn: async () => {
      let url = `/products?sortBy=${sortField}&sortDir=${sortDir}&size=20`;
      if (selectedCategoryId) url += `&categoryId=${selectedCategoryId}`;
      if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;
      const res = await axiosClient.get(url);
      return res.data.data;
    },
  });

  const products: Product[] = productsData?.content || [];

  const handleAddToCart = async (product: Product) => {
    try {
      const res = await axiosClient.post('/cart/items', { productId: product.id, quantity: 1 });
      if (res.data.success) {
        setCart(res.data.data);
        openCart();
      }
    } catch (e) {
      console.error('Failed to add to cart', e);
    }
  };

  const handleToggleWishlist = async (productId: number) => {
    try {
      if (isInWishlist(productId)) {
        await axiosClient.delete(`/wishlist/${productId}`);
      } else {
        await axiosClient.post(`/wishlist/${productId}`);
      }
    } catch (e) {
      console.error('Failed to toggle wishlist', e);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategoryId(null);
    setSearchQuery('');
    setSortBy('createdAt-desc');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NGO Impact Marketplace</h1>
          <p className="text-xs text-slate-500 mt-1">Discover handcrafted products supporting artisan livelihoods and social initiatives.</p>
        </div>
        <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold border border-emerald-200">
          Showing {products.length} Products
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter */}
        <div className="lg:col-span-1">
          <ProductFilter
            categories={categories || []}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => setSelectedCategoryId(id)}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            sortBy={sortBy}
            onSortChange={(s) => setSortBy(s)}
            onReset={handleResetFilters}
          />
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        </div>
      </div>
    </div>
  );
};
