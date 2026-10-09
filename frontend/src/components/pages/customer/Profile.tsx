import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User as UserIcon, Package, Clock, ShieldCheck, Truck } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { axiosClient } from '../../../api/axiosClient';
import { Order } from '../../../types';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();

  const { data: orders } = useQuery<Order[]>({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const res = await axiosClient.get('/orders');
      return res.data.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* User Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
          {user?.firstName?.[0]}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-slate-900">{user?.firstName} {user?.lastName}</h1>
          <p className="text-xs text-slate-500">{user?.email} &bull; {user?.phone || 'No phone added'}</p>
          <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
            {user?.role} ACCOUNT
          </span>
        </div>
      </div>

      {/* Orders Timeline & History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" /> Order History &amp; Impact Receipts
        </h2>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
            You haven't placed any impact orders yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">Order #{order.orderNumber}</span>
                    <span className="text-slate-400 block text-[11px]">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Payment: {order.paymentStatus}
                    </span>
                    <span className="bg-slate-900 text-white px-2.5 py-1 rounded-full font-bold text-[10px]">
                      Status: {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 text-xs">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">{item.productName}</span> x {item.quantity}
                        {item.impactDescriptionSnapshot && (
                          <span className="block text-[10px] text-emerald-600 italic">
                            Impact: {item.impactDescriptionSnapshot}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                {/* Tracking if available */}
                {order.trackingNumber && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Carrier: <strong>{order.shippingCarrier || 'Standard Express'}</strong> &bull; Tracking ID: <strong>{order.trackingNumber}</strong></span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>Total Amount Paid</span>
                  <span className="text-emerald-700 text-base">₹{order.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
