import React from 'react';
import { ArchiveRestore } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Found',
  description = 'There are no items to display right now.',
  icon: Icon = ArchiveRestore,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white max-w-md mx-auto my-8">
      <div className="p-4 bg-amber-50 rounded-full text-amber-500 mb-4 animate-bounce">
        <Icon size={40} />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-xl shadow-md transition duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
