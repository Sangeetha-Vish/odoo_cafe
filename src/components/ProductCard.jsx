import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd, disabled }) {
  const categoryColor = product.category?.color || '#cbd5e1';
  // Availability stock status check (defaults to true if stock is not explicitly 0)
  const isAvailable = product.stock !== 0 && product.available !== false;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Category Accent Strip */}
      <div className="h-2 w-full" style={{ backgroundColor: categoryColor }} />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {product.category?.name || 'Uncategorized'}
            </span>
            {/* Live stock indicator dot */}
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              <span>{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
            </span>
          </div>

          <h3 className="text-base font-extrabold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
            {product.description}
          </p>
        </div>

        <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-50">
          <span className="text-lg font-black text-slate-900">
            ₹{product.price.toFixed(2)}
          </span>
          <button
            onClick={() => !disabled && isAvailable && onAdd && onAdd(product)}
            disabled={disabled || !isAvailable}
            className={`p-2 rounded-xl transition duration-200 shadow-sm border ${
              disabled || !isAvailable
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-slate-50 hover:bg-amber-500 text-slate-700 hover:text-white border-slate-100 hover:border-transparent'
            } flex items-center justify-center`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
