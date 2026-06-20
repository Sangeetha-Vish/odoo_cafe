import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, CheckCircle, Clock, Coffee, Shield } from 'lucide-react';

const INITIAL_TICKETS = [
  {
    id: 'T-1090',
    table: 'Table 4',
    category: 'Quick Bites',
    status: 'To Cook',
    items: [
      { name: 'Masala Tea', qty: 3, done: false },
      { name: 'Paneer Pizza', qty: 1, done: false },
    ],
  },
  {
    id: 'T-1089',
    table: 'Table 12',
    category: 'Drink',
    status: 'Preparing',
    items: [
      { name: 'Lassi', qty: 3, done: false },
      { name: 'Chicken Burger', qty: 2, done: true },
    ],
  },
  {
    id: 'T-1088',
    table: 'Table 2',
    category: 'Dessert',
    status: 'To Cook',
    items: [
      { name: 'Chocolate Waffle', qty: 1, done: false },
      { name: 'Vanilla Ice Cream', qty: 2, done: false },
    ],
  },
  {
    id: 'T-1087',
    table: 'Takeaway',
    category: 'Quick Bites',
    status: 'Completed',
    items: [
      { name: 'Garlic Bread', qty: 2, done: true },
      { name: 'Masala Tea', qty: 1, done: true },
    ],
  },
  {
    id: 'T-1086',
    table: 'Table 5',
    category: 'Drink',
    status: 'To Cook',
    items: [
      { name: 'Cold Coffee', qty: 2, done: false },
    ],
  },
  {
    id: 'T-1085',
    table: 'Table 1',
    category: 'Meal',
    status: 'Preparing',
    items: [
      { name: 'Chicken Pizza', qty: 1, done: false },
      { name: 'Garlic Bread', qty: 1, done: true },
    ],
  },
  {
    id: 'T-1084',
    table: 'Table 9',
    category: 'Meal',
    status: 'Completed',
    items: [
      { name: 'Paneer Pizza', qty: 2, done: true },
    ],
  },
];

