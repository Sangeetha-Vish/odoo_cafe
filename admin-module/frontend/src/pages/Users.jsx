import React, { useState, useEffect } from 'react';
import { User, Key, Trash2, Archive, MoreVertical, Plus, CheckSquare, Square, Shield } from 'lucide-react';
import Modal from '../components/Modal';

const DEFAULT_USERS = [
  { id: 'usr_1', name: 'Admin User', email: 'admin@example.com', type: 'User', status: 'Active' },
  { id: 'usr_2', name: 'Chef Mario', email: 'mario@example.com', type: 'Employee', status: 'Active' },
  { id: 'usr_3', name: 'Cashier Sita', email: 'sita@example.com', type: 'Employee', status: 'Active' },
  { id: 'usr_4', name: 'Rohan Sharma', email: 'rohan@example.com', type: 'Employee', status: 'Disable' },
];

export default function Users() {
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem('admin_users');
    return stored ? JSON.parse(stored) : DEFAULT_USERS;
  });

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeKebabId, setActiveKebabId] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({ name: '', email: '', type: 'Employee', status: 'Active' });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    localStorage.setItem('admin_users', JSON.stringify(users));
  }, [users]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((u) => u.id));
    }
  }

  function handleSelectRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCreateUser(e) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) return;

    const newUser = {
      ...createForm,
      id: `usr_${Date.now()}`,
    };
    setUsers((prev) => [...prev, newUser]);
    setCreateModalOpen(false);
    setCreateForm({ name: '', email: '', type: 'Employee', status: 'Active' });
  }

  function handleChangePassword(e) {
    e.preventDefault();
    if (!newPassword.trim() || !targetUser) return;
    alert(`Password changed successfully for ${targetUser.name}!`);
    setPwdModalOpen(false);
    setNewPassword('');
    setTargetUser(null);
  }

  function updateType(id, type) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, type } : u))
    );
  }

  function updateStatus(id, status) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status } : u))
    );
  }

  function handleDelete(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setActiveKebabId(null);
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
    setSelectedIds([]);
  }

  return (
    <div className="space-y-6">
      {/* Top action controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search employees…"
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
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5"
        >
          <Plus size={16} />
          <span>New Employee</span>
        </button>
      </div>

      {/* Users table */}
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
              <th className="px-5 py-3.5 font-bold">Name</th>
              <th className="px-5 py-3.5 font-bold">Email</th>
              <th className="px-5 py-3.5 font-bold">Type</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/70 transition">
                <td className="px-5 py-4 text-center">
                  <button onClick={() => handleSelectRow(u.id)} className="text-slate-400 hover:text-slate-600 transition">
                    {selectedIds.includes(u.id) ? (
                      <CheckSquare size={18} className="text-indigo-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </td>
                <td className="px-5 py-4 font-bold text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shadow-inner">
                      <User size={16} />
                    </div>
                    <span>{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-500 font-medium">{u.email}</td>
                <td className="px-5 py-4">
                  <select
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={u.type}
                    onChange={(e) => updateType(u.id, e.target.value)}
                  >
                    <option value="User">User</option>
                    <option value="Employee">Employee</option>
                  </select>
                </td>
                <td className="px-5 py-4">
                  <select
                    className={`px-2 py-1.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      u.status === 'Active'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                    value={u.status}
                    onChange={(e) => updateStatus(u.id, e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Disable">Disable</option>
                  </select>
                </td>
                <td className="px-5 py-4 text-right relative">
                  <button
                    onClick={() => setActiveKebabId(activeKebabId === u.id ? null : u.id)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Kebab action menu dropdown */}
                  {activeKebabId === u.id && (
                    <div className="absolute right-5 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden text-left">
                      <button
                        onClick={() => {
                          setTargetUser(u);
                          setPwdModalOpen(true);
                          setActiveKebabId(null);
                        }}
                        className="w-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                      >
                        <Key size={14} />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={() => {
                          alert(`Archived ${u.name} successfully!`);
                          setActiveKebabId(null);
                        }}
                        className="w-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                      >
                        <Archive size={14} />
                        <span>Archive Employee</span>
                      </button>
                      <hr className="my-1 border-slate-100" />
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="w-full px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create New Employee Modal */}
      <Modal
        open={createModalOpen}
        title="Add New Employee"
        onClose={() => setCreateModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary font-bold text-xs" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button form="create-user-form" type="submit" className="btn-primary font-bold text-xs">
              Add Employee
            </button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
              placeholder="e.g. Rahul Verma"
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
              placeholder="e.g. rahul@example.com"
              value={createForm.email}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Type</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                value={createForm.type}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="User">User</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                value={createForm.status}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="Active">Active</option>
                <option value="Disable">Disable</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        open={pwdModalOpen}
        title={`Change Password for ${targetUser?.name}`}
        onClose={() => {
          setPwdModalOpen(false);
          setTargetUser(null);
        }}
        footer={
          <>
            <button
              className="btn-secondary font-bold text-xs"
              onClick={() => {
                setPwdModalOpen(false);
                setTargetUser(null);
              }}
            >
              Cancel
            </button>
            <button form="pwd-form" type="submit" className="btn-primary font-bold text-xs">
              Change Password
            </button>
          </>
        }
      >
        <form id="pwd-form" onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
              placeholder="Enter new strong password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
