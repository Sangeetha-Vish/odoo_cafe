import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Percent, Tag, ToggleLeft, ToggleRight, Sparkles, CheckSquare, Square } from 'lucide-react';
import Modal from '../components/Modal';

const DEFAULT_COUPONS = [
  { id: 'cp_1', name: 'Summer Splurge 30%', code: 'SUMMER30', type: 'Coupon', apply: 'Order', minAmount: 500, minQty: 0, redeemVal: 30, redeemUnit: '%', active: true, desc: 'Get 30% discount on order value above ₹500' },
  { id: 'cp_2', name: 'Coffee Rush Burger Promo', code: '', type: 'Automated Promo', apply: 'Product', minAmount: 0, minQty: 2, redeemVal: 50, redeemUnit: '₹', active: true, desc: 'Buy 2 or more Burgers, get ₹50 off order' },
  { id: 'cp_3', name: 'Flat 50 Welcome Discount', code: 'WELCOME50', type: 'Coupon', apply: 'Order', minAmount: 150, minQty: 0, redeemVal: 50, redeemUnit: '₹', active: false, desc: 'Flat ₹50 welcome coupon' },
];

export default function Coupons() {
  const [coupons, setCoupons] = useState(() => {
    const stored = localStorage.getItem('promo_coupons');
    return stored ? JSON.parse(stored) : DEFAULT_COUPONS;
  });

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Unified Form state
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'Coupon', // 'Coupon' or 'Automated Promo'
    apply: 'Order', // 'Order' or 'Product'
    minAmount: '',
    minQty: '',
    redeemVal: '',
    redeemUnit: '%', // '%' or '₹'
    desc: '',
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    localStorage.setItem('promo_coupons', JSON.stringify(coupons));
  }, [coupons]);

  const filtered = coupons.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  }

  function handleSelectRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function openCreate() {
    setForm({
      name: '',
      code: '',
      type: 'Coupon',
      apply: 'Order',
      minAmount: '',
      minQty: '',
      redeemVal: '',
      redeemUnit: '%',
      desc: '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Promotion Name is required');
      return;
    }
    if (form.type === 'Coupon' && !form.code.trim()) {
      setFormError('Coupon Code is required for coupon type');
      return;
    }
    if (!form.redeemVal || Number(form.redeemVal) <= 0) {
      setFormError('Redeem Discount value is required');
      return;
    }

    const newPromo = {
      ...form,
      id: `cp_${Date.now()}`,
      minAmount: form.apply === 'Order' ? Number(form.minAmount || 0) : 0,
      minQty: form.apply === 'Product' ? Number(form.minQty || 1) : 0,
      redeemVal: Number(form.redeemVal),
      active: true,
    };

    setCoupons((prev) => [newPromo, ...prev]);
    setModalOpen(false);
  }

  function toggleActive(id) {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  }

  function handleDelete(id) {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setCoupons((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search coupon name / code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
          />
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-rose-200"
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5 shadow-md"
        >
          <Plus size={16} />
          <span>New Promotion</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3.5 w-10 text-center">
                <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600 transition">
                  {selectedIds.length === filtered.length && filtered.length > 0 ? (
                    <CheckSquare size={18} className="text-indigo-600" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </th>
              <th className="px-5 py-3.5 font-bold">Promotion Name</th>
              <th className="px-5 py-3.5 font-bold">Type</th>
              <th className="px-5 py-3.5 font-bold">Details</th>
              <th className="px-5 py-3.5 font-bold">Redeem Value</th>
              <th className="px-5 py-3.5 font-bold">Active</th>
              <th className="px-5 py-3.5 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition">
                <td className="px-5 py-4 text-center">
                  <button onClick={() => handleSelectRow(c.id)} className="text-slate-400 hover:text-slate-600 transition">
                    {selectedIds.includes(c.id) ? (
                      <CheckSquare size={18} className="text-indigo-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div>
                    <span className="text-slate-800 font-bold block">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium font-mono">{c.code || 'AUTOMATED PROMO'}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.type === 'Coupon'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {c.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500 font-medium text-xs max-w-xs truncate">
                  {c.desc || (c.apply === 'Order' ? `Min order ₹${c.minAmount}` : `Min qty ${c.minQty} products`)}
                </td>
                <td className="px-5 py-4 text-indigo-600 font-extrabold">
                  {c.redeemUnit === '%' ? `${c.redeemVal}% Off` : `₹${c.redeemVal} Off`}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleActive(c.id)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    {c.active ? (
                      <ToggleRight size={28} className="text-indigo-600" />
                    ) : (
                      <ToggleLeft size={28} className="text-slate-350" />
                    )}
                  </button>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unified Coupon & Promo Modal */}
      <Modal
        open={modalOpen}
        title={form.type === 'Coupon' ? 'Create Coupon Promotion' : 'Create Automated Promotion'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary font-bold text-xs" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="promo-form" type="submit" className="btn-primary font-bold text-xs">
              Save Promotion
            </button>
          </>
        }
      >
        <form id="promo-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Promotion Type</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value, code: e.target.value === 'Coupon' ? prev.code : '' }))}
              >
                <option value="Coupon">Manual Coupon</option>
                <option value="Automated Promo">Automated Promo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Apply To</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                value={form.apply}
                onChange={(e) => setForm((prev) => ({ ...prev, apply: e.target.value }))}
              >
                <option value="Order">Whole Order</option>
                <option value="Product">Specific Product Trigger</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Promotion Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
              placeholder="e.g. Monsoon Weekend 25% Off"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {form.type === 'Coupon' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Coupon Code</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-750 uppercase font-mono"
                placeholder="MONSOON25"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              />
            </div>
          )}

          {/* Conditional field based on Apply dropdown value */}
          {form.apply === 'Order' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Min Order Amount (₹)</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                placeholder="e.g. 500"
                value={form.minAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, minAmount: e.target.value }))}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Min Quantity of Product</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                placeholder="e.g. 2"
                value={form.minQty}
                onChange={(e) => setForm((prev) => ({ ...prev, minQty: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Redeem: Discount Value</label>
              <input
                type="number"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                placeholder="e.g. 25"
                value={form.redeemVal}
                onChange={(e) => setForm((prev) => ({ ...prev, redeemVal: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Redeem Unit</label>
              <div className="flex gap-2 h-11 items-center mt-1">
                {['%', '₹'].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, redeemUnit: unit }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-black transition border ${
                      form.redeemUnit === unit
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Product / Promo Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 h-20 resize-none"
              placeholder="e.g. Get 25% off on all pizza triggers..."
              value={form.desc}
              onChange={(e) => setForm((prev) => ({ ...prev, desc: e.target.value }))}
            />
          </div>

          {formError && <p className="text-xs font-bold text-rose-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
