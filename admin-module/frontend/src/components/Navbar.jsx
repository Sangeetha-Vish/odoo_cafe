import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Printer, Ban, ExternalLink, Menu, User, Coffee, X } from 'lucide-react';
import ActiveUsers from './ActiveUsers';

const PAGE_TITLES = {
  '/products': 'Products',
  '/categories': 'Categories',
  '/coupons': 'Coupons & Promotions',
  '/floors': 'Floors (Booking)',
  '/tables': 'Tables (Booking)',
  '/payment-methods': 'Payment Methods',
  '/users': 'User/Employee',
  '/reports': 'Reports',
  '/kds': 'KDS',
};

let socketSingleton;
function getSocket() {
  if (!socketSingleton) {
    socketSingleton = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: true,
    });
  }
  return socketSingleton;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  const menuItems = [
    { label: 'Products', path: '/products' },
    { label: 'Category', path: '/categories' },
    { label: 'Payment Method', path: '/payment-methods' },
    { label: 'Coupon & Promotion', path: '/coupons' },
    { label: 'Booking', path: '/tables' },
    { label: 'User/Employee', path: '/users' },
    { label: 'Reports', path: '/reports' },
    { label: 'KDS', path: '/kds' },
  ];

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md hover:rotate-12 transition-transform duration-300">
            <Coffee className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Odoo Cafe Console</p>
          </div>
        </div>

        {/* Right: Quick actions + ActiveUsers Presence + Profile + Hamburger */}
        <div className="flex items-center gap-5">
          {/* Action icons */}
          <div className="hidden sm:flex items-center gap-3.5 text-slate-400">
            <button 
              title="Print Screen"
              onClick={() => window.print()}
              className="hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button 
              title="Cancel Active Operation"
              onClick={() => navigate('/products')}
              className="hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition"
            >
              <Ban className="h-5 w-5" />
            </button>
            <a 
              href="http://localhost:5173" 
              target="_blank" 
              rel="noreferrer"
              title="Open Terminal in New Window"
              className="hover:text-indigo-600 p-1.5 hover:bg-indigo-50/50 rounded-lg transition"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Active Presence Users Stack */}
          <div className="hidden md:block">
            <ActiveUsers />
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* Profile indicator */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 shadow-inner">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] font-semibold text-emerald-600 leading-none flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {user?.role || 'Super Admin'}
              </p>
            </div>
          </div>

          {/* Hamburger menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition shadow-sm border border-slate-200"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Hamburger Sidebar Overlay Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-slide-left z-10 border-l border-slate-100">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Coffee className="h-6 w-6 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-base">Odoo Navigation</span>
                </div>
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Menu list */}
              <nav className="mt-6 space-y-2.5">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition ${
                      location.pathname === item.path
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-300 font-normal">➔</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Logout button in drawer */}
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { getSocket };
