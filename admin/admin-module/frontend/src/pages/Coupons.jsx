import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = {
  code: '',
  type: 'percentage',
  value: '',
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data);
    } catch (err) {
      console.error('Failed to load coupons', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (coupon) =>
      setCoupons((prev) => (prev.some((c) => c.id === coupon.id) ? prev : [coupon, ...prev]));
    const onDeleted = ({ id }) => setCoupons((prev) => prev.filter((c) => c.id !== id));

    socket.on('coupon:created', onCreated);
    socket.on('coupon:deleted', onDeleted);

    return () => {
      socket.off('coupon:created', onCreated);
      socket.off('coupon:deleted', onDeleted);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return coupons;
    const q = search.toLowerCase();
    return coupons.filter((c) => c.code.toLowerCase().includes(q));
  }, [coupons, search]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code.trim() || form.value === '' || Number(form.value) < 0) {
      setFormError('Code and a valid value are required');
      return;
    }
    if (form.type === 'percentage' && Number(form.value) > 100) {
      setFormError('Percentage value cannot exceed 100');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
      };
      const res = await api.post('/coupons', payload);
      setCoupons((prev) => [res.data.data, ...prev]);
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
    try {
      await api.delete(`/coupons/${deleteTarget.id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete coupon', err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search by code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-56"
        />
        <button onClick={openCreate} className="btn-primary">
          + New Coupon
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Value</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  Loading coupons…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  No coupons found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-900">{coupon.code}</td>
                  <td className="px-5 py-3.5 text-slate-600 capitalize">{coupon.type}</td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {coupon.type === 'percentage'
                      ? `${Number(coupon.value)}%`
                      : `₹${Number(coupon.value).toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDeleteTarget(coupon)}
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
        title="New Coupon"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="coupon-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create coupon'}
            </button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="c-code">Code</label>
            <input
              id="c-code"
              className="input-field font-mono uppercase"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="SAVE20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="c-type">Type</label>
              <select
                id="c-type"
                className="input-field"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="label-field" htmlFor="c-value">
                Value {form.type === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                id="c-value"
                type="number"
                min="0"
                max={form.type === 'percentage' ? 100 : undefined}
                step="0.01"
                className="input-field"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <p className="text-xs text-slate-400">
            Coupons can&apos;t be edited after creation — delete and recreate if details change.
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete coupon"
        message={`Delete coupon "${deleteTarget?.code}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
