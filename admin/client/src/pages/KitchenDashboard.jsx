import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const API_BASE = '/api';
const SOCKET_BASE = ''; // empty = connect to current origin; Vite proxy forwards /socket.io → backend

export default function PremiumKitchenDashboard() {
  // 📥 Centralized Memory Data Cache
  const [allCachedOrders, setAllCachedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('TO_COOK'); // TO_COOK, PREPARING, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [socketConnected, setSocketConnected] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  // 🔄 Fetch all active orders into local memory and normalize keys
  const fetchOrdersSync = async () => {
    try {
      const res = await axios.get(`${API_BASE}/kitchen/orders?status=${activeTab}`);
      
      // Normalize data structure across mixed backend schemas
      const normalized = res.data.map(order => ({
        ...order,
        items: order.orderItems || order.order_items || order.OrderItems || order.items || []
      }));

      // Enforce strict FIFO prioritization rules
      const fifoOrdered = normalized.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setAllCachedOrders(fifoOrdered);
    } catch (err) {
      console.error("KDS sync fault connecting to backend server:", err);
    }
  };

  useEffect(() => {
    fetchOrdersSync();
  }, [activeTab]);

  // 🔌 2. Real-time Live Synchronization Layer (Auto-refresh on incoming order events)
  useEffect(() => {
    const socket = io(SOCKET_BASE);
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('order-created', () => { fetchOrdersSync(); });
    socket.on('order-status-updated', () => { fetchOrdersSync(); });
    socket.on('item-status-toggled', () => { fetchOrdersSync(); });

    return () => { socket.disconnect(); };
  }, [activeTab]);

  // 📊 Top Row Pending Summary Bar Aggregator
  const macroSummary = useMemo(() => {
    const counts = {};
    allCachedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!item.completed) {
          const name = item.product?.name || "Café Item";
          counts[name] = (counts[name] || 0) + item.quantity;
        }
      });
    });
    return Object.entries(counts).map(([name, qty]) => ({ name, qty }));
  }, [allCachedOrders]);

  // ⚡ Global Macro Strike Action Engine (One-Click Multi-Update Feature)
  const handleMacroStrikeClick = async (productName) => {
    // 🚀 Instant Local State UI Patch (0ms Latency)
    const updatedOrders = allCachedOrders.map(order => {
      let allItemsDone = true;

      const updatedItems = order.items.map(item => {
        if (item.product?.name === productName) {
          return { ...item, completed: true };
        }
        if (!item.completed) allItemsDone = false;
        return item;
      });

      return {
        ...order,
        items: updatedItems
      };
    });

    setAllCachedOrders(updatedOrders);

    // 📡 Send database updates asynchronously in the background to Supabase
    allCachedOrders.forEach(order => {
      order.items.forEach(async (item) => {
        if (item.product?.name === productName && !item.completed) {
          try {
            await axios.patch(`${API_BASE}/items/${item.id}/toggle`, { currentStatus: false });
          } catch (err) {
            console.error("Background DB sync failed for item:", item.id, err);
          }
        }
      });
    });
  };

  // 🔍 High-Speed Local Filter Processing
  const filteredOrders = useMemo(() => {
    return allCachedOrders.filter(order => {
      const matchesSearch = order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || order.id.toString().includes(searchQuery);
      const matchesProduct = selectedProductFilter === 'ALL' || order.items.some(item => item.product?.name === selectedProductFilter);
      const matchesCategory = selectedCategoryFilter === 'ALL' || order.items.some(item => item.product?.category_id === parseInt(selectedCategoryFilter));
      return matchesSearch && matchesProduct && matchesCategory;
    });
  }, [allCachedOrders, searchQuery, selectedProductFilter, selectedCategoryFilter]);

  // Extract items for side panel filters
  const uniqueProductsForFilter = useMemo(() => {
    const products = new Set();
    allCachedOrders.forEach(o => {
      o.items.forEach(i => products.add(i.product?.name));
    });
    return ['ALL', ...Array.from(products).filter(Boolean)];
  }, [allCachedOrders]);

  const handleClearFilters = () => {
    setSelectedProductFilter('ALL');
    setSelectedCategoryFilter('ALL');
    setSearchQuery('');
  };

  // 📝 6. Local Checklist Toggle Action
  const handleToggleItemStrike = async (order, itemId, currentCompleted) => {
    // 🚀 Instant UI Update (0ms)
    setAllCachedOrders(prev => prev.map(o => {
      if (o.id !== order.id) return o;
      const updatedItems = o.items.map(i => i.id === itemId ? { ...i, completed: !currentCompleted } : i);
      let finalStatus = o.status;
      if (o.status === 'PREPARING' && !currentCompleted) {
        const hasUnfinished = updatedItems.some(i => !i.completed);
        if (!hasUnfinished) finalStatus = 'COMPLETED';
      }
      return { ...o, status: finalStatus, items: updatedItems };
    }));

    // 📡 Background Database Update
    try {
      await axios.patch(`${API_BASE}/items/${itemId}/toggle`, { currentStatus: currentCompleted });
      if (order.status === 'PREPARING' && !currentCompleted) {
        const remainingItems = order.items.filter(i => i.id !== itemId && !i.completed);
        if (remainingItems.length === 0) {
          await axios.patch(`${API_BASE}/orders/${order.id}/status`, { status: 'COMPLETED' });
        }
      }
    } catch (err) {
      console.error("Failed to sync item status change to Supabase:", err);
    }
  };

  // 🚀 Change Order Stage (To Cook -> Preparing)
  const handleMoveOrderStage = async (orderId, currentStatus) => {
    const nextStatusMap = { 'TO_COOK': 'PREPARING', 'PREPARING': 'COMPLETED' };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    // 🚀 Instant local UI shift
    setAllCachedOrders(prev => prev.filter(o => o.id !== orderId));

    // 📡 Background DB sync
    try {
      await axios.patch(`${API_BASE}/orders/${orderId}/status`, { status: nextStatus });
    } catch (err) {
      fetchOrdersSync(); // Rollback on error
      setErrorModal({ isOpen: true, message: err.response?.data?.error || err.response?.data?.message || err.message || "State progression rejected by backend server verification rules." });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col">
      {/* ── Error Modal Overlay ── */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in border border-stone-100 text-center">
            <h3 className="text-xl font-bold text-rose-600 mb-2">Action Rejected</h3>
            <p className="text-stone-600 text-sm mb-6">{errorModal.message}</p>
            <button onClick={() => setErrorModal({ isOpen: false, message: '' })} className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Upper Navigation Header Bar */}
      <header className="p-4 md:p-6 border-b border-stone-200/60 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Kitchen Workspace</h1>
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>
          <p className="text-stone-500 text-xs">Real-time Live FIFO Stream Cache Dashboard • Supabase Integrated</p>
        </div>
        <input 
          type="text"
          placeholder="Filter by Order # or Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 bg-[#FDFBF7] border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 shadow-sm"
        />
      </header>

      {/* 🌟 Top Row Pending Summary Bar */}
      <div className="bg-white border-b border-stone-200 px-6 py-3 min-h-[52px] flex items-center overflow-x-auto gap-3 select-none">
        <span className="text-xs font-extrabold tracking-wider text-stone-400 mr-2 whitespace-nowrap">PREP SUMMARY (CLICK TO COMPETE):</span>
        {macroSummary.length === 0 ? (
          <span className="text-xs text-stone-400 italic">No items pending in this queue.</span>
        ) : (
          <div className="flex gap-2">
            {macroSummary.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleMacroStrikeClick(item.name)}
                className="bg-stone-900 text-[#FDFBF7] hover:bg-emerald-700 active:scale-95 transition-all px-3 py-1 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-sm group cursor-pointer"
                title={`Click to mark all ${item.name} as complete across all tickets`}
              >
                <span className="text-amber-400 group-hover:text-white font-mono">{item.qty}x</span>
                <span>{item.name}</span>
                <span className="text-[10px] text-stone-400 group-hover:text-emerald-200 border border-stone-700 group-hover:border-emerald-500 px-1 rounded">✓ Done</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Wrapper */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar Filters Component Panel */}
        <aside className="w-full lg:w-64 bg-white border-r border-stone-200 p-4 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-widest font-bold text-stone-400">Sidebar Filters</h2>
            <button onClick={handleClearFilters} className="text-xs text-rose-600 font-semibold hover:underline">Clear All</button>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 block mb-2">Order Stage</label>
            <div className="flex flex-col gap-1.5">
              {['TO_COOK', 'PREPARING', 'COMPLETED'].map((status) => (
                <button
                  key={status}
                  onClick={() => { setActiveTab(status); handleClearFilters(); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex justify-between items-center ${
                    activeTab === status ? 'bg-stone-900 text-[#FDFBF7]' : 'hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  <span>{status.replace('_', ' ')}</span>
                  <span className="font-mono text-[10px] bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">{status === activeTab ? filteredOrders.length : '•'}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 block mb-2">Filter by Item</label>
            <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1">
              {uniqueProductsForFilter.map((prodName) => (
                <button
                  key={prodName}
                  onClick={() => setSelectedProductFilter(prodName)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs truncate transition-all ${
                    selectedProductFilter === prodName ? 'bg-stone-200 font-bold text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {prodName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 block mb-2">Filter by Category</label>
            <div className="flex flex-col gap-1">
              {[
                { name: 'All Categories', id: 'ALL' },
                { name: 'Desserts & Sweets', id: '1' },
                { name: 'Quick Bites', id: '2' },
                { name: 'Drinks & Beverages', id: '3' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-all ${
                    selectedCategoryFilter === cat.id ? 'bg-stone-200 font-bold text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Live Active Ticket Columns Grid Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-stone-200 rounded-2xl bg-white/50">
              <p className="text-stone-400 font-medium text-sm">No items match the current kitchen filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {filteredOrders.map((order, index) => {
                return (
                  <div key={order.id} className="bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden group">
                    <div>
                      <div className={`p-4 border-b border-stone-100 flex justify-between items-start ${
                        order.status === 'TO_COOK' ? 'bg-amber-50/40' : order.status === 'PREPARING' ? 'bg-orange-50/30' : 'bg-emerald-50/20'
                      }`}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Table {order.table_id || "N/A"}</span>
                            {index === 0 && (
                              <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded uppercase">FIFO NEXT</span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-stone-900 mt-0.5">Order #{order.id}</h3>
                        </div>
                        <span className="text-xs font-semibold bg-stone-100 border border-stone-200 px-2 rounded-md text-stone-700">{order.customer_name || "Guest"}</span>
                      </div>

                      <div className="p-4 divide-y divide-stone-100 max-h-[240px] overflow-y-auto">
                        {order.items.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => order.status === 'PREPARING' && handleToggleItemStrike(order, item.id, item.completed)}
                            className={`py-2.5 flex items-center justify-between select-none ${order.status === 'PREPARING' ? 'cursor-pointer' : 'pointer-events-none'}`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${item.completed ? 'bg-stone-100 text-stone-400' : 'bg-stone-900 text-[#FDFBF7]'}`}>
                                {item.quantity}x
                              </span>
                              <span className={`text-xs font-medium truncate ${item.completed ? 'line-through text-stone-400 italic' : 'text-stone-800'}`}>
                                {item.product?.name || "Café Item"}
                              </span>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'}`}>
                              {item.completed && <span className="text-white text-[9px] font-bold">✓</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50/50 border-t border-stone-100">
                      {order.status === 'TO_COOK' ? (
                        <button onClick={() => handleMoveOrderStage(order.id, order.status)} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all">
                          Accept & Start Cooking 👨‍🍳
                        </button>
                      ) : order.status === 'PREPARING' ? (
                        <div className="text-center py-1.5 text-stone-400 text-[11px] font-semibold bg-stone-100 rounded-xl border border-stone-200/50">
                          Check off items to complete ticket
                        </div>
                      ) : (
                        <div className="text-center py-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                          ✓ Ready at Pickup Counter
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
