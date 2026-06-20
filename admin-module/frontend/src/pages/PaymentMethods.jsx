import React, { useState, useEffect } from 'react';
import { GripVertical, Trash2, Plus, QrCode, Sparkles } from 'lucide-react';
import Modal from '../components/Modal';

const DEFAULT_METHODS = [
  { id: 'pay_1', name: 'Cash Register', type: 'Cash', upiId: '', active: true },
  { id: 'pay_2', name: 'PineLabs Card Terminal', type: 'Card', upiId: '', active: true },
  { id: 'pay_3', name: 'Counter GPay UPI QR', type: 'UPI', upiId: 'odoocafe@ybl', active: true },
];

export default function PaymentMethods() {
  const [methods, setMethods] = useState(() => {
    const stored = localStorage.getItem('payment_methods');
    return stored ? JSON.parse(stored) : DEFAULT_METHODS;
  });

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Cash', upiId: '', active: true });
  const [selectedUpiRow, setSelectedUpiRow] = useState(null);

  useEffect(() => {
    localStorage.setItem('payment_methods', JSON.stringify(methods));
  }, [methods]);

  const filtered = methods.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditingId(null);
    setForm({ name: '', type: 'Cash', upiId: '', active: true });
    setModalOpen(true);
  }

  function openEdit(method) {
    setEditingId(method.id);
    setForm({ ...method });
    setModalOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId) {
      setMethods((prev) =>
        prev.map((m) => (m.id === editingId ? { ...form, id: editingId } : m))
      );
    } else {
      const newMethod = {
        ...form,
        id: `pay_${Date.now()}`,
      };
      setMethods((prev) => [...prev, newMethod]);
    }
    setModalOpen(false);
  }

  function toggleActive(id) {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  }

  function handleDelete(id) {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    if (selectedUpiRow?.id === id) {
      setSelectedUpiRow(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <input
          type="text"
          placeholder="Search payment methods…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
        />
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5">
          <Plus size={16} />
          <span>New Method</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List table */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-10"></th>
                <th className="px-4 py-3.5 font-bold">Name</th>
                <th className="px-4 py-3.5 font-bold">Type</th>
                <th className="px-4 py-3.5 font-bold">Details</th>
                <th className="px-4 py-3.5 font-bold">Active</th>
                <th className="px-4 py-3.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => {
                    if (m.type === 'UPI' && m.upiId) {
                      setSelectedUpiRow(m);
                    } else {
                      setSelectedUpiRow(null);
                    }
                  }}
                  className={`hover:bg-slate-50/70 cursor-pointer transition ${
                    selectedUpiRow?.id === m.id ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <td className="px-4 py-4 text-slate-300">
                    <GripVertical size={16} className="cursor-grab" />
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(m);
                      }}
                      className="hover:underline text-left text-slate-800 font-bold"
                    >
                      {m.name}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.type === 'UPI'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : m.type === 'Card'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500 font-mono text-xs">
                    {m.type === 'UPI' ? m.upiId || '—' : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(m.id);
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        m.active ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          m.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(m.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live QR Preview Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px]">
          {selectedUpiRow ? (
            <div className="text-center space-y-4 w-full">
              <div className="flex items-center justify-center gap-1.5 text-indigo-600 font-black text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Live QR Terminal</span>
              </div>
              <p className="text-sm font-extrabold text-slate-800">{selectedUpiRow.name}</p>
              
              <div className="inline-block p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=${encodeURIComponent(
                    selectedUpiRow.upiId
                  )}`}
                  alt="UPI QR Code"
                  className="h-40 w-40 block rounded-lg shadow-sm"
                />
              </div>

              <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-150 inline-block max-w-full overflow-hidden">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">UPI Virtual Address</p>
                <code className="text-xs text-slate-700 font-mono font-bold block truncate">{selectedUpiRow.upiId}</code>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 space-y-3 p-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-200 shadow-inner">
                <QrCode size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">No UPI Method Selected</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Click on any UPI payment method row to display its live generated checkout QR code preview.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editingId ? 'Edit Payment Method' : 'New Payment Method'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary font-bold text-xs" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="method-form" type="submit" className="btn-primary font-bold text-xs">
              Save Method
            </button>
          </>
        }
      >
        <form id="method-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
              placeholder="e.g. Counter UPI Scanner"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Type</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value,
                  upiId: e.target.value === 'UPI' ? prev.upiId : '',
                }))
              }
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {form.type === 'UPI' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">UPI ID</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700 font-mono"
                placeholder="odoocafe@ybl"
                value={form.upiId}
                onChange={(e) => setForm((prev) => ({ ...prev, upiId: e.target.value }))}
              />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
