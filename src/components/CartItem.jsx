import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartItem({ item, onUpdateQty, onRemove, disabled }) {
  const { product, quantity } = item;
  const lineSubtotal = product.price * quantity;
  
  // Product level discount calculation
  // Check if item.discount (percentage, e.g. 30) or item.discountAmt exists
  const discountPercent = item.discount || product.discount || 0;
  const lineDiscount = discountPercent > 0 ? (lineSubtotal * discountPercent) / 100 : 0;
  const finalLineTotal = lineSubtotal - lineDiscount;

  if (disabled) {
    return (
      <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="font-bold text-slate-800 truncate text-sm">{product.name}</h4>
            <span className="text-xs text-slate-400 font-semibold block">
              ₹{product.price.toFixed(2)} each
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
              Qty: {quantity}
            </span>
            <div className="text-right min-w-[70px]">
              <span className="text-sm font-extrabold text-slate-900 block">
                ₹{finalLineTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Product-level discount strip */}
        {discountPercent > 0 && (
          <div className="mt-2.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[10px] font-bold text-amber-700 uppercase tracking-wider flex justify-between">
            <span>{discountPercent}% off on item</span>
            <span>-₹{lineDiscount.toFixed(2)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-bold text-slate-800 truncate text-sm">{product.name}</h4>
          <span className="text-xs text-slate-400 font-semibold block">
            ₹{product.price.toFixed(2)} each
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => onUpdateQty(product.id, quantity - 1)}
              className="p-1 hover:bg-slate-100 text-slate-500 rounded-lg transition"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 text-sm font-bold text-slate-800 min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQty(product.id, quantity + 1)}
              className="p-1 hover:bg-slate-100 text-slate-500 rounded-lg transition"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Pricing Subtotal */}
          <div className="text-right min-w-[70px]">
            <span className="text-sm font-extrabold text-slate-900 block">
              ₹{finalLineTotal.toFixed(2)}
            </span>
          </div>

          {/* Delete button */}
          <button
            onClick={() => onRemove(product.id)}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-200"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Product-level discount strip */}
      {discountPercent > 0 && (
        <div className="mt-2.5 px-2.5 py-1 bg-amber-50 border border-amber-250 rounded-lg text-[10px] font-bold text-amber-700 uppercase tracking-wider flex justify-between">
          <span>{discountPercent}% off on item</span>
          <span>-₹{lineDiscount.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
