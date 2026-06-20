import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ArrowRight, QrCode, UtensilsCrossed, AlertCircle } from 'lucide-react';
import api from '../api/axios';

export default function TableEntry() {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get('/tables');
        const list = res.data.data || [];
        // Map table tokens from localStorage
        const mapped = list.map((t) => {
          let token = localStorage.getItem(`table_token_${t.id}`);
          if (!token) {
            token = Math.random().toString(36).substring(2, 10).toUpperCase();
            localStorage.setItem(`table_token_${t.id}`, token);
          }
          return { ...t, token };
        });
        setTables(mapped);
      } catch (err) {
        console.error('Failed to fetch tables', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cleanToken = tokenInput.trim().toUpperCase();

    if (!cleanToken) {
      setError('Please enter a valid Table ID / Token');
      return;
    }

    // Verify if this token matches any table
    const matchedTable = tables.find((t) => t.token === cleanToken || t.table_number.toUpperCase() === cleanToken);

    if (matchedTable) {
      navigate(`/s/${matchedTable.token}`);
    } else {
      // If it doesn't match but we are in demo mode, let them proceed with a generated token or mock table
      // Let's search if they entered a table number like "T-01" or "1"
      const fuzzyMatch = tables.find(
        (t) =>
          t.table_number.toUpperCase().includes(cleanToken) ||
          cleanToken.includes(t.table_number.toUpperCase())
      );
      if (fuzzyMatch) {
        navigate(`/s/${fuzzyMatch.token}`);
      } else {
        setError('Table ID not recognized. Please check the code printed on your table.');
      }
    }
  };

  const handleQuickSelect = (token) => {
    navigate(`/s/${token}`);
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] text-slate-800 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Decorative Warm Blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#f0e3d2] rounded-full filter blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#e9dcc9] rounded-full filter blur-3xl opacity-60 pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-[#b38b6d] text-white p-2.5 rounded-2xl shadow-md">
            <Coffee size={24} />
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-[#5c4033] block">ODOO CAFE</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#a88267]">Table Service</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-12 z-10">
        <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-[32px] p-8 shadow-xl w-full text-center space-y-6">
          
          <div className="inline-flex p-4 bg-[#fbf8f3] rounded-full text-[#b38b6d] border border-[#f0e3d2]">
            <UtensilsCrossed size={36} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[#5c4033] tracking-tight">Order From Your Table</h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
              Enter the Table ID or Token printed on the QR code plaque at your table to view the menu and place your order.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter Table ID (e.g. T-01)"
                className="w-full bg-[#fbf8f3] border-2 border-[#e6dcd0] focus:border-[#b38b6d] px-5 py-4 rounded-2xl text-sm font-black uppercase text-center tracking-widest transition focus:outline-none placeholder:normal-case placeholder:tracking-normal placeholder:font-medium text-slate-800"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs text-left font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-[#b38b6d] hover:bg-[#997355] text-white font-black rounded-2xl text-sm shadow-lg transition flex items-center justify-center gap-2 group"
            >
              <span>View Menu & Order</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </button>
          </form>

          {/* Quick Select for Testing */}
          {!loading && tables.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-[#f0e3d2]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Quick Select Table (Testing/Demo)
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-h-36 overflow-y-auto p-1">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleQuickSelect(t.token)}
                    className="px-3.5 py-2 bg-[#fdfaf6] hover:bg-[#b38b6d] hover:text-white border border-[#e6dcd0] rounded-xl text-xs font-bold text-slate-650 transition shadow-xs"
                  >
                    Table {t.table_number}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="text-xs text-slate-400 animate-pulse py-2">
              Loading active tables...
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-400 font-semibold z-10">
        <p className="flex items-center justify-center gap-1">
          <QrCode size={12} />
          <span>Scan the QR code on your table for instant ordering</span>
        </p>
      </footer>
    </div>
  );
}
