import React from 'react';
import { NavLink } from 'react-router-dom';
import { classNames } from '../utils/helpers';
import {
  ShoppingBag,
  FolderTree,
  Ticket,
  Layers,
  LayoutGrid,
  CreditCard,
  Users2,
  BarChart3,
  ChefHat,
  Monitor,
  Coffee,
  Settings,
  ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/orders', label: 'Orders Feed', icon: ClipboardList },
  { to: '/products', label: 'Products', icon: ShoppingBag },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/coupons', label: 'Coupons & Promotions', icon: Ticket },
  { to: '/floors', label: 'Floors', icon: Layers },
  { to: '/tables', label: 'Tables', icon: LayoutGrid },
  { to: '/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { to: '/users', label: 'User/Employee', icon: Users2 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/self-ordering', label: 'Self-Ordering Settings', icon: Settings },
  { to: '/kds', label: 'KDS (Kitchen Display)', icon: ChefHat, external: true },
  { to: '/customer-display', label: 'Customer Display', icon: Monitor, external: true },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Sidebar Header Brand block */}
      <div className="flex items-center gap-2.5 border-b border-slate-850 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-mono text-sm font-bold text-white shadow-md">
          <Coffee className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black text-white uppercase tracking-wider leading-none">Odoo Cafe</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Management Hub</p>
        </div>
      </div>

      {/* Main Nav Items list */}
      <nav className="flex-1 space-y-1 px-3.5 py-5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.external) {
            return (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition duration-200"
              >
                <Icon className="h-4.5 w-4.5 shrink-0 text-slate-500" />
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition duration-200',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer brand block */}
      <div className="border-t border-slate-850 px-6 py-4 bg-slate-950/20 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
        <span>Odoo Console</span>
        <span>v1.2.0</span>
      </div>
    </aside>
  );
}
