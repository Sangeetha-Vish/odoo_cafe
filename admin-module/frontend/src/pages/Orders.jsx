import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import { ClipboardList, Coffee, Check, Clock, AlertCircle, RefreshCw, Layers } from 'lucide-react';

const STATUS_ORDER = ['DRAFT', 'TO_COOK', 'PREPARING', 'COMPLETED', 'PAID'];

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  TO_COOK: 'bg-amber-50 text-amber-700 border-amber-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-emerald-50 text-emerald-705 border-emerald-205',
  PAID: 'bg-slate-900 text-slate-100 border-slate-950',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Setup Socket.IO listener for real-time order updates
    const socket = getSocket();

    const onOrderCreated = (newOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    };

    const onOrderUpdated = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
    };

    socket.on('order:created', onOrderCreated);
    socket.on('order:updated', onOrderUpdated);

    return () => {
      socket.off('order:created', onOrderCreated);
      socket.off('order:updated', onOrderUpdated);
    };
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await api.put(`/orders/${orderId}`, { status: nextStatus });
      if (res.data?.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...res.data.data } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top filter banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-2xl">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Live Orders Feed</h2>
            <p className="text-xs text-slate-450 font-semibold mt-0.5">Track kitchen queues, UPI collections, and table statuses</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition duration-200"
            title="Refresh feed"
          >
            <RefreshCw size={16} />
          </button>
          <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-150">
            {['ALL', 'TO_COOK', 'PREPARING', 'COMPLETED', 'PAID'].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => setStatusFilter(statusOption)}
                className={`rounded-lg px-3.5 py-2 text-[10px] font-black uppercase transition duration-150 ${
                  statusFilter === statusOption
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-150'
                    : 'text-slate-550 hover:text-slate-800'
                }`}
              >
                {statusOption === 'ALL' ? 'All Orders' : statusOption.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid layout */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold text-xs animate-pulse">
          Loading live orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-3">
          <AlertCircle className="text-slate-300" size={36} />
          <p className="text-xs font-bold text-slate-450 uppercase">No orders found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const tableList = order.tables || [];
            const tableNumbers = tableList.map((t) => t.table_number).join(', ') || 'Walk-in';

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden relative animate-fade-up hover:border-slate-200 transition-all duration-300"
              >
                {/* Order Top Ribbon */}
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        Order #{order.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${
                        STATUS_COLORS[order.status] || 'bg-slate-50'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Table Session</span>
                      <span className="text-xs font-extrabold text-indigo-750">Table {tableNumbers}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Payment (UPI/Cash)</span>
                      <span className="text-xs font-black text-slate-800">{order.payment_method}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 flex-1 space-y-3">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Ordered Items</span>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs font-semibold text-slate-650 flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-805 font-bold">
                            {item.quantity}x {item.product_name}
                          </span>
                          {item.notes && (
                            <span className="block text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 w-fit">
                              💡 Note: {item.notes}
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-800">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[10px] font-semibold text-slate-500">
                      <span className="font-bold text-slate-700 block mb-0.5">General Order Note:</span>
                      {order.notes}
                    </div>
                  )}
                </div>

                {/* Bottom summary and status toggler */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>Total Bill</span>
                    <span className="text-sm font-black text-indigo-650">₹{Number(order.total).toFixed(2)}</span>
                  </div>

                  {/* Actions to move order status */}
                  <div className="flex gap-2">
                    {order.status !== 'PAID' ? (
                      <>
                        {order.status === 'TO_COOK' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            className="w-full btn-primary py-2 px-3 text-[10px] font-black uppercase shadow-xs"
                            disabled={updatingId === order.id}
                          >
                            Accept to Cook
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-xl text-[10px] uppercase shadow-xs transition"
                            disabled={updatingId === order.id}
                          >
                            Ready to Serve
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PAID')}
                            className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-2 px-3 rounded-xl text-[10px] uppercase shadow-xs transition"
                            disabled={updatingId === order.id}
                          >
                            Settle & Close Bill
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                        <Check size={12} />
                        <span>Order Completed & Settled</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
