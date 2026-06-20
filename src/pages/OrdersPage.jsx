import React, { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { orderAPI } from '../services/api';
import OrderCard from '../components/OrderCard';
import PaymentModal from '../components/PaymentModal';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { ChefHat, AlertCircle, Sparkles, RefreshCw, LayoutGrid } from 'lucide-react';

const SOCKET_URL = 'http://localhost:5002';

const STATUS_FILTERS = ['ALL', 'TO_COOK', 'PREPARING', 'COMPLETED', 'PAID'];

const STATUS_LABELS = {
  ALL: 'All Orders',
  TO_COOK: 'To Cook',
  PREPARING: 'Preparing',
  COMPLETED: 'Ready',
  PAID: 'Paid',
};

const STATUS_COLORS = {
  ALL: 'bg-slate-900 text-white',
  TO_COOK: 'bg-sky-500 text-white',
  PREPARING: 'bg-amber-500 text-white',
  COMPLETED: 'bg-indigo-500 text-white',
  PAID: 'bg-emerald-600 text-white',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const data = await orderAPI.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve orders. Please check your backend service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    // #region agent log
    socket.on('connect', () => { fetch('http://127.0.0.1:7649/ingest/dff68585-60b3-405f-8e0d-06891e84f1db',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a8d7a2'},body:JSON.stringify({sessionId:'a8d7a2',location:'OrdersPage.jsx:socket',message:'socket.io-client resolved and connected',data:{url:SOCKET_URL,socketId:socket.id},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{}); });
    // #endregion
    socket.on('order-status-updated', () => fetchOrders(true));
    socket.on('order-created', () => fetchOrders(true));
    return () => socket.disconnect();
  }, [fetchOrders]);

  const handleCompletePayment = (order) => {
    setPaymentOrder(order);
  };

  const handleConfirmPayment = async () => {
    if (!paymentOrder) return;
    try {
      setPaymentProcessing(true);
      await orderAPI.updateStatus(paymentOrder.id, 'PAID');
      setPaymentOrder(null);
      await fetchOrders(true);
    } catch (err) {
      console.error('Failed to complete payment:', err);
      setErrorModal({ isOpen: true, message: 'Payment could not be processed. Please try again.' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
    const matchesSearch =
      (order.customerName && order.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (order.tables &&
        order.tables.some((t) => t.tableNumber.toLowerCase().includes(search.toLowerCase()))) ||
      order.id.toString().includes(search);
    return matchesStatus && matchesSearch;
  });

  // Summary counts
  const countByStatus = (status) => orders.filter((o) => o.status === status).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ── Payment Modal ── */}
      <PaymentModal
        order={paymentOrder}
        isOpen={!!paymentOrder}
        onClose={() => !paymentProcessing && setPaymentOrder(null)}
        onConfirm={handleConfirmPayment}
        processing={paymentProcessing}
      />

      {/* ── Error Modal Overlay ── */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in border border-slate-100 text-center">
            <h3 className="text-xl font-bold text-rose-600 mb-2">Action Rejected</h3>
            <p className="text-slate-600 text-sm mb-6">{errorModal.message}</p>
            <button onClick={() => setErrorModal({ isOpen: false, message: '' })} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
            <ChefHat size={32} className="text-amber-400" />
            Kitchen &amp; Orders Log
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Read-only order tracker — kitchen handles preparation, POS handles payment.
          </p>

          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold">
              {countByStatus('TO_COOK')} To Cook
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
              {countByStatus('PREPARING')} Preparing
            </span>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold">
              {countByStatus('COMPLETED')} Ready
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold">
              {countByStatus('PAID')} Paid
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="w-full md:w-80">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by customer, table, or order ID..."
            />
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </div>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100 scrollbar-thin">
        {STATUS_FILTERS.map((status) => {
          const count = status === 'ALL' ? orders.length : countByStatus(status);
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm border whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatus === status
                  ? `${STATUS_COLORS[status]} border-transparent shadow-md`
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              {STATUS_LABELS[status]}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  selectedStatus === status
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Orders Grid ── */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center max-w-md mx-auto my-8 shadow-sm">
          <AlertCircle className="mx-auto text-rose-500 mb-3" size={40} />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Retrieval Failed</h3>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md transition text-sm"
          >
            Refresh Logs
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description={
            selectedStatus !== 'ALL'
              ? `No orders with status "${STATUS_LABELS[selectedStatus]}" found.`
              : search
              ? `No orders matching "${search}".`
              : 'The order log is currently empty.'
          }
          icon={selectedStatus === 'ALL' ? Sparkles : LayoutGrid}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCompletePayment={handleCompletePayment}
              isLocked={paymentProcessing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
