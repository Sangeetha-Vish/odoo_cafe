import React from 'react';

const USERS = [
  { name: 'Admin User', initials: 'AU', color: 'bg-indigo-500' },
  { name: 'Chef Mario', initials: 'CM', color: 'bg-emerald-500' },
  { name: 'Cashier Sita', initials: 'CS', color: 'bg-amber-500' },
];

export default function ActiveUsers() {
  return (
    <div className="flex -space-x-2 overflow-hidden">
      {USERS.map((u, i) => (
        <div
          key={i}
          title={u.name}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white ${u.color} shadow-sm ring-1 ring-black/5 cursor-default hover:scale-105 transition-transform`}
        >
          {u.initials}
        </div>
      ))}
    </div>
  );
}
