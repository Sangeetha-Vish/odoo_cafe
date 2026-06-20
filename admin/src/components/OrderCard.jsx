import React from 'react';
import { Calendar, Armchair, User, ChefHat, Clock, Layers } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ITEM_STATUS_FLOW = ['PENDING', 'PREPARING', 'READY', 'SERVED'];

export default function OrderCard({ order, onUpdateStatus, onUpdateItemStatus }) {
  const formattedDate = new Date(order.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getNextStatusAction = (status) => {
    switch (status) {
      case 'TO_COOK':
        return { next: 'PREPARING', label: 'Start Preparing', color: 'bg-amber-500 hover:bg-amber-600' };
      case 'PREPARING':
        return { next: 'COMPLETED', label: 'Mark as Ready', color: 'bg-indigo-500 hover:bg-indigo-600' };
      case 'COMPLETED':
        return { next: 'PAID', label: '✓ Complete & Pay', color: 'bg-emerald-600 hover:bg-emerald-700' };
      default:
        return null;
    }
  };

  const getNextItemStatus = (status) => {
    const idx = ITEM_STATUS_FLOW.indexOf(status);
    if (idx === -1 || idx === ITEM_STATUS_FLOW.length - 1) return null;
    return ITEM_STATUS_FLOW[idx + 1];
  };

  const getItemBadgeStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200';
      case 'PREPARING':
        return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200';
      case 'READY':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200';
      case 'SERVED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 cursor-default';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-slate-400';
      case 'PREPARING': return 'bg-amber-400 animate-pulse';
      case 'READY': return 'bg-indigo-500';
      case 'SERVED': return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  const action = getNextStatusAction(order.status);
  const tablesLabel =
    order.tables && order.tables.length > 0
      ? order.tables.map((t) => t.tableNumber).join(' + ')
      : 'Takeaway';

  const isMergedTable = order.tables && order.tables.length > 1;

  // Progress: how many items are served vs total
  const servedCount = order.orderItems.filter((i) => i.status === 'SERVED').length;
  const totalItems = order.orderItems.length;
  const progressPct = totalItems > 0 ? Math.round((servedCount / totalItems) * 100) : 0;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* ── Card Header ── */}
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

      {/* ── Table & Customer Info ── */}
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

      {/* ── Food Items + Prep Status ── */}
      <div className="space-y-2.5 mb-4 flex-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
        {order.orderItems.map((item) => {
          const nextItemStatus = getNextItemStatus(item.status);
          return (
            <div key={item.id} className="flex justify-between items-center text-xs gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(item.status)}`} />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-700 block truncate">
                    {item.quantity}× {item.product.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Food Prep Cycling Badge */}
              {order.status === 'PAID' ? (
                <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide flex-shrink-0 opacity-60 ${getItemBadgeStyle(item.status)}`}>
                  {item.status}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!nextItemStatus || !onUpdateItemStatus}
                  onClick={() => {
                    if (nextItemStatus && onUpdateItemStatus) {
                      onUpdateItemStatus(item.id, nextItemStatus);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide transition flex-shrink-0 ${getItemBadgeStyle(item.status)} ${
                    nextItemStatus ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  title={nextItemStatus ? `→ Promote to ${nextItemStatus}` : 'Final state'}
                >
                  {item.status}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Food Progress Bar ── */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
          <span>Food Progress</span>
          <span>{servedCount}/{totalItems} served</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Bill Breakdown ── */}
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

      {/* ── Payment Method ── */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-2">
        <span>Via: <span className="font-bold text-slate-500">{order.paymentMethod.replace('_', ' ')}</span></span>
        {order.tables && order.tables.length > 0 && (
          <span className="font-semibold text-slate-400">
            {order.tables.map((t) => t.floor).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
          </span>
        )}
      </div>

      {/* ── Order-Level Action Button ── */}
      {action && onUpdateStatus && (
        <button
          onClick={() => onUpdateStatus(order.id, action.next)}
          className={`w-full mt-4 py-2.5 px-4 text-white font-bold rounded-xl shadow-md transition duration-200 text-xs ${action.color}`}
        >
          {action.label}
        </button>
      )}

      {order.status === 'PAID' && (
        <div className="w-full mt-4 py-2.5 px-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs text-center border border-emerald-200">
          ✓ Order Completed & Paid
        </div>
      )}
    </div>
  );
}
