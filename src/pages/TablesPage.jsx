import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableAPI, waitlistAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import SearchBar from '../components/SearchBar';
import TableCard from '../components/TableCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  Layers,
  AlertCircle,
  Plus,
  Users,
  Grid,
  UsersRound,
  Merge,
  Sparkles,
  UserPlus,
  RefreshCw,
  X,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';

const DEFAULT_CUSTOMERS = [
  { id: 'cust_1', name: 'John Doe', email: 'john@gmail.com', phone: '+91 9876543210' },
  { id: 'cust_2', name: 'Alice Smith', email: 'alice@yahoo.com', phone: '+91 8765432109' },
  { id: 'cust_3', name: 'Rohan Sharma', email: 'rohan@outlook.com', phone: '+91 7654321098' },
];

export default function TablesPage() {
  const navigate = useNavigate();
  const { selectedTables, setSelectedTables, toggleTableSelection, clearSelectedTables } = useCart();

  // Tables state
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('ALL');

  // Merge Mode state
  const [isMergeMode, setIsMergeMode] = useState(false);

  // Waitlist state
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [wName, setWName] = useState('');
  const [wSize, setWSize] = useState('2');

  // Seating Modal state
  const [seatingEntry, setSeatingEntry] = useState(null);
  const [selectedSeatTableIds, setSelectedSeatTableIds] = useState([]);

  // Customer Section state
  const [customers, setCustomers] = useState(() => {
    const stored = localStorage.getItem('pos_customers');
    return stored ? JSON.parse(stored) : DEFAULT_CUSTOMERS;
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Customer Form edit states
  const [custForm, setCustForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    localStorage.setItem('pos_customers', JSON.stringify(customers));
  }, [customers]);

  const fetchData = async () => {
    try {
      setTablesLoading(true);
      setTablesError(null);

      const tablesData = await tableAPI.getAll();
      setTables(tablesData);

      setWaitlistLoading(true);
      const queue = await waitlistAPI.getQueue();
      setWaitlist(queue);
    } catch (err) {
      console.error(err);
      setTablesError('Could not retrieve restaurant layout. Please verify your connection.');
    } finally {
      setTablesLoading(false);
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [selectedOccupiedTable, setSelectedOccupiedTable] = useState(null);

  const handleSelectTable = (table) => {
    if (isMergeMode) {
      if (table.status === 'OCCUPIED') {
        alert('Cannot merge an occupied table. Only select FREE tables for merging.');
        return;
      }
      toggleTableSelection(table);
    } else {
      if (table.status === 'OCCUPIED') {
        setSelectedOccupiedTable(table);
      } else {
        setSelectedTables([table]);
        navigate('/pos');
      }
    }
  };

  const handleReleaseTable = async () => {
    if (!selectedOccupiedTable) return;
    try {
      setTablesLoading(true);
      await tableAPI.updateStatus(selectedOccupiedTable.id, 'FREE');
      setSelectedOccupiedTable(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to release table.');
    } finally {
      setTablesLoading(false);
    }
  };

  const handleConfirmMerge = () => {
    if (selectedTables.length < 2) {
      alert('Please select at least 2 tables to merge them.');
      return;
    }
    navigate('/pos');
  };

  const handleAddWaitlist = async (e) => {
    e.preventDefault();
    if (!wName.trim()) return;

    try {
      setWaitlistLoading(true);
      await waitlistAPI.join(wName.trim(), parseInt(wSize));
      setWName('');
      setWSize('2');
      const queue = await waitlistAPI.getQueue();
      setWaitlist(queue);
    } catch (err) {
      console.error(err);
      alert('Failed to join waitlist queue.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleSeatCustomer = async () => {
    if (selectedSeatTableIds.length === 0 || !seatingEntry) return;

    try {
      setTablesLoading(true);
      await waitlistAPI.seat(seatingEntry.id, selectedSeatTableIds);
      setSeatingEntry(null);
      setSelectedSeatTableIds([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to seat customer.');
    } finally {
      setTablesLoading(false);
    }
  };

  // Customer Handlers
  function openEditCustomer(customer) {
    setEditingCustomer(customer);
    setCustForm({ name: customer.name, email: customer.email, phone: customer.phone });
    setActiveMenuId(null);
  }

  function handleSaveCustomer(e) {
    e.preventDefault();
    setCustomers((prev) =>
      prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...custForm } : c))
    );
    setEditingCustomer(null);
  }

  function handleDeleteCustomer() {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    setCustomers((prev) => prev.filter((c) => c.id !== editingCustomer.id));
    setEditingCustomer(null);
  }

  // Derived layout calculations
  const floors = Array.from(new Set(tables.map((t) => t.floor))).sort();
  const floorTabs = ['ALL', ...floors];
  const searchFiltered = tables.filter((table) =>
    table.tableNumber.toLowerCase().includes(search.toLowerCase())
  );
  const getTablesForFloor = (floor) =>
    searchFiltered.filter((t) => floor === 'ALL' || t.floor === floor);
  const floorsToRender = selectedFloor === 'ALL' ? floors : [selectedFloor];
  const freeTables = tables.filter((t) => t.status === 'FREE');

  // Customer filtration
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      
      {/* ── Occupied Table Actions Modal ── */}
      {selectedOccupiedTable && (
        <div 
          onClick={() => setSelectedOccupiedTable(null)}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-zoom-in"
          >
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Occupied Table Options</h3>
              <p className="text-xs text-slate-500 mt-1">
                Table <strong>{selectedOccupiedTable.tableNumber}</strong> is currently active.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedTables([selectedOccupiedTable]);
                  setSelectedOccupiedTable(null);
                  navigate('/pos');
                }}
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                Go to POS Workspace
              </button>
              
              <button
                type="button"
                onClick={handleReleaseTable}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-xs rounded-xl transition"
              >
                Mark Table as FREE (Release Session)
              </button>

              <button
                type="button"
                onClick={() => setSelectedOccupiedTable(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Waitlist Seating Modal ── */}
      {seatingEntry && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Seat Waiting Guest</h3>
                <p className="text-slate-550 text-xs mt-1">
                  Assign tables for <strong>{seatingEntry.customerName}</strong>
                </p>
              </div>
              <button
                onClick={() => { setSeatingEntry(null); setSelectedSeatTableIds([]); }}
                className="p-2 bg-slate-150 hover:bg-slate-200 rounded-xl text-slate-500 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto mb-6 pr-1">
              {freeTables.map((t) => {
                const isChecked = selectedSeatTableIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedSeatTableIds((prev) =>
                        isChecked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                      );
                    }}
                    className={`p-3 border-2 rounded-xl text-left transition text-xs font-bold ${
                      isChecked ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div>{t.tableNumber}</div>
                    <div className="text-slate-405 font-normal">{t.seats} Seats</div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setSeatingEntry(null); setSelectedSeatTableIds([]); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition">Cancel</button>
              <button onClick={handleSeatCustomer} disabled={selectedSeatTableIds.length === 0} className="flex-1 py-3 bg-indigo-650 text-white font-bold rounded-xl text-xs transition shadow">Seat Guest</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table view workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Tables (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
                <Grid size={22} className="text-amber-400" />
                Tables Map Workspace
              </h1>
              <p className="text-xs text-slate-450 mt-1">Manage dining layout sessions</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => { setIsMergeMode(!isMergeMode); clearSelectedTables(); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isMergeMode ? 'bg-rose-500 text-white' : 'bg-slate-800 hover:bg-slate-750 text-amber-400'
                }`}
              >
                <Merge size={14} />
                <span>{isMergeMode ? 'Cancel Merge' : 'Merge Tables'}</span>
              </button>
              {isMergeMode && selectedTables.length >= 2 && (
                <button onClick={handleConfirmMerge} className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow">
                  Merge POS ({selectedTables.length})
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex gap-1.5 overflow-x-auto">
              {floorTabs.map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedFloor === floor ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  {floor === 'ALL' ? 'All Floors' : floor}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-60">
              <SearchBar value={search} onChange={setSearch} placeholder="Search tables..." />
            </div>
          </div>

          <div className="space-y-6">
            {floorsToRender.map((floor) => {
              const floorTables = getTablesForFloor(floor);
              if (floorTables.length === 0) return null;
              return (
                <div key={floor} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-905 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200">
                      {floor}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {floorTables.map((table) => {
                      const isSelected = selectedTables.some((t) => t.id === table.id);
                      return (
                        <div key={table.id} className={isSelected ? 'ring-4 ring-amber-500 rounded-2xl' : ''}>
                          <TableCard table={table} onSelect={handleSelectTable} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Waitlist Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
            Waitlist Queue
          </h2>
          <form onSubmit={handleAddWaitlist} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <input
              type="text"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="Guest Name"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              required
            />
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
              Join Queue
            </button>
          </form>

          <div className="space-y-2">
            {waitlist.map((wait) => (
              <div key={wait.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="font-bold block">{wait.customerName}</span>
                  <span className="text-[10px] text-slate-400">Party of {wait.groupSize}</span>
                </div>
                <button onClick={() => setSeatingEntry(wait)} className="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg">
                  Seat
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Customer section at the bottom (Section 4) ── */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
              Customer Registry
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage customer directories and logs</p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search Name, Email, or Phone..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-700"
            />
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-left uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3 font-bold">Customer Name</th>
                <th className="px-5 py-3 font-bold">Email Address</th>
                <th className="px-5 py-3 font-bold">Phone Number</th>
                <th className="px-5 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{c.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{c.email || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono">{c.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-right relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenuId === c.id && (
                      <div className="absolute right-5 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1 w-24 text-left font-bold text-[11px]">
                        <button
                          onClick={() => openEditCustomer(c)}
                          className="w-full px-3 py-2 hover:bg-slate-50 text-slate-650 flex items-center gap-1.5"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Edit Popup Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setEditingCustomer(null)} />
          <form
            onSubmit={handleSaveCustomer}
            className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-zoom-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Edit Customer Account</h4>
              <button type="button" onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={custForm.name}
                  onChange={(e) => setCustForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={custForm.email}
                  onChange={(e) => setCustForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={custForm.phone}
                  onChange={(e) => setCustForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-150 flex flex-col gap-2.5">
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  Save
                </button>
              </div>

              {/* Separate red DELETE button at the bottom */}
              <button
                type="button"
                onClick={handleDeleteCustomer}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Delete Account</span>
              </button>
            </div>
          </form>
        </div>
      )}
      
    </div>
  );
}
