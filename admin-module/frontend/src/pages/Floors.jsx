import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = { name: '' };

export default function Floors() {
  const [floors, setFloors] = useState([]);
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

  const fetchFloors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/floors');
      setFloors(res.data.data);
    } catch (err) {
      console.error('Failed to load floors', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  // Live updates from other admin sessions / modules
  useEffect(() => {
    const socket = getSocket();

    const onCreated = (floor) =>
      setFloors((prev) => (prev.some((f) => f.id === floor.id) ? prev : [floor, ...prev]));
    const onUpdated = (floor) =>
      setFloors((prev) => prev.map((f) => (f.id === floor.id ? floor : f)));
    const onDeleted = ({ id }) => setFloors((prev) => prev.filter((f) => f.id !== id));

    socket.on('floor:created', onCreated);
    socket.on('floor:updated', onUpdated);
    socket.on('floor:deleted', onDeleted);

    return () => {
      socket.off('floor:created', onCreated);
      socket.off('floor:updated', onUpdated);
      socket.off('floor:deleted', onDeleted);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return floors;
    const q = search.toLowerCase();
    return floors.filter((f) => f.name.toLowerCase().includes(q));
  }, [floors, search]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(floor) {
    setEditingId(floor.id);
    setForm({ name: floor.name });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Floor name is required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        const res = await api.put(`/floors/${editingId}`, form);
        setFloors((prev) => prev.map((f) => (f.id === editingId ? res.data.data : f)));
      } else {
        const res = await api.post('/floors', form);
        setFloors((prev) => [res.data.data, ...prev]);
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
      await api.delete(`/floors/${deleteTarget.id}`);
      setFloors((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete floor');
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
            placeholder="Search floors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>
        <button onClick={openCreate} className="btn-primary">
          + New Floor
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={2} className="px-5 py-10 text-center text-slate-400">
                  Loading floors…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="px-5 py-10 text-center text-slate-400">
                  No floors found. Create one to get started.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((floor) => (
                <tr key={floor.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{floor.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(floor)} className="btn-secondary px-3 py-1.5 text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(floor);
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
        title={editingId ? 'Edit Floor' : 'New Floor'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="floor-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create floor'}
            </button>
          </>
        }
      >
        <form id="floor-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="fl-name">Name</label>
            <input
              id="fl-name"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Ground Floor"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete floor"
        message={
          deleteError ||
          `Delete "${deleteTarget?.name}"? This is only possible once all its tables have been removed.`
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
