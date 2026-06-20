import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/helpers';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  tax: '',
  categoryId: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (product) =>
      setProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [product, ...prev]));
    const onUpdated = (product) =>
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    const onDeleted = ({ id }) => setProducts((prev) => prev.filter((p) => p.id !== id));

    socket.on('product:created', onCreated);
    socket.on('product:updated', onUpdated);
    socket.on('product:deleted', onDeleted);

    return () => {
      socket.off('product:created', onCreated);
      socket.off('product:updated', onUpdated);
      socket.off('product:deleted', onDeleted);
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || String(p.category_id) === String(categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      tax: product.tax,
      categoryId: product.category_id || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === '' || Number(form.price) < 0) {
      setFormError('Name and a valid price are required');
      return;
    }
    if (form.tax === '' || Number(form.tax) < 0) {
      setFormError('Tax is required');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Description is required');
      return;
    }
    if (!form.categoryId) {
      setFormError('Please select a category');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        tax: Number(form.tax),
        categoryId: form.categoryId,
      };

      if (editingId) {
        const res = await api.put(`/products/${editingId}`, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? res.data.data : p)));
      } else {
        const res = await api.post('/products', payload);
        setProducts((prev) => [res.data.data, ...prev]);
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
      await api.delete(`/products/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  const noCategories = !loading && categories.length === 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-56"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary" disabled={noCategories}>
          + New Product
        </button>
      </div>

      {noCategories && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add a category first before creating products — every product must belong to one.
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Tax</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  Loading products…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  No products found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      {product.description && (
                        <p className="max-w-xs truncate text-xs text-slate-500">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {product.category_name ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: product.category_color }}
                        />
                        {product.category_name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-900">{formatCurrency(product.price)}</td>
                  <td className="px-5 py-3.5 text-slate-600">{formatCurrency(product.tax)}</td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(product.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(product)} className="btn-secondary px-3 py-1.5 text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(product);
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
        title={editingId ? 'Edit Product' : 'New Product'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="product-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="p-name">Name</label>
            <input
              id="p-name"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Margherita Pizza"
            />
          </div>

          <div>
            <label className="label-field" htmlFor="p-desc">Description</label>
            <textarea
              id="p-desc"
              className="input-field min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the dish or item"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="p-price">Price (₹)</label>
              <input
                id="p-price"
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="p-tax">Tax (₹)</label>
              <input
                id="p-tax"
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={form.tax}
                onChange={(e) => setForm((f) => ({ ...f, tax: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="label-field" htmlFor="p-category">Category</label>
            <select
              id="p-category"
              className="input-field"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product"
        message={deleteError || `Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
