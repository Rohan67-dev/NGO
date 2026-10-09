import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, MapPin, UserCog, Trash2, Star } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { Address, Order } from '../../../types';
import { payForOrder } from '../../../lib/razorpay';
import { formatDate, formatINR, humanize, PLACEHOLDER_IMAGE } from '../../../lib/format';
import { toast } from '../../../store/useToastStore';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { PasswordInput } from '../../common/PasswordInput';

type Tab = 'orders' | 'profile' | 'addresses';

const statusBadge = (s: string) => {
  if (s === 'PAID' || s === 'DELIVERED' || s === 'CONFIRMED') return 'bg-emerald-100 text-emerald-800';
  if (s === 'CANCELLED' || s === 'FAILED') return 'bg-red-100 text-red-700';
  if (s === 'REFUNDED') return 'bg-slate-200 text-slate-700';
  return 'bg-amber-100 text-amber-800';
};

const OrderCard: React.FC<{ order: Order; onChanged: () => void }> = ({ order, onChanged }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const awaitingPayment = order.orderStatus === 'PENDING' && order.paymentStatus !== 'PAID';

  const pay = async () => {
    setBusy('pay');
    const outcome = await payForOrder(order.id);
    if (outcome.status === 'paid') toast.success(`Payment received for ${order.orderNumber}`);
    else if (outcome.status === 'cancelled') toast.info('Payment cancelled.');
    else toast.error(outcome.message);
    setBusy(null);
    onChanged();
  };

  const reconcile = async () => {
    setBusy('check');
    try {
      const res = await axiosClient.post(`/payments/reconcile/${order.id}`);
      if (res.data.data) toast.success('Payment found - your order is confirmed.');
      else toast.info('No completed payment found for this order yet.');
      onChanged();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    if (!confirm(`Cancel order ${order.orderNumber}?`)) return;
    setBusy('cancel');
    try {
      await axiosClient.post(`/orders/${order.id}/cancel`);
      toast.success('Order cancelled');
      onChanged();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2 text-xs">
        <div>
          <span className="font-bold text-slate-900 text-sm">Order #{order.orderNumber}</span>
          <span className="text-slate-400 block text-[11px]">Placed {formatDate(order.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${statusBadge(order.paymentStatus)}`}>
            Payment: {humanize(order.paymentStatus)}
          </span>
          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${statusBadge(order.orderStatus)}`}>
            {humanize(order.orderStatus)}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between items-center gap-3 text-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <img src={item.imageUrl || PLACEHOLDER_IMAGE} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
              <div className="min-w-0">
                {item.productSlug ? (
                  <Link to={`/product/${item.productSlug}`} className="font-semibold text-slate-900 hover:text-emerald-700">{item.productName}</Link>
                ) : (
                  <span className="font-semibold text-slate-900">{item.productName}</span>
                )}{' '}
                × {item.quantity} <span className="text-slate-400">@ {formatINR(item.unitPrice)}</span>
              </div>
            </div>
            <span className="font-bold text-slate-900 whitespace-nowrap">{formatINR(item.totalPrice)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 flex gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{order.shippingAddressSnapshot}</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{formatINR(order.shippingAmount)}</span></div>
          <div className="flex justify-between"><span>GST</span><span>{formatINR(order.taxAmount)}</span></div>
          <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span>{formatINR(order.totalAmount)}</span></div>
        </div>
      </div>

      {order.trackingNumber && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span>Carrier: <strong>{order.shippingCarrier || 'Courier'}</strong> &bull; Tracking ID: <strong>{order.trackingNumber}</strong></span>
        </div>
      )}

      {order.orderStatus === 'CANCELLED' && order.paymentStatus === 'PAID' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">This paid order was cancelled. A refund will be issued to your original payment method.</p>
      )}

      {awaitingPayment && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button onClick={pay} disabled={!!busy} className="btn-primary px-4 py-2">{busy === 'pay' ? 'Opening…' : 'Pay now'}</button>
          {order.razorpayOrderId && (
            <button onClick={reconcile} disabled={!!busy} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:border-emerald-300">
              {busy === 'check' ? 'Checking…' : 'Check payment status'}
            </button>
          )}
          <button onClick={cancel} disabled={!!busy} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50">
            {busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}
          </button>
        </div>
      )}
    </div>
  );
};

const ProfileForm: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosClient.put('/auth/me', form);
      setUser(res.data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.put('/auth/me/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={saveProfile} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Personal details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-first" className="form-label">First name</label>
            <input id="p-first" required maxLength={100} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="form-input" />
          </div>
          <div>
            <label htmlFor="p-last" className="form-label">Last name</label>
            <input id="p-last" required maxLength={100} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="form-input" />
          </div>
        </div>
        <div>
          <label htmlFor="p-phone" className="form-label">Phone</label>
          <input id="p-phone" type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" />
        </div>
        <p className="text-[11px] text-slate-400">Email: {user?.email} (contact us to change it)</p>
        <button type="submit" disabled={saving} className="btn-primary px-4 py-2">{saving ? 'Saving…' : 'Save changes'}</button>
      </form>

      <form onSubmit={changePassword} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Change password</h2>
        <div>
          <label htmlFor="pw-current" className="form-label">Current password</label>
          <PasswordInput id="pw-current" value={pw.currentPassword} onChange={(v) => setPw({ ...pw, currentPassword: v })} autoComplete="current-password" />
        </div>
        <div>
          <label htmlFor="pw-new" className="form-label">New password (min. 6 characters)</label>
          <PasswordInput id="pw-new" value={pw.newPassword} onChange={(v) => setPw({ ...pw, newPassword: v })} autoComplete="new-password" minLength={6} />
        </div>
        <button type="submit" className="btn-primary px-4 py-2">Update password</button>
      </form>
    </div>
  );
};

const blankAddress: Address = { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India' };

const AddressBook: React.FC = () => {
  const qc = useQueryClient();
  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => (await axiosClient.get('/addresses')).data.data,
  });
  const [form, setForm] = useState<Address | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ['addresses'] });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    try {
      if (form.id) await axiosClient.put(`/addresses/${form.id}`, form);
      else await axiosClient.post('/addresses', form);
      setForm(null);
      refresh();
      toast.success('Address saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (a: Address) => {
    if (!confirm('Delete this address?')) return;
    try {
      await axiosClient.delete(`/addresses/${a.id}`);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const makeDefault = async (a: Address) => {
    try {
      await axiosClient.put(`/addresses/${a.id}`, { ...a, isDefault: true });
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const field = (key: keyof Address, label: string, required = true) => (
    <div>
      <label htmlFor={`ab-${key}`} className="form-label">{label}</label>
      <input
        id={`ab-${key}`}
        required={required}
        maxLength={120}
        value={(form?.[key] as string) || ''}
        onChange={(e) => form && setForm({ ...form, [key]: e.target.value })}
        className="form-input"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses?.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              {a.fullName} {a.isDefault && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Default</span>}
            </div>
            <p className="text-slate-600">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} {a.postalCode}, {a.country}</p>
            <p className="text-slate-500">{a.phone}</p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setForm(a)} className="font-semibold text-emerald-700">Edit</button>
              {!a.isDefault && (
                <button onClick={() => makeDefault(a)} className="font-semibold text-slate-600 flex items-center gap-1"><Star className="w-3 h-3" aria-hidden="true" /> Make default</button>
              )}
              <button onClick={() => remove(a)} className="font-semibold text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" aria-hidden="true" /> Delete</button>
            </div>
          </div>
        ))}
      </div>
      {addresses && addresses.length === 0 && !form && <p className="text-xs text-slate-500">No saved addresses yet.</p>}

      {form ? (
        <form onSubmit={save} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900">{form.id ? 'Edit address' : 'New address'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('fullName', 'Full name')}
            {field('phone', 'Phone')}
          </div>
          {field('addressLine1', 'Address line 1')}
          {field('addressLine2', 'Address line 2 (optional)', false)}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {field('city', 'City')}
            {field('state', 'State')}
            {field('postalCode', 'PIN code')}
            {field('country', 'Country')}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary px-4 py-2">Save address</button>
            <button type="button" onClick={() => setForm(null)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setForm({ ...blankAddress })} className="btn-primary px-4 py-2">Add address</button>
      )}
    </div>
  );
};

