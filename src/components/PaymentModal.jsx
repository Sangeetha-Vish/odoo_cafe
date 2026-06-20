import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, X, ShieldCheck } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote },
  { id: 'CARD', label: 'Card', icon: CreditCard },
  { id: 'UPI', label: 'UPI', icon: Smartphone },
];

export default function PaymentModal({ order, isOpen, onClose, onConfirm, processing }) {
  const [selectedMethod, setSelectedMethod] = useState(order?.paymentMethod || 'CASH');

  if (!isOpen || !order) return null;

  const tablesLabel =
    order.tables && order.tables.length > 0
      ? order.tables.map((t) => t.tableNumber).join(' + ')
      : 'Takeaway';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cafe Dummy Payment Gateway</p>
            <h3 className="text-xl font-extrabold mt-1">Complete Payment</h3>
            <p className="text-slate-400 text-xs mt-1">Order #{order.id} · {tablesLabel}</p>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-1.5 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Discount</span>
                <span className="font-semibold">−₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span className="font-semibold text-slate-700">₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
              <span>Amount Due</span>
              <span className="text-amber-600">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedMethod(id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition text-xs font-bold ${
                    selectedMethod === id
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center">
            <ShieldCheck size={12} />
            <span>Simulated payment — no real transaction will occur</span>
          </div>

          <button
            onClick={() => onConfirm(selectedMethod)}
            disabled={processing}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition text-sm"
          >
            {processing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
