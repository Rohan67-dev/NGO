import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { axiosClient } from '@/api/axiosClient';
import { Product, Category, Page } from '@/types';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ProductFilter, ShopFilters, SORT_OPTIONS } from '@/components/shop/ProductFilter';
import { Pagination } from '@/components/common/Pagination';
import { useShopActions } from '@/hooks/useShopActions';

const PAGE_SIZE = 12;

export const Shop: React.FC = () => {
  // The URL is the single source of truth, so the navbar search, back/forward and shared links all work.
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'createdAt-desc';
  const filters: ShopFilters = {
    categoryId: searchParams.get('category') ? Number(searchParams.get('category')) : null,
    query: searchParams.get('query') || '',
    sort: SORT_OPTIONS.some((o) => o.value === sortParam) ? sortParam : 'createdAt-desc',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') === 'true',
  };
  const page = Math.max(0, Number(searchParams.get('page') || 0) || 0);

  const { addToCart, toggleWishlist, pendingId } = useShopActions();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await axiosClient.get('/categories')).data.data,
  });

  const [sortField, sortDir] = filters.sort.split('-');
  const { data: productsPage, isLoading, isError, refetch, isFetching } = useQuery<Page<Product>>({
    queryKey: ['products', filters, page],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = { sortBy: sortField, sortDir, size: PAGE_SIZE, page };
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.query) params.query = filters.query;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = true;
      return (await axiosClient.get('/products', { params })).data.data;
    },
    placeholderData: keepPreviousData,
  });

  const products = productsPage?.content || [];
  const total = productsPage?.totalElements ?? 0;

  const updateFilters = (changes: Partial<ShopFilters>) => {
    const next = { ...filters, ...changes };
    const params: Record<string, string> = {};
    if (next.categoryId) params.category = String(next.categoryId);
    if (next.query) params.query = next.query;
    if (next.sort !== 'createdAt-desc') params.sort = next.sort;
    if (next.minPrice) params.minPrice = next.minPrice;
    if (next.maxPrice) params.maxPrice = next.maxPrice;
    if (next.inStock) params.inStock = 'true';
    setSearchParams(params); // any filter change returns to page 1
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p > 0) params.set('page', String(p));
    else params.delete('page');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategory = categories?.find((c) => c.id === filters.categoryId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <nav className="text-[11px] text-slate-400 mb-1" aria-label="Breadcrumb">
            Shop{activeCategory ? ` / ${activeCategory.name}` : ''}
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">{activeCategory ? activeCategory.name : 'NGO Impact Marketplace'}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeCategory?.description || 'Handcrafted products made by the artisan communities the NGO works with.'}
          </p>
        </div>
        <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold border border-emerald-200 whitespace-nowrap" aria-live="polite">
          {isLoading ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}${filters.query ? ` for “${filters.query}”` : ''}`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProductFilter
            categories={categories || []}
            filters={filters}
            onChange={updateFilters}
            onReset={() => setSearchParams({})}
          />
        </div>

        <div className={`lg:col-span-3 space-y-6 ${isFetching && !isLoading ? 'opacity-70' : ''}`}>
          <ProductGrid
            products={products}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            onAddToCart={(p) => addToCart(p)}
            onToggleWishlist={toggleWishlist}
            busyProductId={pendingId}
            emptyAction={
              <button onClick={() => setSearchParams({})} className="text-xs font-semibold text-emerald-600 underline">
                Clear all filters
              </button>
            }
          />
          <Pagination page={page} totalPages={productsPage?.totalPages ?? 0} onPageChange={goToPage} />
        </div>
      </div>
    </div>
  );
};
