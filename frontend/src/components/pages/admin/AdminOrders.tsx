import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { X, Search } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { Order, OrderStatus, Page } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Pagination } from '../../common/Pagination';
import { toast } from '../../../store/useToastStore';
import { formatDate, formatINR, humanize } from '../../../lib/format';

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export const AdminOrders: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const orderStatus = params.get('orderStatus') || '';
  const paymentStatus = params.get('paymentStatus') || '';
  const query = params.get('query') || '';
  const page = Number(params.get('page') || 0);
  const [searchDraft, setSearchDraft] = useState(query);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [trackingNo, setTrackingNo] = useState('');
  const [carrier, setCarrier] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: ordersPage, isLoading, isError, refetch } = useQuery<Page<Order>>({
    queryKey: ['admin-orders', orderStatus, paymentStatus, query, page],
    queryFn: async () =>
      (await axiosClient.get('/admin/orders', {
        params: { orderStatus: orderStatus || undefined, paymentStatus: paymentStatus || undefined, query: query || undefined, page, size: 20 },
      })).data.data,
    placeholderData: keepPreviousData,
  });

  const orders = ordersPage?.content || [];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const openOrder = (ord: Order) => {
    setSelectedOrder(ord);
    setNewStatus('');
    setTrackingNo(ord.trackingNumber || '');
    setCarrier(ord.shippingCarrier || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (newStatus === 'CANCELLED' && selectedOrder.paymentStatus === 'PAID' &&
        !confirm('This order is paid. Cancelling returns its stock, and you must refund the customer in the Razorpay dashboard. Continue?')) {
      return;
    }
    setSaving(true);
    try {
      const res = await axiosClient.put(`/admin/orders/${selectedOrder.id}/status`, {
        orderStatus: newStatus || selectedOrder.orderStatus,
        trackingNumber: trackingNo,
        shippingCarrier: carrier,
      });
      toast.success('Order updated');
      setSelectedOrder(res.data.data);
      setNewStatus('');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update order status'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-xs text-slate-400 mt-1">Orders become Confirmed automatically when payment is verified. Then move them through packing and shipping.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 text-xs">
        <form onSubmit={(e) => { e.preventDefault(); setParam('query', searchDraft.trim()); }} className="relative flex-1" role="search">
          <label htmlFor="order-search" className="sr-only">Search orders</label>
          <input id="order-search" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Order number, customer name or email…" className="admin-input pl-8" />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" aria-hidden="true" />
        </form>
        <label htmlFor="order-status-filter" className="sr-only">Order status</label>
        <select id="order-status-filter" value={orderStatus} onChange={(e) => setParam('orderStatus', e.target.value)} className="admin-input sm:w-44">
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
        <label htmlFor="payment-status-filter" className="sr-only">Payment status</label>
        <select id="payment-status-filter" value={paymentStatus} onChange={(e) => setParam('paymentStatus', e.target.value)} className="admin-input sm:w-40">
          <option value="">All payments</option>
          {['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <p className="text-xs text-rose-300" role="alert">Orders could not be loaded.</p>
      ) : (
        <div className="admin-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No orders match.</td></tr>}
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-semibold text-white">{ord.orderNumber}</td>
                    <td className="p-3">
                      <span className="block text-white font-medium">{ord.customerName}</span>
                      <span className="text-[10px] text-slate-400">{ord.customerEmail}</span>
                    </td>
                    <td className="p-3">{formatDate(ord.createdAt)}</td>
                    <td className="p-3 font-bold text-emerald-400">{formatINR(ord.totalAmount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${ord.paymentStatus === 'PAID' ? 'bg-emerald-900/80 text-emerald-300' : ord.paymentStatus === 'FAILED' ? 'bg-rose-900/80 text-rose-300' : 'bg-amber-900/80 text-amber-300'}`}>
                        {humanize(ord.paymentStatus)}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      {humanize(ord.orderStatus)}
                      {ord.orderStatus === 'CANCELLED' && ord.paymentStatus === 'PAID' && <span className="block text-[10px] text-rose-300">Refund due</span>}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => openOrder(ord)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination dark page={page} totalPages={ordersPage?.totalPages ?? 0} onPageChange={(p) => setParam('page', p ? String(p) : '')} />

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 id="order-modal-title" className="text-sm font-bold">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400 uppercase text-[10px] font-semibold">Customer</p>
                <p>{selectedOrder.customerName}</p>
                <p className="text-slate-400">{selectedOrder.customerEmail}{selectedOrder.customerPhone ? ` · ${selectedOrder.customerPhone}` : ''}</p>
                <p className="text-slate-400 uppercase text-[10px] font-semibold pt-2">Ship to</p>
                <p className="text-slate-300">{selectedOrder.shippingAddressSnapshot}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 uppercase text-[10px] font-semibold">Status</p>
                <p>{humanize(selectedOrder.orderStatus)} · Payment {humanize(selectedOrder.paymentStatus)}</p>
                {selectedOrder.razorpayOrderId && <p className="text-slate-500 font-mono text-[10px]">Razorpay: {selectedOrder.razorpayOrderId}</p>}
                <p className="text-slate-400">Placed {formatDate(selectedOrder.createdAt)}</p>
              </div>
            </div>

            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-800">
                {selectedOrder.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-1.5">{i.productName} <span className="text-slate-500 font-mono">({i.productSku})</span></td>
                    <td className="py-1.5 text-right">{i.quantity} × {formatINR(i.unitPrice)}</td>
                    <td className="py-1.5 text-right font-semibold">{formatINR(i.totalPrice)}</td>
                  </tr>
                ))}
                <tr><td className="py-1.5 text-slate-400" colSpan={2}>Shipping / GST</td><td className="py-1.5 text-right">{formatINR(selectedOrder.shippingAmount)} / {formatINR(selectedOrder.taxAmount)}</td></tr>
                <tr><td className="py-1.5 font-bold" colSpan={2}>Total</td><td className="py-1.5 text-right font-bold text-emerald-400">{formatINR(selectedOrder.totalAmount)}</td></tr>
              </tbody>
            </table>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs border-t border-slate-800 pt-4">
              <div>
                <label htmlFor="order-next-status" className="admin-label">Change status</label>
                {selectedOrder.allowedNextStatuses.length === 0 ? (
                  <p className="text-slate-400">
                    {selectedOrder.orderStatus === 'PENDING' ? 'Awaiting payment.' : 'No further status changes are possible.'}
                  </p>
                ) : (
                  <select id="order-next-status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="admin-input">
                    <option value="">Keep as {humanize(selectedOrder.orderStatus)}</option>
                    {selectedOrder.allowedNextStatuses.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
                  </select>
                )}
                {selectedOrder.orderStatus === 'PENDING' && selectedOrder.paymentStatus !== 'PAID' && (
                  <p className="text-[11px] text-slate-500 mt-1">Unpaid orders are confirmed automatically when Razorpay payment is verified; they can only be cancelled here.</p>
                )}
                {newStatus === 'REFUNDED' && <p className="text-[11px] text-amber-300 mt-1">Only mark as refunded after issuing the refund in the Razorpay dashboard.</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="order-carrier" className="admin-label">Shipping Carrier</label>
                  <input id="order-carrier" type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. India Post" className="admin-input" />
                </div>
                <div>
                  <label htmlFor="order-tracking" className="admin-label">Tracking Number {newStatus === 'SHIPPED' && '(required)'}</label>
                  <input id="order-tracking" type="text" required={newStatus === 'SHIPPED'} value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} className="admin-input" />
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full btn-primary py-3">{saving ? 'Saving…' : 'Save Order Changes'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
