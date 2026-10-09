import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { Product } from '../../types';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onToggleWishlist }) => {
  const { isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);
  const primaryImage = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls[0]
    : 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800';

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      {/* Featured / Impact Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {hasDiscount && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            SALE
          </span>
        )}
        {product.featured && (
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-300" /> Featured
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${
          isWishlisted
            ? 'bg-rose-50 text-rose-600'
            : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
        }`}
        title="Save to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
      </button>

      {/* Image Container */}
      <Link to={`/product/${product.slug}`} className="block relative aspect-square bg-slate-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Product Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category */}
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            {product.categoryName}
          </span>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block font-semibold text-slate-900 text-sm hover:text-emerald-700 transition-colors line-clamp-1 mb-1">
            {product.name}
          </Link>

          {/* Impact Statement Box */}
          {product.impactDescription && (
            <div className="my-2 bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 text-emerald-900 text-[11px] flex items-start gap-1.5 leading-snug">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-medium">{product.impactDescription}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
          {/* Pricing */}
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-slate-900">₹{product.discountPrice}</span>
                <span className="text-xs text-slate-400 line-through">₹{product.price}</span>
              </div>
            ) : (
              <span className="text-base font-bold text-slate-900">₹{product.price}</span>
            )}
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={() => onAddToCart && onAddToCart(product)}
            disabled={product.stockQuantity <= 0}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              product.stockQuantity > 0
                ? 'bg-slate-900 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.stockQuantity > 0 ? 'Add' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
};
