import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ShoppingCart, Users, AlertTriangle, Inbox, Clock } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { AdminAnalytics, Order } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatINR, formatDate, humanize } from '@/lib/format';

export const AdminDashboard: React.FC = () => {
  const { data: analytics, isLoading, isError, refetch } = useQuery<AdminAnalytics>({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await axiosClient.get('/admin/analytics')).data.data,
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (isError || !analytics) {
    return (
      <div className="text-center py-12 space-y-3" role="alert">
        <p className="text-sm text-red-300">Dashboard data could not be loaded.</p>
        <button onClick={() => refetch()} className="btn-primary px-4 py-2">Retry</button>
      </div>
    );
  }

  const cards = [
    { label: 'Revenue', value: formatINR(analytics.totalRevenue, 0), note: 'Paid, not cancelled orders', icon: IndianRupee, color: 'text-emerald-400' },
    { label: 'Orders', value: String(analytics.totalOrders), note: `${analytics.paidOrders} paid · ${analytics.pendingPaymentOrders} awaiting payment`, icon: ShoppingCart, color: 'text-blue-400' },
    { label: 'Customers', value: String(analytics.totalCustomers), note: 'Registered customer accounts', icon: Users, color: 'text-amber-400' },
    { label: 'Low Stock', value: String(analytics.lowStockProductsCount), note: `Products under ${analytics.lowStockThreshold} units`, icon: AlertTriangle, color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Operations &amp; Analytics Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">Figures are calculated from the orders, products and accounts stored in the database.</p>
      </div>

      {(analytics.refundsDueCount > 0 || analytics.newContactMessages > 0) && (
        <div className="space-y-2">
          {analytics.refundsDueCount > 0 && (
            <Link to="/admin/orders?orderStatus=CANCELLED&paymentStatus=PAID" className="block bg-rose-900/40 border border-rose-700 text-rose-200 text-xs rounded-xl p-3">
              <strong>{analytics.refundsDueCount}</strong> paid order(s) were cancelled and need a refund in the Razorpay dashboard. Mark them “Refunded” once done.
            </Link>
          )}
          {analytics.newContactMessages > 0 && (
            <Link to="/admin/messages" className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-3">
              <Inbox className="w-4 h-4" aria-hidden="true" /> {analytics.newContactMessages} new contact message(s)
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="admin-card p-5 space-y-2 shadow-sm">
            <div className={`flex items-center justify-between ${c.color}`}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.label}</span>
              <c.icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-3xl font-extrabold text-white">{c.value}</p>
            <span className="text-[10px] text-slate-400 font-medium">{c.note}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-emerald-400 font-semibold">All orders &rarr;</Link>
          </div>
          {analytics.recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {analytics.recentOrders.map((ord: Order) => (
                    <tr key={ord.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 font-semibold text-white">{ord.orderNumber}</td>
                      <td className="p-3">{ord.customerName}</td>
                      <td className="p-3">{formatDate(ord.createdAt)}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatINR(ord.totalAmount)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${ord.paymentStatus === 'PAID' ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-900/80 text-amber-300'}`}>
                          {humanize(ord.paymentStatus)}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-300">{humanize(ord.orderStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="admin-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4" aria-hidden="true" /> Orders by status</h2>
            <ul className="text-xs space-y-1">
              {Object.entries(analytics.ordersByStatus).filter(([, n]) => n > 0).map(([status, n]) => (
                <li key={status} className="flex justify-between text-slate-300">
                  <Link to={`/admin/orders?orderStatus=${status}`} className="hover:text-white">{humanize(status)}</Link>
                  <span className="font-bold">{n}</span>
                </li>
              ))}
              {analytics.totalOrders === 0 && <li className="text-slate-500">No orders yet.</li>}
            </ul>
          </div>

          <div className="admin-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-white">Low stock</h2>
            {analytics.lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400">All products are above the threshold.</p>
            ) : (
              <ul className="text-xs space-y-1">
                {analytics.lowStockProducts.map((p) => (
                  <li key={p.id} className="flex justify-between text-slate-300">
                    <Link to={`/admin/products?query=${encodeURIComponent(p.sku)}`} className="hover:text-white truncate">{p.name}</Link>
                    <span className={`font-bold ${p.stockQuantity === 0 ? 'text-rose-400' : 'text-amber-300'}`}>{p.stockQuantity}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-slate-500">Active campaigns: {analytics.activeCampaignsCount} · Products: {analytics.totalProducts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
