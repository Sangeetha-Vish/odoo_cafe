import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { signup, login } from '../services/authApi';

const SignupForm = ({ onToggleMode, onAuthSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validations
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!role) {
      setError('Role is required.');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(name.trim(), email.trim(), password, role);
      if (data.success) {
        setSuccess(true);
        // Auto-login immediately after successful registration
        setTimeout(async () => {
          try {
            const loginData = await login(email.trim(), password);
            if (loginData.success) {
              onAuthSuccess(loginData.token, loginData.user.role, loginData.user);
            }
          } catch {
            // Auto-login failed — fall back to manual login
            onToggleMode();
          }
        }, 1200);
      }
    } catch (err) {
      console.error('[SignupForm]', err);
      if (err.response?.status === 409) {
        setError('An account with that email already exists. Please switch to Login.');
      } else {
        const raw = err.response?.data?.error;
        const msg =
          typeof raw === 'string'   ? raw :
          typeof raw === 'object' && raw?.message ? raw.message :
          err.message || 'Signup failed. Please try again.';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div className="text-center md:text-left mb-2">
        <h2 className="text-2xl font-black text-white">Create Account</h2>
        <p className="text-xs text-slate-400 mt-1">Register a new POS terminal operator role.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-450 shrink-0" />
          <span>User created successfully! Redirecting to login...</span>
        </div>
      )}

      {/* Name Input */}
      <div>
        <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Full Name
        </label>
        <div className="relative">
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-750 focus:outline-none focus:border-blue-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
          />
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <div className="relative">
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. john@gmail.com"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-750 focus:outline-none focus:border-blue-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
          />
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Password (min. 6 chars)
        </label>
        <div className="relative">
          <input
            id="signup-password"
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

      {/* Role Selection */}
      <div>
        <label htmlFor="signup-role" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Account Role
        </label>
        <select
          id="signup-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-750 focus:outline-none focus:border-blue-500 text-sm text-slate-100 transition-colors cursor-pointer"
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
          <option value="CUSTOMER">Customer</option>
          <option value="KITCHEN_EMPLOYEE">Kitchen Employee</option>
        </select>
      </div>

      {/* Signup Button */}
      <button
        type="submit"
        disabled={loading || success}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-blue-500/10"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Register Account'
        )}
      </button>

      {/* Toggle Sign In */}
      <div className="text-center text-xs mt-2">
        <span className="text-slate-400">Already have an account? </span>
        <button
          type="button"
          onClick={onToggleMode}
          className="font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
        >
          Login
        </button>
      </div>
    </form>
  );
};

export default SignupForm;
