import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, QrCode, Download, Globe, Image, Settings, Sparkles, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const MOCK_BG_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60'
];

export default function SelfOrderingSettings() {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('self_order_enabled') === 'true';
  });
  
  const [subMode, setSubMode] = useState(() => {
    return localStorage.getItem('self_order_mode') || 'ONLINE'; // 'ONLINE' or 'QR_MENU'
  });

  const [bgType, setBgType] = useState(() => {
    return localStorage.getItem('self_order_bg_type') || 'COLOR'; // 'COLOR' or 'IMAGES'
  });

  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem('self_order_bg_color') || '#FDF8F2';
  });

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('self_order_enabled', enabled ? 'true' : 'false');
    localStorage.setItem('self_order_mode', subMode);
    localStorage.setItem('self_order_bg_type', bgType);
    localStorage.setItem('self_order_bg_color', bgColor);
  }, [enabled, subMode, bgType, bgColor]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/tables');
        const list = res.data || [];
        // Map deterministic tokens: T + id
        const mapped = list.map((t) => {
          const token = `T${t.id}`;
          return { ...t, token };
        });
        setTables(mapped);
      } catch (err) {
        console.error('Failed to load tables', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  function triggerDownloadPDF() {
    alert('Simulating Token QR Code Grid Download! PDF successfully compiled with Table tokens.');
  }

  return (
    <div className="space-y-6">
      {/* Master Toggle Banner */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-2xl">
            <Settings size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Self-Ordering configuration</h2>
            <p className="text-xs text-slate-450 font-semibold mt-0.5">Allow guests to order from their tables via QR codes</p>
          </div>
        </div>

        <button onClick={() => setEnabled(!enabled)} className="text-slate-400 hover:text-slate-600 transition">
          {enabled ? (
            <ToggleRight size={44} className="text-indigo-600" />
          ) : (
            <ToggleLeft size={44} className="text-slate-300" />
          )}
        </button>
      </div>

      {/* Settings Panel (only visible if master toggle is on) */}
      {enabled && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-up">
          {/* Configuration Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
              Flow Customization
            </h3>

            {/* Sub-modes selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase">Ordering Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'ONLINE', label: 'Online Ordering', desc: 'Browse and check out' },
                  { id: 'QR_MENU', label: 'QR Menu Only', desc: 'Digital menu catalog only' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSubMode(mode.id)}
                    className={`p-4 border-2 rounded-2xl text-left transition ${
                      subMode === mode.id
                        ? 'border-indigo-650 bg-indigo-50/40 text-indigo-700 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold block">{mode.label}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background customizer */}
            <div className="space-y-3 pt-3 border-t border-slate-50">
              <label className="block text-xs font-bold text-slate-500 uppercase">Splash Background</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBgType('COLOR')}
                  className={`p-3 border-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    bgType === 'COLOR' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-slate-100 text-slate-600'
                  }`}
                >
                  <Globe size={14} />
                  <span>Solid Color</span>
                </button>
                <button
                  onClick={() => setBgType('IMAGES')}
                  className={`p-3 border-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    bgType === 'IMAGES' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-slate-100 text-slate-600'
                  }`}
                >
                  <Image size={14} />
                  <span>Scrolling Images</span>
                </button>
              </div>

              {bgType === 'COLOR' ? (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-16 border border-slate-200 rounded cursor-pointer bg-white p-1"
                  />
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase">{bgColor}</span>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 overflow-x-auto">
                  {MOCK_BG_IMAGES.map((img, i) => (
                    <img key={i} src={img} className="h-16 w-24 object-cover rounded-xl border border-slate-100" alt="mock bg" />
                  ))}
                </div>
              )}
            </div>

            {/* Read-only Payment warning */}
            {subMode === 'ONLINE' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-500 mt-0.5" />
                <div>
                  <p className="font-bold">Payment Method: Counter Settlement</p>
                  <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                    Self-ordering is restricted to "Pay at Counter". Online transaction gateways are disabled.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* QR Generator & Table Token list (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Table QR Codes
              </h3>
              <button
                onClick={triggerDownloadPDF}
                className="btn-primary py-2 px-3 flex items-center gap-1.5 font-bold text-xs shadow-sm"
              >
                <Download size={14} />
                <span>PDF Grid</span>
              </button>
            </div>

            {/* List of active tables with QR URL representation */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {tables.map((table) => {
                const targetUrl = `${window.location.origin}/s/${table.token}`;
                return (
                  <div key={table.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase">Table {table.tableNumber}</h4>
                      <p className="text-[9.5px] text-slate-400 font-mono select-all overflow-hidden truncate max-w-[180px]">
                        /s/{table.token}
                      </p>
                    </div>
                    
                    <a
                      href={`/s/${table.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-650 transition flex items-center gap-1 font-bold text-[10px]"
                    >
                      <QrCode size={13} />
                      <span>Scan View</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
