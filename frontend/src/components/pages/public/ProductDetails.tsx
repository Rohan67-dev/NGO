import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Heart, Sparkles, ShieldCheck, Truck, RefreshCw, Plus, Minus, ArrowLeft } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { Product } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { setCart, openCart } = useCartStore();
  const { isInWishlist } = useWishlistStore();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await axiosClient.get(`/products/${slug}`);
      return res.data.data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error || !product) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-800">Product not found</h3>
        <button onClick={() => navigate('/shop')} className="mt-4 text-xs font-semibold text-emerald-600 underline">
          Return to Shop Catalog
        </button>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  const handleAddToCart = async () => {
    try {
      const res = await axiosClient.post('/cart/items', { productId: product.id, quantity });
      if (res.data.success) {
        setCart(res.data.data);
        openCart();
      }
    } catch (e) {
      console.error('Failed to add to cart', e);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/checkout');
  };

  const handleToggleWishlist = async () => {
    try {
      if (isWishlisted) {
        await axiosClient.delete(`/wishlist/${product.id}`);
      } else {
        await axiosClient.post(`/wishlist/${product.id}`);
      }
    } catch (e) {
      console.error('Failed to toggle wishlist', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        {/* Gallery Column */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
            <img
              src={product.imageUrls?.[activeImageIndex] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail list */}
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.imageUrls.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-emerald-600 scale-105' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{product.categoryName}</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{product.name}</h1>
            <p className="text-xs text-slate-400 mt-1">SKU: {product.sku}</p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-slate-100">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-extrabold text-slate-900">₹{product.discountPrice}</span>
                <span className="text-sm text-slate-400 line-through">₹{product.price}</span>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Save ₹{product.price - (product.discountPrice || 0)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-slate-900">₹{product.price}</span>
            )}
          </div>

          {/* VERIFIED NGO IMPACT BOX */}
          {product.impactDescription && (
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>PURCHASE TO IMPACT RELATIONSHIP</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">{product.impactDescription}</p>
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1 border-t border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified NGO Contribution &bull; Fair-Wage Certified</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Product Story &amp; Details</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Stock & Quantity */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Availability</span>
              <span className={`font-bold ${product.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
              </span>
            </div>

            {product.stockQuantity > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-700">Quantity</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:text-emerald-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    className="p-2 hover:text-emerald-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity <= 0}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                Buy Now
              </button>

              <button
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isWishlisted ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