export const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'orders';

  const { data: orders, isLoading, isError, refetch } = useQuery<Order[]>({
    queryKey: ['customer-orders'],
    queryFn: async () => (await axiosClient.get('/orders')).data.data,
  });

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'profile', label: 'Profile & Password', icon: UserCog },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md" aria-hidden="true">
          {user?.firstName?.[0]}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-slate-900">{user?.firstName} {user?.lastName}</h1>
          <p className="text-xs text-slate-500">{user?.email} &bull; {user?.phone || 'No phone added'}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'orders' ? {} : { tab: t.id })}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border ${tab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-700'}`}
          >
            <t.icon className="w-4 h-4" aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="space-y-4">
          {isLoading && <LoadingSpinner />}
          {isError && <p className="text-xs text-red-600" role="alert">Your orders could not be loaded.</p>}
          {orders && orders.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-xs text-slate-500 space-y-3">
              <p>You haven&apos;t placed any orders yet.</p>
              <Link to="/shop" className="btn-primary px-4 py-2 inline-block">Start shopping</Link>
            </div>
          )}
          {orders?.map((order) => <OrderCard key={order.id} order={order} onChanged={() => refetch()} />)}
        </div>
      )}
      {tab === 'profile' && <ProfileForm />}
      {tab === 'addresses' && <AddressBook />}
    </div>
  );
};
