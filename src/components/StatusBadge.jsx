import React from 'react';

export default function StatusBadge({ status }) {
  const configs = {
    // Table Statuses
    FREE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Free' },
    OCCUPIED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Occupied' },

    // Order Statuses
    DRAFT: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Draft' },
    TO_COOK: { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: 'To Cook' },
    PREPARING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Preparing' },
    COMPLETED: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Ready' },
    PAID: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid' },
  };

  const current = configs[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} shadow-sm uppercase tracking-wider`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {current.label}
    </span>
  );
}
