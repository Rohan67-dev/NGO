import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Truck, CreditCard, CheckCircle, ArrowRight, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { Address, Cart, Order } from '../../../types';
import { payForOrder } from '../../../lib/razorpay';
import { formatINR } from '../../../lib/format';
import { toast } from '../../../store/useToastStore';
import { LoadingSpinner } from '../../common/LoadingSpinner';

const emptyAddress = (name = '', phone = ''): Address => ({
  fullName: name,
  phone,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
});

export const Checkout: React.FC = () => {
  const { cart, setCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [address, setAddress] = useState<Address>(
    emptyAddress(user ? `${user.firstName} ${user.lastName}` : '', user?.phone || '')
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
  const [saveAddress, setSaveAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Always start from the server's view of the cart (prices/stock may have changed).
  const { isLoading: cartLoading } = useQuery<Cart>({
    queryKey: ['checkout-cart'],
    queryFn: async () => {
      const c = (await axiosClient.get('/cart')).data.data as Cart;
      setCart(c);
      return c;
    },
    gcTime: 0,
  });

  const { data: savedAddresses } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => (await axiosClient.get('/addresses')).data.data,
  });

  const { data: paymentConfig } = useQuery<{ onlinePaymentAvailable: boolean }>({
    queryKey: ['payment-config'],
    queryFn: async () => (await axiosClient.get('/payments/config')).data.data,
  });
  const paymentsEnabled = paymentConfig?.onlinePaymentAvailable ?? true;

  // Default to the customer's default saved address
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && selectedAddressId === 'new') {
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(def.id!);
      setAddress(def);
      setSaveAddress(false);
    }
  }, [savedAddresses]);

  const chooseAddress = (id: number | 'new') => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setAddress(emptyAddress(user ? `${user.firstName} ${user.lastName}` : '', user?.phone || ''));
      setSaveAddress(true);
    } else {
      const a = savedAddresses?.find((x) => x.id === id);
      if (a) setAddress(a);
      setSaveAddress(false);
    }
  };

  const refreshCart = async () => {
    try {
      setCart((await axiosClient.get('/cart')).data.data);
    } catch {
      /* the badge will refresh on next navigation */
    }
  };

  const runPayment = async (order: Order) => {
    const outcome = await payForOrder(order.id);
    if (outcome.status === 'paid') {
      const fresh = (await axiosClient.get(`/orders/${order.id}`)).data.data as Order;
      await refreshCart();
      setPendingOrder(null);
      setConfirmedOrder(fresh);
      window.scrollTo({ top: 0 });
    } else if (outcome.status === 'cancelled') {
      setPendingOrder(order);
      toast.info('Payment cancelled. Your order is saved as unpaid - you can pay now or later from My Account.');
    } else {
      setPendingOrder(order);
      setErrorMsg(outcome.message);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { id, isDefault, ...shippingAddress } = address;
      void id;
      void isDefault;
      const orderRes = await axiosClient.post('/orders', { shippingAddress, saveAddress: selectedAddressId === 'new' && saveAddress });
      const order: Order = orderRes.data.data;
      await runPayment(order);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to place order.'));
      await refreshCart();
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async () => {
    if (!pendingOrder) return;
    setErrorMsg('');
    setLoading(true);
    try {
      await runPayment(pendingOrder);
    } finally {
      setLoading(false);
    }
  };

  if (confirmedOrder) {
    const cancelledForStock = confirmedOrder.orderStatus === 'CANCELLED';
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl text-center space-y-6">
          <div className={`w-16 h-16 ${cancelledForStock ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center mx-auto shadow-md`}>
            {cancelledForStock ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">PAYMENT VERIFIED</span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {cancelledForStock ? 'Payment received, but an item sold out' : 'Thank you for your order!'}
            </h1>
            <p className="text-xs text-slate-500">Order reference: <strong>{confirmedOrder.orderNumber}</strong></p>
            {cancelledForStock && (
              <p className="text-xs text-amber-700">
                Another customer bought the last unit while you were paying. Your order has been cancelled and the full amount will be refunded.
              </p>
            )}
          </div>

          <div className="text-left text-xs space-y-1 border border-slate-100 rounded-2xl p-4">
            {confirmedOrder.items.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>{i.productName} × {i.quantity}</span>
                <span className="font-semibold">{formatINR(i.totalPrice)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t border-slate-100">
              <span>Total paid</span>
              <span>{formatINR(confirmedOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/profile')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all">
              Track Order Status
            </button>
            <button onClick={() => navigate('/shop')} className="flex-1 btn-primary py-3">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartLoading && !cart) return <LoadingSpinner size="lg" />;

  const items = cart?.items || [];
  if (items.length === 0 && !pendingOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Your cart is empty</h1>
        <Link to="/shop" className="btn-primary px-4 py-2 inline-block">Browse products</Link>
      </div>
    );
  }

  const addressField = (key: keyof Address, label: string, opts: { required?: boolean; type?: string; autoComplete?: string; maxLength?: number; pattern?: string; title?: string } = {}) => (
    <div>
      <label htmlFor={`addr-${key}`} className="form-label">{label}{opts.required === false ? ' (optional)' : ''}</label>
      <input
        id={`addr-${key}`}
        required={opts.required !== false}
        type={opts.type || 'text'}
        autoComplete={opts.autoComplete}
        maxLength={opts.maxLength || 120}
        pattern={opts.pattern}
        title={opts.title}
        value={(address[key] as string) || ''}
        disabled={selectedAddressId !== 'new'}
        onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
        className="form-input disabled:opacity-70"
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900">Checkout</h1>
        <p className="text-xs text-slate-500">Enter your delivery address and pay securely with Razorpay.</p>
      </div>

      {!paymentsEnabled && (
        <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl p-4 flex gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Online payment has not been enabled on this store yet, so orders cannot be completed right now. Your cart is saved - please check back soon or <Link to="/contact" className="underline">contact us</Link>.</span>
        </div>
      )}

      {errorMsg && (
        <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-4" role="alert">{errorMsg}</div>
      )}

      {pendingOrder && (
        <div className="max-w-3xl mx-auto bg-slate-900 text-white text-xs rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Order <strong>{pendingOrder.orderNumber}</strong> ({formatINR(pendingOrder.totalAmount)}) is saved and awaiting payment.</span>
          <div className="flex gap-2">
            <button onClick={retryPayment} disabled={loading || !paymentsEnabled} className="btn-primary px-4 py-2">{loading ? 'Opening…' : 'Pay now'}</button>
            <Link to="/profile" className="px-4 py-2 rounded-xl border border-slate-600 font-semibold">My orders</Link>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <fieldset className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6" disabled={loading}>
          <legend className="sr-only">Shipping address</legend>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Truck className="w-4 h-4 text-emerald-600" aria-hidden="true" /> 1. Shipping Address
          </h2>

          {savedAddresses && savedAddresses.length > 0 && (
            <div className="space-y-2">
              {savedAddresses.map((a) => (
                <label key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer ${selectedAddressId === a.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                  <input type="radio" name="saved-address" checked={selectedAddressId === a.id} onChange={() => chooseAddress(a.id!)} className="mt-0.5 accent-emerald-600" />
                  <span>
                    <strong>{a.fullName}</strong>{a.isDefault ? ' (default)' : ''} - {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} {a.postalCode} · {a.phone}
                  </span>
                </label>
              ))}
              <label className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer ${selectedAddressId === 'new' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                <input type="radio" name="saved-address" checked={selectedAddressId === 'new'} onChange={() => chooseAddress('new')} className="accent-emerald-600" />
                Use a new address
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addressField('fullName', 'Full Name', { autoComplete: 'name' })}
            {addressField('phone', 'Phone Number', { type: 'tel', autoComplete: 'tel', maxLength: 20, pattern: '[+0-9 ()-]{7,20}', title: '7-20 digits; +, spaces, brackets and dashes allowed' })}
          </div>
          {addressField('addressLine1', 'Address Line 1', { autoComplete: 'address-line1' })}
          {addressField('addressLine2', 'Address Line 2', { required: false, autoComplete: 'address-line2' })}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {addressField('city', 'City', { autoComplete: 'address-level2' })}
            {addressField('state', 'State', { autoComplete: 'address-level1' })}
            {addressField('postalCode', 'PIN Code', { autoComplete: 'postal-code', maxLength: 10, pattern: '[A-Za-z0-9 -]{3,10}', title: 'Enter a valid PIN / postal code' })}
            {addressField('country', 'Country', { autoComplete: 'country-name' })}
          </div>

          {selectedAddressId === 'new' && (
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-emerald-600" />
              Save this address to my account
            </label>
          )}
        </fieldset>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 h-fit">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-emerald-600" aria-hidden="true" /> 2. Order Review
          </h2>

          <div className="space-y-3 text-xs">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center gap-2 text-slate-700">
                <span className={`line-clamp-1 ${item.available ? '' : 'text-red-600'}`}>
                  {item.productName} × {item.quantity}
                  {!item.available && ' (unavailable)'}
                </span>
                <span className="font-bold text-slate-900 whitespace-nowrap">{formatINR(item.itemTotal)}</span>
              </div>
            ))}

            {cart && (
              <>
                <div className="pt-3 border-t border-slate-100 space-y-1 text-slate-600">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(cart.subtotal)}</span></div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{cart.shippingAmount === 0 ? <strong className="text-emerald-600">FREE</strong> : formatINR(cart.shippingAmount)}</span>
                  </div>
                  <div className="flex justify-between"><span>GST ({cart.taxRatePercent}%)</span><span>{formatINR(cart.taxAmount)}</span></div>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-emerald-700 text-lg">{formatINR(cart.totalAmount)}</span>
                </div>
                <p className="text-[10px] text-slate-400">Final amounts are calculated by our server when the order is placed.</p>
              </>
            )}
          </div>

          {cart?.hasUnavailableItems && (
            <p className="text-[11px] text-red-600" role="alert">Some items are unavailable. Update your cart to continue.</p>
          )}

          <button
            disabled={loading || !items.length || !!cart?.hasUnavailableItems || !paymentsEnabled}
            type="submit"
            className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processing…' : 'Place Order & Pay with Razorpay'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
};
