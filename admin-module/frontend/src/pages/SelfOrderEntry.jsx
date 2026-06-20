import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ArrowRight, Table } from 'lucide-react';
import api from '../api/axios';

export default function SelfOrderEntry() {
  const [tableId, setTableId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch active tables to assist with validation
    const fetchTables = async () => {
      try {
        const res = await api.get('/api/tables');
        setTables(res.data || []);
      } catch (err) {
        console.error('Failed to load tables:', err);
      }
    };
    fetchTables();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableId.trim()) {
      setError('Please enter a Table Number or Table ID.');
      return;
    }

    setLoading(true);
    setError('');

    const cleanInput = tableId.trim().toUpperCase();

    // Try to find the table matching tableNumber or ID
    const matchedTable = tables.find(
      (t) =>
        t.tableNumber.toUpperCase().replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '') ||
        t.id.toString() === cleanInput ||
        `T${t.id}` === cleanInput
    );

    if (matchedTable) {
      // Redirect to the table session
      navigate(`/s/T${matchedTable.id}`);
    } else {
      // If table is not in database, fallback to check if input is a simple number
      const parsedId = parseInt(cleanInput.replace(/[^0-9]/g, ''));
      if (!isNaN(parsedId)) {
        const foundById = tables.find((t) => t.id === parsedId);
        if (foundById) {
          navigate(`/s/T${foundById.id}`);
          return;
        }
      }
      setError('Invalid Table ID or Table Number. Please double-check.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[32px] shadow-2xl flex flex-col items-center text-center relative z-10">
        
        {/* Brand Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/15 mb-6">
          <Coffee size={36} className="animate-pulse" />
        </div>

        {/* Header */}
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">
          Odoo Café
        </h1>
        <p className="text-xs text-slate-450 font-semibold mt-2 max-w-xs uppercase tracking-widest text-amber-500">
          Self-Ordering Portal
        </p>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-sm">
          Welcome! Scan the QR code at your table or enter the Table ID printed on your table card to browse our menu and place your order.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
              <Table size={18} />
            </div>
            <input
              type="text"
              placeholder="e.g. Table 1 or Table ID"
              value={tableId}
              onChange={(e) => {
                setTableId(e.target.value);
                if (error) setError('');
              }}
              className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition duration-200"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl text-left">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/10 transition duration-200 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Entering...' : 'Start Ordering'}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {/* Footer Notes */}
        <div className="mt-8 pt-6 border-t border-white/5 w-full text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          Pay at Counter &middot; UPI QR Available
        </div>
      </div>
    </div>
  );
}