export default function Kds() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  // Sidebar collapsible filters
  const [productGroupOpen, setProductGroupOpen] = useState(true);
  const [categoryGroupOpen, setCategoryGroupOpen] = useState(true);

  // Checkbox filters
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const allProducts = ['Masala Tea', 'Paneer Pizza', 'Lassi', 'Chicken Burger', 'Chocolate Waffle', 'Vanilla Ice Cream', 'Cold Coffee', 'Chicken Pizza', 'Garlic Bread'];
  const allCategories = ['Meal', 'Dessert', 'Quick Bites', 'Drink'];

  // Toggle item done state
  function toggleItemDone(ticketId, itemName, e) {
    e.stopPropagation(); // Stop card click from triggering
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          items: t.items.map((item) =>
            item.name === itemName ? { ...item, done: !item.done } : item
          ),
        };
      })
    );
  }

  // Click card to move to next stage or complete
  function handleCardClick(ticketId) {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        if (t.status === 'To Cook') return { ...t, status: 'Preparing' };
        if (t.status === 'Preparing') {
          // Mark all items done when completing
          return {
            ...t,
            status: 'Completed',
            items: t.items.map((item) => ({ ...item, done: true })),
          };
        }
        // Completed -> To Cook (cycle back for demo)
        return { ...t, status: 'To Cook', items: t.items.map((item) => ({ ...item, done: false })) };
      })
    );
  }

  // Handle product filter check
  function toggleProductFilter(name) {
    setSelectedProducts((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  // Handle category filter check
  function toggleCategoryFilter(name) {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  // Filter calculations
  const filteredTickets = tickets.filter((t) => {
    // 1. Tab filter
    if (activeTab !== 'All' && t.status !== activeTab) return false;

    // 2. Search filter (Order ID / Table Name)
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.table.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // 3. Category Filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) {
      return false;
    }

    // 4. Product Filter (Show ticket if it contains any of the selected products)
    if (selectedProducts.length > 0) {
      const hasProduct = t.items.some((item) => selectedProducts.includes(item.name));
      if (!hasProduct) return false;
    }

    return true;
  });

  // Count helper
  const getCount = (status) => {
    if (status === 'All') return tickets.length;
    return tickets.filter((t) => t.status === status).length;
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 flex-col overflow-hidden font-sans">
      {/* KDS Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg">
            <Coffee className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white uppercase">Kitchen Display System</h1>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none mt-0.5">Live KDS Node</p>
          </div>
        </div>

        {/* Top-Right Search bar */}
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search tickets / tables…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-850 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold text-slate-200 placeholder-slate-500 transition"
          />
        </div>
      </header>

      {/* Main KDS split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Filter Groups */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 space-y-5 overflow-y-auto hidden md:block">
          {/* Product Group Filter */}
          <div className="space-y-2">
            <button
              onClick={() => setProductGroupOpen(!productGroupOpen)}
              className="w-full flex items-center justify-between py-1.5 text-xs font-black text-slate-400 uppercase tracking-wider hover:text-slate-200 transition"
            >
              <span>Product ({selectedProducts.length})</span>
              {productGroupOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {productGroupOpen && (
              <div className="space-y-1.5 pl-1 transition-all duration-300">
                {allProducts.map((p) => (
                  <label key={p} className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 cursor-pointer hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(p)}
                      onChange={() => toggleProductFilter(p)}
                      className="rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-800" />

          {/* Category Group Filter */}
          <div className="space-y-2">
            <button
              onClick={() => setCategoryGroupOpen(!categoryGroupOpen)}
              className="w-full flex items-center justify-between py-1.5 text-xs font-black text-slate-400 uppercase tracking-wider hover:text-slate-200 transition"
            >
              <span>Category ({selectedCategories.length})</span>
              {categoryGroupOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {categoryGroupOpen && (
              <div className="space-y-1.5 pl-1 transition-all duration-300">
                {allCategories.map((c) => (
                  <label key={c} className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 cursor-pointer hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(c)}
                      onChange={() => toggleCategoryFilter(c)}
                      className="rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          {/* Top Filter Tabs bar */}
          <div className="bg-slate-950/40 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              {['All', 'To Cook', 'Preparing', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-sm ${
                    activeTab === tab
                      ? 'bg-orange-600 text-white shadow-orange-900/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab ? 'bg-orange-700 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {getCount(tab)}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">
              Click Card to advance stage · Click Line to cross off item
            </div>
          </div>

          {/* Grid of Ticket Cards */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Clock size={36} className="text-slate-600 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider">No tickets matching selected filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleCardClick(ticket.id)}
                    className={`bg-slate-950 border rounded-2xl p-4 shadow-lg hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between ${
                      ticket.status === 'Completed'
                        ? 'border-emerald-800/60 bg-emerald-950/10'
                        : ticket.status === 'Preparing'
                        ? 'border-orange-500/60 shadow-orange-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Ticket Card Header */}
                      <div className="flex items-start justify-between pb-3 border-b border-slate-900 mb-3">
                        <div>
                          <span className="text-sm font-black text-white block tracking-tight">{ticket.id}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{ticket.table}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          ticket.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : ticket.status === 'Preparing'
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>

                      {/* Ticket Items List */}
                      <ul className="space-y-2">
                        {ticket.items.map((item, idx) => (
                          <li
                            key={idx}
                            onClick={(e) => toggleItemDone(ticket.id, item.name, e)}
                            className={`flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-900 transition text-xs font-semibold select-none ${
                              item.done ? 'text-slate-600 line-through' : 'text-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${item.done ? 'bg-slate-700' : 'bg-orange-500'}`} />
                              <span>{item.qty} x {item.name}</span>
                            </span>
                            {item.done && <span className="text-[9px] bg-slate-850 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">Done</span>}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Card Footer action note */}
                    <div className="mt-4 pt-2 border-t border-slate-900 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Click to advance</span>
                      <span>➔</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
