import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_FORM = {
  tableNumber: '',
  seats: 2,
  floorId: '',
  status: 'FREE',
};

const STATUS_OPTIONS = [
  { value: 'FREE', label: 'Free' },
  { value: 'OCCUPIED', label: 'Occupied' },
];

const STATUS_STYLES = {
  FREE: 'bg-emerald-50 text-emerald-700',
  OCCUPIED: 'bg-red-50 text-red-700',
};

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('');

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
      const [tablesRes, floorsRes] = await Promise.all([
        api.get('/tables'),
        api.get('/floors'),
      ]);
      setTables(tablesRes.data.data);
      setFloors(floorsRes.data.data);
    } catch (err) {
      console.error('Failed to load tables', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (table) =>
      setTables((prev) => (prev.some((t) => t.id === table.id) ? prev : [table, ...prev]));
    const onUpdated = (table) =>
      setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
    const onDeleted = ({ id }) => setTables((prev) => prev.filter((t) => t.id !== id));

    const onFloorCreated = (floor) =>
      setFloors((prev) => (prev.some((f) => f.id === floor.id) ? prev : [floor, ...prev]));
    const onFloorUpdated = (floor) =>
      setFloors((prev) => prev.map((f) => (f.id === floor.id ? floor : f)));
    const onFloorDeleted = ({ id }) => setFloors((prev) => prev.filter((f) => f.id !== id));

    socket.on('table:created', onCreated);
    socket.on('table:updated', onUpdated);
    socket.on('table:deleted', onDeleted);
    socket.on('floor:created', onFloorCreated);
    socket.on('floor:updated', onFloorUpdated);
    socket.on('floor:deleted', onFloorDeleted);

    return () => {
      socket.off('table:created', onCreated);
      socket.off('table:updated', onUpdated);
      socket.off('table:deleted', onDeleted);
      socket.off('floor:created', onFloorCreated);
      socket.off('floor:updated', onFloorUpdated);
      socket.off('floor:deleted', onFloorDeleted);
    };
  }, []);

  const filtered = useMemo(() => {
    return tables.filter((t) => {
      const matchesSearch = !search.trim() || t.table_number.toLowerCase().includes(search.toLowerCase());
      const matchesFloor = !floorFilter || String(t.floor_id) === String(floorFilter);
      return matchesSearch && matchesFloor;
    });
  }, [tables, search, floorFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, floorId: floors[0]?.id || '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(table) {
    setEditingId(table.id);
    setForm({
      tableNumber: table.table_number,
      seats: table.seats,
      floorId: table.floor_id || '',
      status: table.status || 'FREE',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tableNumber.trim()) {
      setFormError('Table number is required');
      return;
    }
    if (!form.floorId) {
      setFormError('Please select a floor');
      return;
    }
    if (form.seats === '' || Number(form.seats) <= 0) {
      setFormError('Seats must be a positive number');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        tableNumber: form.tableNumber.trim(),
        seats: Number(form.seats),
        floorId: form.floorId,
        status: form.status,
      };

      if (editingId) {
        const res = await api.put(`/tables/${editingId}`, payload);
        setTables((prev) => prev.map((t) => (t.id === editingId ? res.data.data : t)));
      } else {
        const res = await api.post('/tables', payload);
        setTables((prev) => [res.data.data, ...prev]);
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
      await api.delete(`/tables/${deleteTarget.id}`);
      setTables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete table');
    } finally {
      setDeleting(false);
    }
  }

  const noFloors = !loading && floors.length === 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by table number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-56"
          />
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All floors</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary" disabled={noFloors}>
          + New Table
        </button>
      </div>

      {noFloors && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add a floor first before creating tables — tables must belong to a floor.
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Table</th>
              <th className="px-5 py-3 font-medium">Floor</th>
              <th className="px-5 py-3 font-medium">Seats</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  Loading tables…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                  No tables found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((table) => (
                <tr key={table.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{table.table_number}</td>
                  <td className="px-5 py-3.5 text-slate-600">{table.floor_name || table.floor || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600">{table.seats} seats</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[table.status] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {table.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(table)} className="btn-secondary px-3 py-1.5 text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget(table);
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
        title={editingId ? 'Edit Table' : 'New Table'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button form="table-form" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create table'}
            </button>
          </>
        }
      >
        <form id="table-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="t-number">Table number</label>
            <input
              id="t-number"
              className="input-field"
              value={form.tableNumber}
              onChange={(e) => setForm((f) => ({ ...f, tableNumber: e.target.value }))}
              placeholder="e.g. T-01"
            />
          </div>

          <div>
            <label className="label-field" htmlFor="t-floor">Floor</label>
            <select
              id="t-floor"
              className="input-field"
              value={form.floorId}
              onChange={(e) => setForm((f) => ({ ...f, floorId: e.target.value }))}
            >
              <option value="">Select a floor</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="t-seats">Seats</label>
              <input
                id="t-seats"
                type="number"
                min="1"
                className="input-field"
                value={form.seats}
                onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                placeholder="2"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="t-status">Status</label>
              <select
                id="t-status"
                className="input-field"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete table"
        message={deleteError || `Delete "${deleteTarget?.table_number}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
