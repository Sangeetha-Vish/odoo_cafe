import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@shared-auth/supabaseClient.js';
import { Coffee, Search, ShoppingBag, Plus, Minus, X, Check, Heart, ChevronRight, MessageSquare } from 'lucide-react';

export default function SelfOrderMenu() {
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Cart: [{ product, quantity, notes }]
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('self_order_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Customization modal
  const [customModalItem, setCustomModalItem] = useState(null);
  const [customNotes, setCustomNotes] = useState('');

  // Initial load
  useEffect(() => {
    const tableData = localStorage.getItem('self_order_table');
    if (!tableData) {
      navigate('/self-order');
      return;
    }
    setTable(JSON.parse(tableData));

    fetchMenu();
  }, [navigate]);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('self_order_cart', JSON.stringify(cart));
  }, [cart]);

  async function fetchMenu() {
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  }

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCatId === 'ALL' || String(p.category_id) === String(selectedCatId);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCatId]);

  // Cart operations
  function addToCart(product, notes = '') {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id && item.notes === notes);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1, notes }];
    });
  }

  function updateQuantity(productId, notes, delta) {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === productId && item.notes === notes);
      if (existingIdx === -1) return prev;

      const updated = [...prev];
      const newQty = updated[existingIdx].quantity + delta;
      
      if (newQty <= 0) {
        updated.splice(existingIdx, 1);
      } else {
        updated[existingIdx].quantity = newQty;
      }
      return updated;
    });
  }

  // Calculate totals
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  function handleOpenCustomization(product) {
    setCustomModalItem(product);
    setCustomNotes('');
  }

  function handleConfirmCustomization() {
    if (customModalItem) {
      addToCart(customModalItem, customNotes);
      setCustomModalItem(null);
      setCustomNotes('');
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9EB] text-slate-800 flex flex-col font-sans pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-amber-100/60 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl text-slate-900 shadow-md">
            <Coffee size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-950">Odoo Café</h1>
            {table && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                Table {table.table_number}
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={() => {
            localStorage.removeItem('self_order_table');
            localStorage.removeItem('self_order_cart');
            navigate('/self-order');
          }}
          className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
        >
          Exit Session
        </button>
      </header>

      {/* Hero Banner */}
      <div className="px-4 py-6 bg-gradient-to-r from-amber-400/20 to-amber-500/10 border-b border-amber-100/40">
        <h2 className="text-xl font-black text-slate-900">Order directly from your table.</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Quick service, hot delivery, direct to table.</p>
      </div>

      {/* Category selector */}
      <div className="sticky top-[69px] z-20 bg-[#FFF9EB] py-3.5 border-b border-amber-100/30 flex items-center gap-2 overflow-x-auto px-4 scrollbar-none select-none">
        <button
          onClick={() => setSelectedCatId('ALL')}
          className={`px-4.5 py-2.5 rounded-full text-xs font-black transition shrink-0 cursor-pointer ${
            selectedCatId === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400'
          }`}
        >
          All Items
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCatId(c.id)}
            style={{ 
              backgroundColor: selectedCatId === c.id ? c.color || '#F59E0B' : '#FFFFFF',
              color: selectedCatId === c.id ? '#FFFFFF' : '#475569'
            }}
            className={`px-4.5 py-2.5 rounded-full text-xs font-black transition shrink-0 cursor-pointer border border-slate-200/60 shadow-sm`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="px-4 py-4 shrink-0">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search our delicious dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-amber-400 shadow-sm"
          />
        </div>
      </div>

      {/* Product List */}
      <main className="flex-1 px-4 space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white/40 border border-dashed border-amber-200 rounded-3xl">
            <p className="text-slate-400 text-sm font-medium">No dishes match your query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const matchingCartItems = cart.filter((item) => item.product.id === p.id);
              const qtyInCart = matchingCartItems.reduce((acc, item) => acc + item.quantity, 0);

              return (
                <div key={p.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-md flex justify-between gap-4 transition duration-300 hover:shadow-lg">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-black text-slate-900 text-lg">₹{p.price.toFixed(2)}</span>
                      {p.tax > 0 && <span className="text-[10px] text-slate-400 font-semibold">+ ₹{p.tax.toFixed(2)} tax</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-between shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-200/40 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100/50">
                      <Coffee size={36} />
                    </div>

                    <div className="mt-3">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {matchingCartItems.map((item, idx) => (
                            <div key={idx} className="flex items-center bg-slate-900 text-white rounded-xl px-2 py-1 gap-2 text-xs">
                              <span className="max-w-[50px] truncate text-[10px]" title={item.notes}>
                                {item.notes ? `*` : 'Qty'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQuantity(p.id, item.notes, -1)}
                                  className="text-amber-400 hover:text-white"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(p.id, item.notes, 1)}
                                  className="text-amber-400 hover:text-white"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => handleOpenCustomization(p)}
                            className="p-1 border border-slate-200 hover:border-amber-400 rounded-xl text-slate-500 hover:text-amber-600 transition"
                            title="Add item with different notes"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenCustomization(p)}
                          className="w-24 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Add +
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-amber-100 px-4 py-4 flex items-center justify-between shadow-2xl z-40 max-w-lg mx-auto rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <ShoppingBag size={20} />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">
                {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'} Added
              </span>
              <span className="font-black text-slate-900 text-lg">
                ₹{cartSubtotal.toFixed(2)}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/self-order/checkout')}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-sm px-6 py-4 rounded-2xl shadow-lg transition active:scale-[0.98] cursor-pointer"
          >
            Review Cart
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Item Customization Notes Modal */}
      {customModalItem && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block mb-1">Customize Order</span>
                <h3 className="text-lg font-black text-slate-950">{customModalItem.name}</h3>
              </div>
              <button 
                onClick={() => setCustomModalItem(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <MessageSquare size={12} />
                  Kitchen notes / requests
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. less spicy, no onion, extra ice..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-amber-400 transition bg-slate-50 shadow-inner"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    addToCart(customModalItem, '');
                    setCustomModalItem(null);
                  }}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Add Standard
                </button>
                <button
                  onClick={handleConfirmCustomization}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/10 transition cursor-pointer"
                >
                  Add Custom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
