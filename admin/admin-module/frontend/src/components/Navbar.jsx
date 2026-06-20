import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/products': 'Products',
  '/categories': 'Categories',
  '/coupons': 'Coupons',
  '/floors': 'Floors',
  '/tables': 'Tables',
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
  const [isConnected, setIsConnected] = useState(false);

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

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}
          />
          {isConnected ? 'Live' : 'Offline'}
        </span>

        <div className="h-6 w-px bg-slate-200" />

        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user?.name || 'Admin'}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>

        <button onClick={logout} className="btn-secondary text-xs">
          Log out
        </button>
      </div>
    </header>
  );
}

export { getSocket };
