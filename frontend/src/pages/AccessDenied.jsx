import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { getRole, clearAuthData, getRoleRedirectPath } from '../hooks/useAuth';

const AccessDenied = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  const handleReturn = () => {
    if (role) {
      navigate(getRoleRedirectPath(role));
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950">
      <div className="glass max-w-md w-full p-8 rounded-3xl border border-red-500/20 shadow-2xl text-center flex flex-col items-center gap-6">

        {/* Warning Icon */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-full p-4">
          <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Access Denied</h1>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            You do not have the required role privileges to access this system resource.
          </p>
          {role && (
            <p className="text-slate-500 text-[11px] mt-2">
              Your role: <span className="text-blue-400 font-bold">{role}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            id="access-denied-return-btn"
            onClick={handleReturn}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98] text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Dashboard
          </button>

          <button
            id="access-denied-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 glass text-slate-400 hover:text-red-400 font-bold py-3 rounded-xl transition-all border-slate-700/50 hover:bg-slate-800 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout Account
          </button>
        </div>

      </div>
    </div>
  );
};

export default AccessDenied;
