import React from 'react';
import { Armchair, User, Clock, Layers } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order, onCompletePayment, isLocked }) {
  const formattedDate = new Date(order.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getItemBadgeStyle = (item) => {
    if (item.completed || item.status === 'SERVED') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (item.status === 'READY') {
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
    if (item.status === 'PREPARING') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getItemLabel = (item) => {
    if (item.completed) return 'DONE';
    return item.status || 'PENDING';
  };

  const getStatusDot = (item) => {
    if (item.completed || item.status === 'SERVED') return 'bg-emerald-500';
    if (item.status === 'READY') return 'bg-indigo-500';
    if (item.status === 'PREPARING') return 'bg-amber-400 animate-pulse';
    return 'bg-slate-400';
  };

  const tablesLabel =
    order.tables && order.tables.length > 0
      ? order.tables.map((t) => t.tableNumber).join(' + ')
      : 'Takeaway';

  const isMergedTable = order.tables && order.tables.length > 1;
  const isPaid = order.status === 'PAID';
  const isReadyForPayment = order.status === 'COMPLETED';
  const servedCount = order.orderItems.filter((i) => i.completed || i.status === 'SERVED').length;
  const totalItems = order.orderItems.length;
  const progressPct = totalItems > 0 ? Math.round((servedCount / totalItems) * 100) : 0;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col transition-all duration-300 ${
        isPaid
          ? 'border-emerald-200 bg-emerald-50/30 opacity-90'
          : 'border-slate-100 hover:shadow-lg'
      }`}
    >
      <div className="flex justify-between items-start pb-3 border-b border-slate-50 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 tracking-wide">
              Order #{order.id}
            </span>
            {isMergedTable && (
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1">
                <Layers size={9} />
                Merged
              </span>
            )}
          </div>
          <div className="flex items-center text-slate-400 text-[10px] mt-1 gap-1">
            <Clock size={10} />
            <span>{formattedDate}</span>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.notes && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">Order Notes</p>
          <p className="text-xs text-amber-900 font-medium">{order.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 flex-1 min-w-0">
          <Armchair size={13} className="text-slate-400 flex-shrink-0" />
          <span className="truncate font-bold">{tablesLabel}</span>
        </div>
        {order.customerName && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-shrink-0">
            <User size={13} className="text-slate-400" />
            <span className="truncate max-w-[80px]">{order.customerName}</span>
          </div>
        )}
      </div>

      <div className="space-y-2.5 mb-4 flex-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
        {order.orderItems.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-xs gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(item)}`} />
              <div className="min-w-0">
                <span className="font-semibold text-slate-700 block truncate">
                  {item.quantity}× {item.product.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${getItemBadgeStyle(item)}`}
            >
              {getItemLabel(item)}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
          <span>Kitchen Progress</span>
          <span>{servedCount}/{totalItems} done</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-1 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-700">₹{order.subtotal.toFixed(2)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-rose-500 font-semibold">
            <span>Discount</span>
            <span>−₹{order.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax</span>
          <span className="font-semibold text-slate-700">₹{order.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-dashed border-slate-100">
          <span>Total</span>
          <span className="text-amber-600 text-base">₹{order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-2">
        <span>Via: <span className="font-bold text-slate-500">{order.paymentMethod.replace('_', ' ')}</span></span>
        {order.tables && order.tables.length > 0 && (
          <span className="font-semibold text-slate-400">
            {order.tables.map((t) => t.floor).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
          </span>
        )}
      </div>

      {isReadyForPayment && onCompletePayment && !isLocked && (
        <button
          onClick={() => onCompletePayment(order)}
          className="w-full mt-4 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition duration-200 text-xs"
        >
          ✓ Complete & Pay
        </button>
      )}

      {isPaid && (
        <div className="w-full mt-4 py-2.5 px-4 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs text-center border border-emerald-300">
          ✓ Order Completed & Paid
        </div>
      )}

      {!isPaid && !isReadyForPayment && (
        <div className="w-full mt-4 py-2.5 px-4 bg-slate-50 text-slate-500 font-semibold rounded-xl text-[10px] text-center border border-slate-100">
          Status tracked from kitchen — updates automatically
        </div>
      )}
    </div>
  );
}
