import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import { GripVertical, Trash2, Check, X, Plus } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const PRESET_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Inline editor state for new/editing rows
  const [editingId, setEditingId] = useState(null); // 'inline_new' or existing id
  const [inlineForm, setInlineForm] = useState({ name: '', color: '#6366F1' });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (category) =>
      setCategories((prev) => (prev.some((c) => c.id === category.id) ? prev : [...prev, category]));
    const onUpdated = (category) =>
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
    const onDeleted = ({ id }) => setCategories((prev) => prev.filter((c) => c.id !== id));

    socket.on('category:created', onCreated);
    socket.on('category:updated', onUpdated);
    socket.on('category:deleted', onDeleted);

    return () => {
      socket.off('category:created', onCreated);
      socket.off('category:updated', onUpdated);
      socket.off('category:deleted', onDeleted);
    };
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function startInlineAdd() {
    setEditingId('inline_new');
    setInlineForm({ name: '', color: '#6366F1' });
  }

  function startInlineEdit(category) {
    setEditingId(category.id);
    setInlineForm({ name: category.name, color: category.color || '#6366F1' });
  }

  async function handleInlineSave() {
    if (!inlineForm.name.trim()) return;

    try {
      if (editingId === 'inline_new') {
        const res = await api.post('/categories', inlineForm);
        setCategories((prev) => [...prev, res.data.data]);
      } else {
        const res = await api.put(`/categories/${editingId}`, inlineForm);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? res.data.data : c)));
      }
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <input
          type="text"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
        />
        <button 
          onClick={startInlineAdd} 
          disabled={editingId !== null}
          className="btn-primary flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5 disabled:opacity-50"
        >
          <Plus size={16} />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3.5 w-12"></th>
              <th className="px-5 py-3.5 font-bold">Category Name</th>
              <th className="px-5 py-3.5 font-bold">Color Swatch</th>
              <th className="px-5 py-3.5 font-bold">Created At</th>
              <th className="px-5 py-3.5 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-bold">
                  Loading categories…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && editingId !== 'inline_new' && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-bold">
                  No categories found.
                </td>
              </tr>
            )}

            {/* List existing rows */}
            {filtered.map((category) => (
              editingId === category.id ? (
                // Inline Edit Mode Row
                <tr key={category.id} className="bg-indigo-50/20">
                  <td className="px-5 py-3 text-slate-400">
                    <GripVertical size={16} />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={inlineForm.name}
                      onChange={(e) => setInlineForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Category Name"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setInlineForm((prev) => ({ ...prev, color: c }))}
                          style={{ backgroundColor: c }}
                          className={`h-5 w-5 rounded-full border transition-transform ${
                            inlineForm.color === c ? 'scale-125 border-slate-800' : 'border-slate-200'
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        value={inlineForm.color}
                        onChange={(e) => setInlineForm((prev) => ({ ...prev, color: e.target.value }))}
                        className="h-5 w-7 cursor-pointer rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">—</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={handleInlineSave} className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 hover:bg-slate-350 text-slate-600 rounded-lg transition shadow-sm">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Regular Read Mode Row
                <tr key={category.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 text-slate-300">
                    <GripVertical size={16} className="cursor-grab" />
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800">
                    <button
                      onClick={() => startInlineEdit(category)}
                      className="hover:underline text-left text-slate-800 font-bold"
                    >
                      {category.name}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4.5 w-4.5 rounded-full border border-slate-200 shadow-sm"
                        style={{ backgroundColor: category.color || '#6366F1' }}
                      />
                      <span className="font-mono text-xs text-slate-400">{category.color || '#6366F1'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-medium text-xs">
                    {formatDate(category.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}

            {/* Inline New Row Editor at the bottom */}
            {editingId === 'inline_new' && (
              <tr className="bg-indigo-50/20">
                <td className="px-5 py-3 text-slate-400">
                  <GripVertical size={16} />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={inlineForm.name}
                    onChange={(e) => setInlineForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Category Name"
                    autoFocus
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setInlineForm((prev) => ({ ...prev, color: c }))}
                        style={{ backgroundColor: c }}
                        className={`h-5 w-5 rounded-full border transition-transform ${
                          inlineForm.color === c ? 'scale-125 border-slate-800' : 'border-slate-200'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={inlineForm.color}
                      onChange={(e) => setInlineForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="h-5 w-7 cursor-pointer rounded border border-slate-200 bg-white"
                    />
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">—</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={handleInlineSave} className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 hover:bg-slate-350 text-slate-600 rounded-lg transition shadow-sm">
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
