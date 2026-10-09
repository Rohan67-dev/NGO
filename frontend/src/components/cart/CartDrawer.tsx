import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { axiosClient } from '../../api/axiosClient';

export const CartDrawer: React.FC = () => {
  const { cart, isOpen, closeCart, setCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    try {
      const res = await axiosClient.put(`/cart/items/${itemId}?quantity=${newQty}`);
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (e) {
      console.error('Failed to update cart', e);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const res = await axiosClient.delete(`/cart/items/${itemId}`);
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (e) {
      console.error('Failed to remove cart item', e);
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const subtotal = cart?.subtotal || 0;
  const items = cart?.items || [];
  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeCart} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Your Impact Cart ({cart?.totalItems || 0})</span>
            </div>
            <button onClick={closeCart} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-emerald-50 px-4 py-2 text-[11px] border-b border-emerald-100 text-emerald-900">
            {remainingForFreeShipping > 0 ? (
              <p>Add <strong>₹{remainingForFreeShipping.toFixed(0)}</strong> more for <strong>FREE Delivery</strong>!</p>
            ) : (
              <p className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> You qualify for FREE Delivery!
              </p>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Your cart is empty</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">Discover meaningful handmade items that support real NGO causes.</p>
                <button
                  onClick={() => { closeCart(); navigate('/shop'); }}
                  className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Explore Shop Catalog
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg bg-white shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900 line-clamp-1">{item.productName}</h5>
                      {item.impactDescription && (
                        <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5 line-clamp-1">
                          <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" /> {item.impactDescription}
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-900 mt-1">₹{item.price}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:text-emerald-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:text-emerald-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 text-sm">₹{subtotal.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-400">Shipping and GST taxes calculated at checkout.</p>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
