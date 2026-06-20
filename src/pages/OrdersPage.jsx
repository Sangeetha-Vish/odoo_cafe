import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { ChefHat, AlertCircle, X, Search, Trash2, Edit } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { setCartItems, setCustomerName, setPaymentMethod, setSelectedTables } = useCart();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Selected Order Modal detail state
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderAPI.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve orders. Please check your backend service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtering based on customer name, order number, or date string
  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase();
    const orderNum = `Order #${order.id}`.toLowerCase();
    const dateStr = formatDate(order.created_at).toLowerCase();
    const customer = (order.customerName || 'Walk-in Customer').toLowerCase();
    return orderNum.includes(q) || dateStr.includes(q) || customer.includes(q);
  });

  async function handleDeleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this draft order?')) return;
    try {
      await orderAPI.updateStatus(orderId, 'CANCELLED'); // cancelling draft order
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setSelectedOrder(null);
    } catch (err) {
      alert('Failed to delete order');
    }
  }

  function handleEditOrder(order) {
    // Populate cart items
    const mapped = order.orderItems.map((item) => ({
      product: {
        ...item.product,
        price: Number(item.price),
      },
      quantity: item.quantity,
    }));

    setCartItems(mapped);
    setCustomerName(order.customerName || '');
    setPaymentMethod(order.paymentMethod || 'CASH');
    setSelectedTables(order.tables || []);

    // Close modal & redirect to POS page
    setSelectedOrder(null);
    navigate('/pos');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header Pattern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500 text-slate-900 p-2.5 rounded-2xl shadow">
            <ChefHat size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider leading-none">Order Registry</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Active terminal orders log
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search Customer Name, Order number, Date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-750 px-4 py-3 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent placeholder-slate-500 font-semibold"
          />
          <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* Orders Table view */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3.5 font-bold">Date</th>
              <th className="px-5 py-3.5 font-bold">Order Number</th>
              <th className="px-5 py-3.5 font-bold">Customer Name</th>
              <th className="px-5 py-3.5 font-bold">Status &amp; Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400 font-bold">
                  Loading orders…
                </td>
              </tr>
            )}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400 font-bold">
                  No orders matched search criteria.
                </td>
              </tr>
            )}

            {filteredOrders.map((order) => {
              const isPaid = order.status === 'PAID';
              return (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-slate-50/70 transition cursor-pointer"
                >
                  <td className="px-5 py-4 text-slate-500 text-xs font-semibold">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-800">
                    Order #{order.id}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {order.customerName || 'Walk-in Customer'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-600 text-white border border-emerald-600'
                            : 'border-2 border-slate-350 text-slate-500 bg-white'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        ₹{Number(order.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal Popup */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  Order Details #{selectedOrder.id}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-450 hover:text-slate-650 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Info body */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Customer</span>
                  <span className="font-bold text-slate-700">{selectedOrder.customerName || 'Walk-in Customer'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider">Total amount</span>
                  <span className="font-extrabold text-indigo-650 text-sm">₹{Number(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Products List table */}
              <div>
                <span className="block font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-2">Items Purchased</span>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3 max-h-48 overflow-y-auto space-y-2">
                  {selectedOrder.orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-slate-700 font-semibold">
                      <div>
                        <span>{item.product?.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-medium">x{item.quantity}</span>
                      </div>
                      <span className="font-mono text-slate-800">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            {selectedOrder.status !== 'PAID' ? (
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-black px-4 py-2.5 rounded-xl border border-rose-200 transition flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Delete Order</span>
                </button>
                <button
                  onClick={() => handleEditOrder(selectedOrder)}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Edit size={14} />
                  <span>Edit Order</span>
                </button>
              </div>
            ) : (
              // View-only paid order has no action buttons
              <div className="pt-4 border-t border-slate-100 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ✓ Order Paid and Finalized
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
