import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { login } from '../services/authApi';

const LoginForm = ({ onToggleMode, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      if (data.success) {
        // Store token, user id, name, and role in localStorage
        // Pass to callback which will also store in localStorage
        onAuthSuccess(data.token, data.user.role, data.user);
      } else {
        setError('Login failed. Please check credentials.');
      }
    } catch (err) {
      console.error('[LoginForm]', err);
      const raw = err.response?.data?.error;
      // Guard: error may be a nested object { message, status } from old errorHandler
      const msg =
        typeof raw === 'string'   ? raw :
        typeof raw === 'object' && raw?.message ? raw.message :
        err.message || 'Failed to connect. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div className="text-center md:text-left mb-2">
        <h2 className="text-2xl font-black text-white">Welcome Back</h2>
        <p className="text-xs text-slate-400 mt-1">Access the Odoo Point of Sale environment.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Email Input */}
      <div>
        <label htmlFor="login-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <div className="relative">
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. admin@odoo.com"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-750 focus:outline-none focus:border-blue-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
          />
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="login-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-750 focus:outline-none focus:border-blue-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
          />
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-blue-500/10"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Toggle Sign Up */}
      <div className="text-center text-xs mt-2">
        <span className="text-slate-400">Don't have an account? </span>
        <button
          type="button"
          onClick={onToggleMode}
          className="font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
        >
          Sign Up Here
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
