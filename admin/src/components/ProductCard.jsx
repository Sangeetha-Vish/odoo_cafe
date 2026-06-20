import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
  const categoryColor = product.category?.color || '#cbd5e1';

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Category Accent Strip */}
      <div className="h-2 w-full" style={{ backgroundColor: categoryColor }} />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {product.category?.name || 'Uncategorized'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Tax: {product.tax}%</span>
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
            {product.description}
          </p>
        </div>

        <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-50">
          <span className="text-lg font-extrabold text-slate-900">
            ₹{product.price.toFixed(2)}
          </span>
          <button
            onClick={() => onAdd(product)}
            className="p-2 bg-slate-50 hover:bg-amber-500 text-slate-700 hover:text-white rounded-xl transition duration-200 shadow-sm border border-slate-100 hover:border-transparent flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
