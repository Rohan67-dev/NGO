import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Edit3, X, Truck } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { Order } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const AdminOrders: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('CONFIRMED');
  const [trackingNo, setTrackingNo] = useState('');
  const [carrier, setCarrier] = useState('BlueDart Express');

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await axiosClient.get('/admin/orders?size=50');
      return res.data.data;
    },
  });

  const orders: Order[] = ordersData?.content || [];

  const handleOpenStatusModal = (ord: Order) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus);
    setTrackingNo(ord.trackingNumber || '');
    setCarrier(ord.shippingCarrier || 'BlueDart Express');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await axiosClient.put(`/admin/orders/${selectedOrder.id}/status`, {
        orderStatus: newStatus,
        trackingNumber: trackingNo,
        shippingCarrier: carrier,
      });
      setSelectedOrder(null);
      refetch();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-xs text-slate-400 mt-1">Update customer order statuses and attach shipping tracking numbers.</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-semibold text-white">{ord.orderNumber}</td>
                    <td className="p-3">
                      <span className="block text-white font-medium">{ord.customerName}</span>
                      <span className="text-[10px] text-slate-400">{ord.customerEmail}</span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">₹{ord.totalAmount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ord.paymentStatus === 'PAID' ? 'bg-emerald-900/80 text-emerald-300' : 'bg-amber-900/80 text-amber-300'
                      }`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">{ord.orderStatus}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleOpenStatusModal(ord)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg">
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold">Update Order #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Order Status Transition</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl">
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Shipping Carrier</label>
                <input type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Tracking Number</label>
                <input type="text" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="e.g. BLUEDART-98765432" className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition-colors">
                Save Order Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
