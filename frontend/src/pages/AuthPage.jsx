import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import { Terminal } from 'lucide-react';
import { storeAuthData, getRoleRedirectPath } from '../hooks/useAuth';

const AuthPage = () => {
  const navigate = useNavigate();
  // 'login' or 'signup' determines which card is shown on mobile.
  // On desktop (lg+) both are displayed side-by-side.
  const [activeMobileCard, setActiveMobileCard] = useState('login');

  /**
   * Called by LoginForm or SignupForm on successful auth.
   * Stores all auth data then redirects based on the user's role.
   */
  const handleAuthSuccess = (token, role, user) => {
    storeAuthData(token, user); // stores: token, role, userId, user JSON
    navigate(getRoleRedirectPath(role));
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 md:p-8 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="flex items-center gap-3 mb-8 z-10">
        <div className="bg-blue-600 rounded-2xl p-3 shadow-xl shadow-blue-500/20">
          <Terminal className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl tracking-tight text-white leading-none">
            Odoo <span className="text-blue-500">POS</span>
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mt-1">
            Restaurant Management System
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 z-10 items-stretch">

        {/* LEFT CARD: LOGIN FORM */}
        <div
          className={`glass p-6 md:p-10 rounded-3xl border border-slate-750 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
            activeMobileCard === 'login' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <LoginForm
            onToggleMode={() => setActiveMobileCard('signup')}
            onAuthSuccess={handleAuthSuccess}
          />
        </div>

        {/* RIGHT CARD: SIGNUP FORM */}
        <div
          className={`glass p-6 md:p-10 rounded-3xl border border-slate-750 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
            activeMobileCard === 'signup' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <SignupForm
            onToggleMode={() => setActiveMobileCard('login')}
            onAuthSuccess={handleAuthSuccess}
          />
        </div>

      </div>

      {/* Footer */}
      <p className="text-[10px] text-slate-600 mt-12 text-center uppercase tracking-widest font-semibold">
        Protected by Odoo Security Protocol &bull; Version 18.0
      </p>
    </div>
  );
};

export default AuthPage;
