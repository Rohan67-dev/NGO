import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Heart, Sparkles, Plus, Minus, ArrowLeft } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { Product } from '@/types';
import { useWishlistStore } from '@/store/useWishlistStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProductCard } from '@/components/shop/ProductCard';
import { useShopActions } from '@/hooks/useShopActions';
import { formatINR, hasDiscount, PLACEHOLDER_IMAGE } from '@/lib/format';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addToCart, toggleWishlist, pendingId } = useShopActions();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => (await axiosClient.get(`/products/${slug}`)).data.data,
    enabled: !!slug,
  });

  const { data: related } = useQuery<Product[]>({
    queryKey: ['related-products', slug],
    queryFn: async () => (await axiosClient.get(`/products/${slug}/related`, { params: { limit: 4 } })).data.data,
    enabled: !!product,
  });

  const isWishlisted = useWishlistStore((s) => (product ? s.items.some((i) => i.id === product.id) : false));

  // Reset selection when navigating between products
  useEffect(() => {
    setQuantity(1);
    setActiveImageIndex(0);
  }, [slug]);

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error || !product) {
    return (
      <div className="text-center py-16">
        <h1 className="text-lg font-bold text-slate-800">Product not found</h1>
        <p className="text-xs text-slate-500 mt-1">It may have been removed from the catalogue.</p>
        <button onClick={() => navigate('/shop')} className="mt-4 text-xs font-semibold text-emerald-600 underline">
          Return to Shop Catalog
        </button>
      </div>
    );
  }

  const discounted = hasDiscount(product);
  const purchasable = product.status === 'ACTIVE' && product.stockQuantity > 0;
  const images = product.imageUrls?.length ? product.imageUrls : [PLACEHOLDER_IMAGE];

  const details: [string, string | null | undefined][] = [
    ['Material', product.material],
    ['Size / Dimensions', product.dimensions],
    ['Colour', product.colour],
    ['Brand', product.brand],
    ['Manufacturer', product.manufacturer],
    ['HSN Code', product.hsnCode],
    ['GST', product.gstRate != null ? `${product.gstRate}%` : null],
    ['SKU', product.sku],
    ...Object.entries(product.extraAttributes || {}),
  ];
  const shownDetails = details.filter(([, v]) => v != null && v !== '');

  const handleAddToCart = () => addToCart(product, quantity);

  const handleBuyNow = async () => {
    // Only continue to checkout when the item really is in the cart.
    if (await addToCart(product, quantity, false)) navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/shop" className="inline-flex items-center gap-1 font-semibold hover:text-emerald-600">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Shop
        </Link>
        <span>/</span>
        <Link to={`/shop?category=${product.categoryId}`} className="hover:text-emerald-600">{product.categoryName}</Link>
        <span>/</span>
        <span className="text-slate-700 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
            <img src={images[activeImageIndex] || images[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Show image ${idx + 1} of ${images.length}`}
                  aria-current={activeImageIndex === idx}
                  className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-emerald-600 scale-105' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{product.categoryName}</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{product.name}</h1>
            {product.shortDescription && <p className="text-sm text-slate-500 mt-2">{product.shortDescription}</p>}
          </div>

          <div className="flex items-baseline gap-3 pb-4 border-b border-slate-100 flex-wrap">
            {discounted ? (
              <>
                <span className="text-3xl font-extrabold text-slate-900">{formatINR(product.discountPrice)}</span>
                <span className="text-sm text-slate-400 line-through">{formatINR(product.price)}</span>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Save {formatINR(product.price - (product.discountPrice || 0))}
                </span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-slate-900">{formatINR(product.price)}</span>
            )}
            <span className="text-[11px] text-slate-400 w-full">GST and shipping are calculated at checkout.</span>
          </div>

          {product.impactDescription && (
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-yellow-300" aria-hidden="true" />
                <span>ABOUT THE IMPACT</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">{product.impactDescription}</p>
            </div>
          )}

          {product.description && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Product Story &amp; Details</h2>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {shownDetails.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border border-slate-100 rounded-2xl p-4 bg-slate-50/60">
              {shownDetails.map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-800 break-words">{value}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Availability</span>
              <span className={`font-bold ${purchasable ? 'text-emerald-600' : 'text-red-500'}`}>
                {purchasable ? (product.stockQuantity <= 5 ? `Only ${product.stockQuantity} left` : 'In stock') : 'Out of stock'}
              </span>
            </div>

            {purchasable && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-700" id="qty-label">Quantity</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50" role="group" aria-labelledby="qty-label">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-emerald-600 disabled:opacity-40" disabled={quantity <= 1} aria-label="Decrease quantity">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-800" aria-live="polite">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} className="p-2 hover:text-emerald-600 disabled:opacity-40" disabled={quantity >= product.stockQuantity} aria-label="Increase quantity">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!purchasable || pendingId === product.id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                {pendingId === product.id ? 'Adding…' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!purchasable || pendingId === product.id}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={isWishlisted}
                className={`p-3.5 rounded-2xl border transition-all flex justify-center ${
                  isWishlisted ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">More from {product.categoryName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={(x) => addToCart(x)} onToggleWishlist={toggleWishlist} busy={pendingId === p.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
