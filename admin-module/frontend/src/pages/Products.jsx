import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/helpers';
import useDebounce from '../utils/useDebounce';
import { Trash2, Plus, CheckSquare, Square, ChevronDown, Sparkles } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  tax: '',
  categoryId: '',
};

const PRESET_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Category combobox state
  const [categorySearch, setCategorySearch] = useState('');
  const [comboDropdownOpen, setComboDropdownOpen] = useState(false);
  
  // Inner Category Creation state
  const [innerCategoryModal, setInnerCategoryModal] = useState(false);
  const [innerCategoryName, setInnerCategoryName] = useState('');
  const [innerCategoryColor, setInnerCategoryColor] = useState('#6366F1');

  const debouncedSearch = useDebounce(search, 300);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products from backend whenever search query or categoryFilter changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', {
          params: {
            search: debouncedSearch.trim() || undefined,
            categoryId: categoryFilter || undefined,
          },
        });
        setProducts(res.data.data);
      } catch (err) {
        console.error('Failed to search products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, categoryFilter]);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (product) =>
      setProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [product, ...prev]));
    const onUpdated = (product) =>
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    const onDeleted = ({ id }) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    };

    socket.on('product:created', onCreated);
    socket.on('product:updated', onUpdated);
    socket.on('product:deleted', onDeleted);

    return () => {
      socket.off('product:created', onCreated);
      socket.off('product:updated', onUpdated);
      socket.off('product:deleted', onDeleted);
    };
  }, []);

  const filtered = products;
  const noCategories = categories.length === 0;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCategorySearch('');
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
    const foundCat = categories.find((c) => String(c.id) === String(product.category_id));
    setCategorySearch(foundCat ? foundCat.name : '');
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.tax || !form.categoryId) {
      setFormError('All fields including category are required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        tax: Number(form.tax),
        categoryId: Number(form.categoryId),
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
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  // Bulk Selection functions
  function handleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  }

  function handleSelectRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected products?`)) return;
    
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/products/${id}`);
      }
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (err) {
      alert('Failed to delete some products.');
    } finally {
      setLoading(false);
    }
  }

  // Combobox category filter options
  const matchingCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const showCreateOption =
    categorySearch.trim() !== '' &&
    !categories.some((c) => c.name.toLowerCase() === categorySearch.toLowerCase().trim());

  async function handleCreateInnerCategory(e) {
    e.preventDefault();
    if (!innerCategoryName.trim()) return;

    try {
      const res = await api.post('/categories', {
        name: innerCategoryName.trim(),
        color: innerCategoryColor,
      });
      const newCat = res.data.data;
      setCategories((prev) => [...prev, newCat]);
      
      // Auto-select in form
      setForm((prev) => ({ ...prev, categoryId: newCat.id }));
      setCategorySearch(newCat.name);
      
      // Reset & close inline popup
      setInnerCategoryModal(false);
      setComboDropdownOpen(false);
      setInnerCategoryName('');
    } catch (err) {
      alert('Failed to create category');
    }
  }

  return (
    <div className="space-y-6">
      {/* Top search and filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
          />
          <select
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-rose-200"
            >
              <Trash2 size={14} />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
        </div>

        <button 
          onClick={openCreate} 
          className="btn-primary flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5"
        >
          <Plus size={16} />
          <span>New Product</span>
        </button>
      </div>

      {noCategories && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add a category first before creating products — every product must belong to one.
        </div>
      )}

      {/* Products table */}
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
              <th className="px-5 py-3.5 font-bold">Product</th>
              <th className="px-5 py-3.5 font-bold">Category</th>
              <th className="px-5 py-3.5 font-bold">Price</th>
              <th className="px-5 py-3.5 font-bold">Tax</th>
              <th className="px-5 py-3.5 font-bold">Created</th>
              <th className="px-5 py-3.5 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-bold">
                  Loading products…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-bold">
                  No products found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => handleSelectRow(product.id)} className="text-slate-400 hover:text-slate-600 transition">
                      {selectedIds.includes(product.id) ? (
                        <CheckSquare size={18} className="text-indigo-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-800">{product.name}</p>
                      {product.description && (
                        <p className="max-w-xs truncate text-[11px] text-slate-400 font-medium">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {product.category_name ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: product.category_color }}
                        />
                        {product.category_name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-900 font-bold">{formatCurrency(product.price)}</td>
                  <td className="px-5 py-4 text-slate-500 font-medium">{formatCurrency(product.tax)}</td>
                  <td className="px-5 py-4 text-slate-400 font-medium text-xs">{formatDate(product.created_at)}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(product)} className="btn-secondary px-3 py-1.5 text-xs font-bold">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(product);
                        }}
                        className="btn-danger px-3 py-1.5 text-xs font-bold"
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

      {/* New / Edit Product Modal */}
      <Modal
        open={modalOpen}
        title={editingId ? 'Edit Product' : 'New Product'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary font-bold text-xs" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="product-form" type="submit" className="btn-primary font-bold text-xs" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Product Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
              placeholder="e.g. Garlic Fried Rice"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 h-20 resize-none"
              placeholder="Describe the dish..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tax (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                placeholder="0.00"
                value={form.tax}
                onChange={(e) => setForm((f) => ({ ...f, tax: e.target.value }))}
              />
            </div>
          </div>

          {/* Combobox Category Selection */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700 pr-10"
                placeholder="Type or select category..."
                value={categorySearch}
                onFocus={() => setComboDropdownOpen(true)}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setComboDropdownOpen(true);
                }}
              />
              <button
                type="button"
                onClick={() => setComboDropdownOpen(!comboDropdownOpen)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Combobox Dropdown popup options */}
            {comboDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 max-h-56 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-y-auto py-1">
                {matchingCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, categoryId: c.id }));
                      setCategorySearch(c.name);
                      setComboDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.name}</span>
                  </button>
                ))}
                
                {showCreateOption && (
                  <button
                    type="button"
                    onClick={() => {
                      setInnerCategoryName(categorySearch.trim());
                      setInnerCategoryModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition border-t border-slate-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Create & Edit "{categorySearch}"</span>
                  </button>
                )}

                {matchingCategories.length === 0 && !showCreateOption && (
                  <div className="px-4 py-3 text-xs text-slate-400 font-bold italic">
                    No categories found
                  </div>
                )}
              </div>
            )}
          </div>

          {formError && <p className="text-xs font-bold text-rose-600">{formError}</p>}
        </form>
      </Modal>

      {/* Inner modal to Create & Edit Category from product form */}
      {innerCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setInnerCategoryModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-zoom-in">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles size={16} className="text-indigo-600" />
              <span>Create Category Inline</span>
            </h4>
            
            <form onSubmit={handleCreateInnerCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-700"
                  value={innerCategoryName}
                  onChange={(e) => setInnerCategoryName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Pick Color Swatch</label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setInnerCategoryColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-6 w-6 rounded-full border transition ${
                        innerCategoryColor === color ? 'ring-2 ring-indigo-600 scale-110 border-white' : 'border-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setInnerCategoryModal(false)}
                  className="btn-secondary py-2 px-3 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 px-3 font-bold">
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Product Confirmation */}
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
