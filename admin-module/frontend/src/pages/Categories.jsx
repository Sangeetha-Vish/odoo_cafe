import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/helpers';

const EMPTY_FORM = { name: '', color: '#6366F1' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

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
      setCategories((prev) => (prev.some((c) => c.id === category.id) ? prev : [category, ...prev]));
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

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(category) {
    setEditingId(category.id);
    setForm({ name: category.name, color: category.color || '#6366F1' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Category name is required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        const res = await api.put(`/categories/${editingId}`, form);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? res.data.data : c)));
      } else {
        const res = await api.post('/categories', form);
        setCategories((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>
        <button onClick={openCreate} className="btn-primary">
          + New Category
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Color</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  Loading categories…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  No categories found. Create one to get started.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{category.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-mono text-xs text-slate-500">{category.color}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(category.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(category)} className="btn-secondary px-3 py-1.5 text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(category);
                        }}
                        className="btn-danger px-3 py-1.5 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit Category' : 'New Category'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="category-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="cat-name">Name</label>
            <input
              id="cat-name"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Beverages"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="cat-color">Color</label>
            <div className="flex items-center gap-3">
              <input
                id="cat-color"
                type="color"
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              />
              <input
                className="input-field font-mono"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="#6366F1"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category"
        message={
          deleteError ||
          `Delete "${deleteTarget?.name}"? This is only possible once no products reference it.`
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
