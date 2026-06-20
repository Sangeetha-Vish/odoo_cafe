import React from 'react';
import { Users, Armchair } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function TableCard({ table, onSelect }) {
  const isOccupied = table.status === 'OCCUPIED';

  return (
    <div
      onClick={() => onSelect(table)}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl bg-white ${
        isOccupied
          ? 'border-red-650 ring-1 ring-red-650' // Distinct red outline color
          : 'border-slate-100 hover:border-emerald-400'
      }`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-slate-50 transition-all group-hover:scale-150 duration-500 opacity-20" />

      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 text-slate-700">
          <Armchair size={24} />
        </div>
        <StatusBadge status={table.status} />
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-1">{table.tableNumber}</h3>

      <div className="flex items-center text-slate-500 text-sm font-medium">
        <Users size={16} className="mr-1.5 text-slate-400" />
        <span>{table.seats} Seats Capacity</span>
      </div>
    </div>
  );
}
