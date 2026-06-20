import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChefHat } from 'lucide-react';
import { clearAuthData } from '../hooks/useAuth';

const KitchenEmployeeDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center gap-6 glass p-12 rounded-3xl border border-slate-800">
        <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
          <ChefHat className="w-10 h-10 text-white" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">Kitchen Employee Login Successful</h1>
          <p className="text-slate-400 mt-2 max-w-md">
            You have successfully authenticated as a Kitchen Employee. This module handles Authentication.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700 hover:border-slate-600 shadow-lg"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default KitchenEmployeeDashboard;
