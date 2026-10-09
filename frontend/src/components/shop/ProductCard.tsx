import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useWishlistStore } from '../../store/useWishlistStore';
import { formatINR, hasDiscount, PLACEHOLDER_IMAGE } from '../../lib/format';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  busy?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onToggleWishlist, busy }) => {
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => i.id === product.id));
  const primaryImage = product.imageUrls?.[0] || PLACEHOLDER_IMAGE;
  const discounted = hasDiscount(product);
  const purchasable = product.status === 'ACTIVE' && product.stockQuantity > 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {discounted && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">SALE</span>
        )}
        {product.featured && (
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-300" aria-hidden="true" /> Featured
          </span>
        )}
      </div>

      {onToggleWishlist && (
        <button
          onClick={() => onToggleWishlist(product)}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${
            isWishlisted ? 'bg-rose-50 text-rose-600' : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
        </button>
      )}

      <Link to={`/product/${product.slug}`} className="block relative aspect-square bg-slate-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${purchasable ? '' : 'opacity-60'}`}
          loading="lazy"
        />
        {!purchasable && (
          <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Out of stock</span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">{product.categoryName}</span>
          <Link to={`/product/${product.slug}`} className="block font-semibold text-slate-900 text-sm hover:text-emerald-700 transition-colors line-clamp-2 mb-1">
            {product.name}
          </Link>
          {product.material && (
            <p className="text-[11px] text-slate-500">
              {product.material}
              {product.dimensions ? ` · ${product.dimensions}` : ''}
            </p>
          )}
          {product.impactDescription && (
            <div className="my-2 bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 text-emerald-900 text-[11px] flex items-start gap-1.5 leading-snug">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium line-clamp-3">{product.impactDescription}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
          <div>
            {discounted ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-slate-900">{formatINR(product.discountPrice, 0)}</span>
                <span className="text-xs text-slate-400 line-through">{formatINR(product.price, 0)}</span>
              </div>
            ) : (
              <span className="text-base font-bold text-slate-900">{formatINR(product.price, 0)}</span>
            )}
          </div>

          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              disabled={!purchasable || busy}
              aria-label={purchasable ? `Add ${product.name} to cart` : `${product.name} is sold out`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                purchasable
                  ? 'bg-slate-900 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md disabled:opacity-60'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              {purchasable ? (busy ? 'Adding…' : 'Add') : 'Sold Out'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
