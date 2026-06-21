import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@shared-auth/supabaseClient.js';
import { Coffee, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';

export default function SelfOrderEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tableNumber, setTableNumber] = useState('');
  const [availableTables, setAvailableTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from URL param if present (e.g., ?table=2 or ?table_number=2)
  useEffect(() => {
    const queryTable = searchParams.get('table') || searchParams.get('table_number');
    if (queryTable) {
      setTableNumber(queryTable);
      handleAutoEntry(queryTable);
    }
    fetchTables();
  }, [searchParams]);

  async function fetchTables() {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('id, table_number, status')
        .eq('status', 'FREE')
        .order('table_number', { ascending: true });
      if (!error && data) {
        setAvailableTables(data);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  }

  async function handleAutoEntry(number) {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchErr } = await supabase
        .from('tables')
        .select('*')
        .eq('table_number', number)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (!data) {
        setError(`Table "${number}" not found. Please double-check.`);
        setLoading(false);
        return;
      }

      if (data.status !== 'FREE') {
        setError(`Table "${number}" is currently occupied. Please choose a free table.`);
        setLoading(false);
        return;
      }

      // Store in localStorage
      localStorage.setItem('self_order_table', JSON.stringify(data));
      navigate('/self-order/menu');
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Please enter a Table ID or select a table.');
      return;
    }
    handleAutoEntry(tableNumber.trim());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9EB] to-[#FFF1D6] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-3xl border border-amber-100 p-8 shadow-2xl transition duration-300 hover:shadow-amber-100/50">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl text-slate-900 shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
            <Coffee size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Odoo Café</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Self-Ordering Customer Portal</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="table-input" className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              Enter Table ID
            </label>
            <input
              id="table-input"
              type="text"
              required
              placeholder="e.g. 5"
              className="w-full text-center text-lg font-bold rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-amber-400 transition bg-white text-slate-900 shadow-inner"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] py-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Verifying table...' : 'Start Ordering'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Simulator Selection */}
        {availableTables.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <span className="block text-center text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">
              QR Simulator (Choose a Table)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {availableTables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTableNumber(t.table_number);
                    handleAutoEntry(t.table_number);
                  }}
                  className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition cursor-pointer"
                >
                  T-{t.table_number}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <HelpCircle size={14} />
          <span>Table ID is printed on the QR standee.</span>
        </div>
      </div>
    </div>
  );
}
