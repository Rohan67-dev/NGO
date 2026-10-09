import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { ShoppingBag } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (productId: number) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading, onAddToCart, onToggleWishlist }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-2xl aspect-square animate-pulse h-72" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 max-w-md mx-auto my-8">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">No products found</h3>
        <p className="text-xs text-slate-500 mb-4">Try clearing filters or searching for something else.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
};
