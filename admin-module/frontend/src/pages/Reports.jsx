import React, { useState } from 'react';
import { Calendar, User, ShoppingBag, Coffee, ArrowUpRight, ArrowDownRight, Download, X } from 'lucide-react';

const INITIAL_FILTERS = [
  { id: 'period', label: 'Period: Last 30 Days' },
  { id: 'user', label: 'User: Admin User' },
  { id: 'session', label: 'Session: #00234' },
  { id: 'product', label: 'Product: All Products' },
];

const TOP_ORDERS = [
  { id: 'ORD-1090', customer: 'Table 4 (Amit)', date: '21 Jun, 09:12 PM', employee: 'Cashier Sita', amount: '₹1,240.00' },
  { id: 'ORD-1089', customer: 'Table 12 (Sabha)', date: '21 Jun, 08:45 PM', employee: 'Admin User', amount: '₹890.00' },
  { id: 'ORD-1088', customer: 'Table 2 (Rajesh)', date: '21 Jun, 08:30 PM', employee: 'Cashier Sita', amount: '₹2,150.00' },
  { id: 'ORD-1087', customer: 'Takeaway (Preeti)', date: '21 Jun, 07:15 PM', employee: 'Chef Mario', amount: '₹450.00' },
];

const TOP_PRODUCTS = [
  { name: 'Masala Tea', qty: 245, revenue: '₹7,350.00' },
  { name: 'Chicken Burger', qty: 189, revenue: '₹34,020.00' },
  { name: 'Paneer Pizza', qty: 132, revenue: '₹39,600.00' },
  { name: 'Garlic Bread', qty: 98, revenue: '₹11,760.00' },
];

const TOP_CATEGORIES = [
  { name: 'Meal', revenue: '₹95,200.00' },
  { name: 'Beverages', revenue: '₹48,150.00' },
  { name: 'Chaat', revenue: '₹24,600.00' },
  { name: 'Dessert', revenue: '₹18,900.00' },
];

export default function Reports() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  function removeFilter(id) {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  function handleExport() {
    alert('Exporting Report in PDF/XLS format...');
  }

  return (
    <div className="space-y-6">
      {/* Filters row & Export button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl shadow-sm transition"
            >
              <span>{f.label}</span>
              <button
                onClick={() => removeFilter(f.id)}
                className="p-0.5 hover:bg-indigo-100 rounded-md text-indigo-400 hover:text-indigo-600 transition"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {filters.length === 0 && (
            <span className="text-xs text-slate-400 font-bold italic py-1.5 px-2">No active filters</span>
          )}
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5 shadow-sm bg-slate-50 border border-slate-200"
        >
          <Download size={15} />
          <span>Export PDF/XLS</span>
        </button>
      </div>

      {/* Stat cards (3 across) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">1,248</h3>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight size={14} />
              <span>+12.4% vs last period</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="text-sm font-black">₹</span>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹1,86,850.00</h3>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight size={14} />
              <span>+8.2% vs last period</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Order Value</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Coffee size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹149.72</h3>
            <p className="text-xs font-bold text-rose-600 flex items-center gap-0.5">
              <ArrowDownRight size={14} />
              <span>-1.8% vs last period</span>
            </p>
          </div>
        </div>
      </div>

      {/* SVG Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">Sales Trends (Last 7 Days)</h4>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-md uppercase">Daily Volume</span>
          </div>
          <div className="h-64 flex items-end justify-between relative pt-6 border-b border-l border-slate-100">
            {/* Draw inline SVG chart */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="0.5" />
              
              {/* Line graph path */}
              <path
                d="M 5,80 Q 20,60 35,45 T 65,30 T 95,15"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 5,80 Q 20,60 35,45 T 65,30 T 95,15 L 95,100 L 5,100 Z"
                fill="url(#grad)"
                opacity="0.15"
              />
              
              {/* Gradient for area under line */}
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400 font-bold">Mon</div>
            <div className="absolute bottom-1 left-[16%] text-[10px] text-slate-400 font-bold">Tue</div>
            <div className="absolute bottom-1 left-[32%] text-[10px] text-slate-400 font-bold">Wed</div>
            <div className="absolute bottom-1 left-[48%] text-[10px] text-slate-400 font-bold">Thu</div>
            <div className="absolute bottom-1 left-[64%] text-[10px] text-slate-400 font-bold">Fri</div>
            <div className="absolute bottom-1 left-[80%] text-[10px] text-slate-400 font-bold">Sat</div>
            <div className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-bold">Sun</div>
          </div>
        </div>

        {/* Right: Pie Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-800">Top Selling Category</h4>
          <div className="flex flex-col items-center justify-center space-y-5 h-64">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                {/* Dessert (10%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#fbbf24" strokeWidth="4.2" strokeDasharray="10 90" strokeDashoffset="0" />
                {/* Chaat (15%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" strokeWidth="4.2" strokeDasharray="15 85" strokeDashoffset="-10" />
                {/* Beverages (25%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4.2" strokeDasharray="25 75" strokeDashoffset="-25" />
                {/* Meal (50%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4f46e5" strokeWidth="4.2" strokeDasharray="50 50" strokeDashoffset="-50" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-400 font-bold uppercase">Revenue</span>
                <span className="text-sm font-black text-slate-800">1.86L</span>
              </div>
            </div>
            {/* Pie chart legends */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-bold text-slate-600 w-full">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <span>Meal (50%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Beverages (25%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Chaat (15%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Dessert (10%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Orders table (Full width) */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">Top Sales Orders</h4>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md uppercase">Recent high value</span>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-bold">Order ID</th>
              <th className="px-5 py-3 font-bold">Customer / Location</th>
              <th className="px-5 py-3 font-bold">Date & Time</th>
              <th className="px-5 py-3 font-bold">Employee</th>
              <th className="px-5 py-3 font-bold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            {TOP_ORDERS.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50 transition">
                <td className="px-5 py-3.5 text-indigo-600 font-bold">{o.id}</td>
                <td className="px-5 py-3.5">{o.customer}</td>
                <td className="px-5 py-3.5 text-slate-500 text-xs">{o.date}</td>
                <td className="px-5 py-3.5">{o.employee}</td>
                <td className="px-5 py-3.5 text-right font-black text-slate-900">{o.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Two tables side-by-side: Top Product & Top Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Product */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-800">Top Products by Quantity</h4>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Product</th>
                <th className="px-5 py-3 font-bold">Qty Sold</th>
                <th className="px-5 py-3 font-bold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {TOP_PRODUCTS.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5 text-slate-800 font-bold">{p.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{p.qty} units</td>
                  <td className="px-5 py-3.5 text-right font-black text-slate-900">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Category */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-800">Top Categories by Revenue</h4>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Category</th>
                <th className="px-5 py-3 font-bold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {TOP_CATEGORIES.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5 text-slate-800 font-bold">{c.name}</td>
                  <td className="px-5 py-3.5 text-right font-black text-slate-900">{c.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
