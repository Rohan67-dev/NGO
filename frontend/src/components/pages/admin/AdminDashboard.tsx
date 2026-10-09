import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingCart, Users, AlertTriangle, Megaphone, TrendingUp } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { AdminAnalytics, Order } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const AdminDashboard: React.FC = () => {
  const { data: analytics, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/analytics');
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!analytics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Operations &amp; Analytics Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time NGO marketplace revenue, orders, and inventory status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-white">₹{analytics.totalRevenue?.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-400 font-medium">Verified Paid Orders</span>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
            <ShoppingCart className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics.totalOrders}</p>
          <span className="text-[10px] text-slate-400 font-medium">Customer Transactions</span>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Customers</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics.totalCustomers}</p>
          <span className="text-[10px] text-slate-400 font-medium">Registered Supporters</span>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Alerts</span>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics.lowStockProductsCount}</p>
          <span className="text-[10px] text-rose-400 font-medium">Products &lt; 10 units</span>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Recent Marketplace Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {analytics.recentOrders?.map((ord: Order) => (
                <tr key={ord.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-3 font-semibold text-white">{ord.orderNumber}</td>
                  <td className="p-3">{ord.customerName}</td>
                  <td className="p-3 font-bold text-emerald-400">₹{ord.totalAmount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      ord.paymentStatus === 'PAID' ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-900/80 text-amber-300'
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-300">{ord.orderStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
