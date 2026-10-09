import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { axiosClient, getErrorMessage } from '../../api/axiosClient';
import { toast } from '../../store/useToastStore';
import { formatINR, PLACEHOLDER_IMAGE } from '../../lib/format';

export const CartDrawer: React.FC = () => {
  const { cart, isOpen, closeCart, setCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [busyItem, setBusyItem] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    setBusyItem(itemId);
    try {
      const res = await axiosClient.put(`/cart/items/${itemId}`, null, { params: { quantity: newQty } });
      setCart(res.data.data);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not update the quantity.'));
    } finally {
      setBusyItem(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setBusyItem(itemId);
    try {
      const res = await axiosClient.delete(`/cart/items/${itemId}`);
      setCart(res.data.data);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not remove the item.'));
    } finally {
      setBusyItem(null);
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    navigate(isAuthenticated ? '/checkout' : '/login?redirect=/checkout');
  };

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const freeShippingThreshold = cart?.freeShippingThreshold ?? 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeCart} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShoppingBag className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Your Impact Cart ({cart?.totalItems || 0})</span>
            </div>
            <button onClick={closeCart} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200" aria-label="Close cart">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-800">Sign in to use your cart</p>
              <p className="text-xs text-slate-500">Your cart is saved to your account so it is there on every device.</p>
              <Link to="/login" onClick={closeCart} className="btn-primary px-4 py-2">Sign in</Link>
            </div>
          ) : (
            <>
              {items.length > 0 && (
                <div className="bg-emerald-50 px-4 py-2 text-[11px] border-b border-emerald-100 text-emerald-900">
                  {remainingForFreeShipping > 0 ? (
                    <p>Add <strong>{formatINR(remainingForFreeShipping, 0)}</strong> more for <strong>FREE Delivery</strong>!</p>
                  ) : (
                    <p className="font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> You qualify for FREE Delivery!
                    </p>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Your cart is empty</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Discover handmade items from the NGO&apos;s artisan communities.</p>
                    <button
                      onClick={() => { closeCart(); navigate('/shop'); }}
                      className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Explore Shop Catalog
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className={`flex gap-3 p-3 rounded-xl border ${item.available ? 'bg-slate-50/70 border-slate-200/60' : 'bg-red-50 border-red-200'}`}>
                      <Link to={`/product/${item.productSlug}`} onClick={closeCart} className="shrink-0">
                        <img src={item.imageUrl || PLACEHOLDER_IMAGE} alt={item.productName} className="w-16 h-16 object-cover rounded-lg bg-white" />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <Link to={`/product/${item.productSlug}`} onClick={closeCart} className="text-xs font-semibold text-slate-900 line-clamp-1 hover:text-emerald-700">
                            {item.productName}
                          </Link>
                          {item.impactDescription && (
                            <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5 line-clamp-1">
                              <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" /> {item.impactDescription}
                            </p>
                          )}
                          <p className="text-xs font-bold text-slate-900 mt-1">
                            {formatINR(item.unitPrice)}
                            {item.discountPrice != null && item.discountPrice < item.price && (
                              <span className="ml-1.5 text-[10px] text-slate-400 line-through font-normal">{formatINR(item.price)}</span>
                            )}
                          </p>
                          {!item.available && (
                            <p className="text-[10px] text-red-700 font-semibold flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              {item.stockQuantity > 0 ? `Only ${item.stockQuantity} left - reduce quantity` : 'No longer available - please remove'}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={busyItem === item.id}
                              className="p-1 hover:text-emerald-600 disabled:opacity-40"
                              aria-label={`Decrease quantity of ${item.productName}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800" aria-live="polite">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={busyItem === item.id || item.quantity >= item.stockQuantity}
                              className="p-1 hover:text-emerald-600 disabled:opacity-40"
                              aria-label={`Increase quantity of ${item.productName}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{formatINR(item.itemTotal)}</span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={busyItem === item.id}
                            className="text-slate-400 hover:text-red-500 p-1"
                            aria-label={`Remove ${item.productName} from cart`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && cart && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-bold text-slate-900">{formatINR(cart.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{cart.shippingAmount === 0 ? <strong className="text-emerald-600">FREE</strong> : formatINR(cart.shippingAmount)}</span></div>
                  <div className="flex justify-between"><span>GST ({cart.taxRatePercent}%)</span><span>{formatINR(cart.taxAmount)}</span></div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Estimated total</span><span>{formatINR(cart.totalAmount)}</span>
                  </div>
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={cart.hasUnavailableItems}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <span>{cart.hasUnavailableItems ? 'Fix unavailable items to continue' : 'Proceed to Checkout'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => { closeCart(); navigate('/shop'); }} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-emerald-600">
                    Continue shopping
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
