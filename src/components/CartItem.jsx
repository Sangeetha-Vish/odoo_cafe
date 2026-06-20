import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartItem({ item, onUpdateQty, onRemove }) {
  const { product, quantity } = item;
  const lineSubtotal = product.price * quantity;

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl mb-3 shadow-sm hover:shadow-md transition-shadow">
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
            ₹{lineSubtotal.toFixed(2)}
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
  );
}
