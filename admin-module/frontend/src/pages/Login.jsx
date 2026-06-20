import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, MoreVertical, Coffee, Settings, Monitor, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const { login, error, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // View states: 'LOGIN', 'SIGNUP', 'SESSION_CARD'
  const [viewMode, setViewMode] = useState('LOGIN');
  
  // Login/Signup form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Session card options dropdown
  const [optionsOpen, setOptionsOpen] = useState(false);

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLocalError('');
    const success = await login(email.trim(), password);
    if (success) {
      // Transition to Session Card instead of direct dashboard redirect
      setViewMode('SESSION_CARD');
    }
  }

  function handleSignupSubmit(e) {
    e.preventDefault();
    setLocalError('');
    if (!name.trim() || !email.trim() || !password) {
      setLocalError('All fields are required');
      return;
    }
    // Simulate successful signup locally
    setSignupSuccess(true);
    setTimeout(() => {
      setSignupSuccess(false);
      setViewMode('LOGIN');
    }, 1500);
  }

  function handleOpenSession() {
    navigate('/products', { replace: true });
  }

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-slate-900 px-12 py-10 text-white lg:flex overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#312e81,transparent)] opacity-40" />
        
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-mono text-lg font-extrabold shadow-lg">
            <Coffee className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="text-sm font-black uppercase tracking-wider text-slate-200">Odoo Cafe System</span>
        </div>

        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-indigo-400 font-bold">Admin Module</p>
          <h1 className="mt-3 max-w-lg text-4xl font-black leading-tight tracking-tight text-white">
            Warm Cafe Seating & <br />Product Management.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-slate-400 leading-relaxed font-medium">
            Manage your cafe catalogs, active floor plans, automated coupon promotions, and settle bills in real time.
          </p>
        </div>

        <p className="relative z-10 text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Enterprise Control Console
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-3xl p-8 transition-all duration-300">
          
          {/* LOGIN VIEW */}
          {viewMode === 'LOGIN' && (
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <LogIn className="text-indigo-600" size={24} />
                <span>Admin Login</span>
              </h2>
              <p className="mt-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">Access the Odoo Cafe Console</p>

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5" htmlFor="email">
                    Email / Username
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700 pr-12"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {(error || localError) && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                    {error || localError}
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold text-sm rounded-xl shadow-lg transition duration-200">
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>

                <div className="mt-5 text-center text-xs text-slate-400 font-semibold">
                  New to Odoo Cafe?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('SIGNUP');
                      setLocalError('');
                    }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Sign Up here
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SIGNUP VIEW */}
          {viewMode === 'SIGNUP' && (
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <UserPlus className="text-indigo-600" size={24} />
                <span>Create Admin Account</span>
              </h2>
              <p className="mt-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">Register a new manager profile</p>

              {signupSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                  Account created successfully! Redirecting to login...
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5" htmlFor="su-name">
                    Full Name
                  </label>
                  <input
                    id="su-name"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5" htmlFor="su-email">
                    Email / Username
                  </label>
                  <input
                    id="su-email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5" htmlFor="su-password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="su-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700 pr-12"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {localError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                    {localError}
                  </div>
                )}

                <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition duration-200">
                  Sign Up
                </button>

                <div className="mt-5 text-center text-xs text-slate-400 font-semibold">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('LOGIN');
                      setLocalError('');
                    }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Login
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SESSION CARD VIEW */}
          {viewMode === 'SESSION_CARD' && (
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Odoo Cafe</h2>
                </div>
                
                {/* 3-dot Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setOptionsOpen(!optionsOpen)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {optionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden">
                      <button
                        onClick={() => {
                          setOptionsOpen(false);
                          alert('Settings Menu Open (Self-Ordering, Mobile configuration)');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                      >
                        <Settings size={14} />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setOptionsOpen(false);
                          navigate('/customer-display');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                      >
                        <Monitor size={14} />
                        <span>Customer Display</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="mt-1 text-xs text-slate-400 font-bold uppercase tracking-wider">POS POS terminal launcher</p>
              
              <div className="my-6 bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2 text-xs font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>Last open:</span>
                  <span className="text-slate-700">{currentDateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Sell:</span>
                  <span className="text-slate-900 font-bold">₹12,450.00</span>
                </div>
              </div>

              <button 
                onClick={handleOpenSession}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2"
              >
                Open Session
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
