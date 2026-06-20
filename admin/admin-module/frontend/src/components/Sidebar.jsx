import React from 'react';
import { NavLink } from 'react-router-dom';
import { classNames } from '../utils/helpers';

const NAV_ITEMS = [
  { to: '/products', label: 'Products', icon: ProductIcon },
  { to: '/categories', label: 'Categories', icon: CategoryIcon },
  { to: '/coupons', label: 'Coupons', icon: CouponIcon },
  { to: '/floors', label: 'Floors', icon: FloorIcon },
  { to: '/tables', label: 'Tables', icon: TableIcon },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-ink text-slate-300">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-mono text-sm font-bold text-white">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Admin Console</p>
          <p className="text-xs text-slate-400">Catalog management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-accent text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-slate-500">Hackathon Admin Module</p>
      </div>
    </aside>
  );
}

function ProductIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </svg>
  );
}

function CouponIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 10a2 2 0 002-2V6a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2a2 2 0 000-4z" />
      <path d="M9 4v16" strokeDasharray="2 2" />
    </svg>
  );
}

function FloorIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 9.5L12 4l9 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 14.5L12 9l9 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TableIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <ellipse cx="12" cy="7" rx="8" ry="3" />
      <path d="M4 7v3c0 1.66 3.58 3 8 3s8-1.34 8-3V7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v7M9 20h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
