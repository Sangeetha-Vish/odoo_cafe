import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { tableAPI, waitlistAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import SearchBar from '../components/SearchBar';
import TableCard from '../components/TableCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import {
  Armchair,
  AlertCircle,
  Plus,
  Users,
  Grid,
  UsersRound,
  Merge,
  Sparkles,
  UserPlus,
  Layers,
  ChevronDown,
  RefreshCw,
  X,
} from 'lucide-react';

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
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

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
      setTablesError('Could not retrieve restaurant layout. Please verify your backend connection.');
    } finally {
      setTablesLoading(false);
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5002');
    socket.on('tables-updated', () => fetchData());
    socket.on('order-created', () => fetchData());
    return () => socket.disconnect();
  }, []);

  const handleSelectTable = (table) => {
    if (isMergeMode) {
      if (table.status === 'OCCUPIED') {
        setErrorModal({ isOpen: true, message: 'Cannot merge an occupied table. Only select FREE tables for merging.' });
        return;
      }
      toggleTableSelection(table);
    } else {
      if (table.status === 'OCCUPIED') {
        setErrorModal({ isOpen: true, message: 'This table is already occupied. Free it up first or select another.' });
        return;
      }
      setSelectedTables([table]);
      navigate('/pos');
    }
  };

  const handleConfirmMerge = () => {
    if (selectedTables.length < 2) {
      setErrorModal({ isOpen: true, message: 'Please select at least 2 tables to merge them for a large group.' });
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
      setErrorModal({ isOpen: true, message: 'Failed to add customer to queue. Please try again.' });
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
      setErrorModal({ isOpen: true, message: 'Failed to seat customer. Please try again.' });
    } finally {
      setTablesLoading(false);
    }
  };

  // Derived floors — sorted naturally
  const floors = Array.from(new Set(tables.map((t) => t.floor || 'Unknown'))).sort();
  const floorTabs = ['ALL', ...floors];

  // Filter tables by search
  const searchFiltered = tables.filter((table) =>
    table.tableNumber.toLowerCase().includes(search.toLowerCase())
  );

  // Tables to display per floor
  const getTablesForFloor = (floor) =>
    searchFiltered.filter((t) => floor === 'ALL' || (t.floor || 'Unknown') === floor);

  // For "ALL" mode — group by floor
  const floorsToRender = selectedFloor === 'ALL' ? floors : [selectedFloor];

  const freeTables = tables.filter((t) => t.status === 'FREE');

  // Summary stats
  const totalFree = tables.filter((t) => t.status === 'FREE').length;
  const totalOccupied = tables.filter((t) => t.status === 'OCCUPIED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ── Error Modal Overlay ── */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in border border-slate-100 text-center">
            <h3 className="text-xl font-bold text-rose-600 mb-2">Action Rejected</h3>
            <p className="text-slate-600 text-sm mb-6">{errorModal.message}</p>
            <button onClick={() => setErrorModal({ isOpen: false, message: '' })} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Seating Modal Overlay ── */}
      {seatingEntry && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in border border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Seat Waiting Guest</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Assign tables for{' '}
                  <strong className="text-slate-700">{seatingEntry.customerName}</strong>{' '}
                  <span className="text-amber-600 font-bold">(Party of {seatingEntry.groupSize})</span>
                </p>
              </div>
              <button
                onClick={() => { setSeatingEntry(null); setSelectedSeatTableIds([]); }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition"
              >
                <X size={16} />
              </button>
            </div>

            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Select Free Tables to Occupy:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto mb-6 pr-1">
              {freeTables.length === 0 ? (
                <span className="text-xs text-rose-500 font-semibold col-span-2 text-center py-4">
                  No free tables available. Wait for an order to complete.
                </span>
              ) : (
                freeTables.map((t) => {
                  const isChecked = selectedSeatTableIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedSeatTableIds((prev) =>
                          isChecked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                        );
                      }}
                      className={`p-3 border-2 rounded-xl text-left transition text-xs font-bold ${isChecked
                          ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md'
                          : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      <div className="font-extrabold text-sm">{t.tableNumber}</div>
                      <div className="text-slate-400 font-normal mt-0.5">{t.seats} Seats &middot; {t.floor}</div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSeatingEntry(null); setSelectedSeatTableIds([]); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSeatCustomer}
                disabled={selectedSeatTableIds.length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                Seat Guest ({selectedSeatTableIds.length} table{selectedSeatTableIds.length !== 1 ? 's' : ''})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: Tables Map (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  <Layers size={22} className="text-amber-400" />
                  Tables Workspace
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Manage seating by floor &middot; merge tables for large groups &middot; waitlist queue
                </p>
              </div>

              {/* Stats chips */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
                  {totalFree} Free
                </span>
                <span className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold">
                  {totalOccupied} Occupied
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsMergeMode(!isMergeMode);
                  clearSelectedTables();
                }}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${isMergeMode
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                  }`}
              >
                <Merge size={14} />
                <span>{isMergeMode ? 'Cancel Merge Mode' : 'Merge Tables'}</span>
              </button>

              {isMergeMode && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold">
                    {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected
                  </span>
                  {selectedTables.length >= 2 && (
                    <button
                      onClick={handleConfirmMerge}
                      className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md transition transform hover:scale-[1.03]"
                    >
                      <span>Open POS → {selectedTables.map(t => t.tableNumber).join(' + ')}</span>
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={fetchData}
                disabled={tablesLoading}
                className="ml-auto flex items-center space-x-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition"
                title="Refresh table statuses"
              >
                <RefreshCw size={13} className={tablesLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Merge Mode Instruction Banner */}
          {isMergeMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs font-semibold text-amber-800 flex items-center gap-2 animate-fade-up">
              <Merge size={14} className="text-amber-500 flex-shrink-0" />
              <span>
                <strong>Merge Mode ON:</strong> Click any free tables to add them to the merged group. Select at least 2 tables, then click &quot;Open POS&quot; to proceed.
              </span>
            </div>
          )}

          {/* Search & Floor Filters */}
          <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin flex-shrink-0">
              {floorTabs.map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${selectedFloor === floor
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                >
                  {floor === 'ALL' ? (
                    <>
                      <Grid size={12} />
                      All Floors
                    </>
                  ) : (
                    <>
                      <Layers size={12} />
                      {floor}
                    </>
                  )}
                </button>
              ))}
            </div>
            <div className="w-full md:w-60 flex-shrink-0">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search table number..."
              />
            </div>
          </div>

          {/* Tables Map — grouped by floor */}
          {tablesLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : tablesError ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-rose-200 p-8">
              <AlertCircle className="mx-auto text-rose-500 mb-3" size={36} />
              <p className="text-sm font-bold text-slate-700 mb-1">Connection Error</p>
              <p className="text-xs text-slate-500 mb-4">{tablesError}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {floorsToRender.map((floor) => {
                const floorTables = getTablesForFloor(floor);
                if (floorTables.length === 0) {
                  return (
                    <div key={floor} className="text-center py-6 text-slate-400 text-xs font-semibold bg-white border border-dashed border-slate-200 rounded-2xl">
                      No tables matching your search on {floor}.
                    </div>
                  );
                }
                return (
                  <div key={floor} className="space-y-4 animate-fade-up">
                    {/* Floor Section Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm">
                        <Layers size={13} className="text-amber-400" />
                        {floor}
                      </div>
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-xs font-semibold text-slate-400">
                        {floorTables.filter(t => t.status === 'FREE').length} free / {floorTables.length} total
                      </span>
                    </div>

                    {/* Table Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {floorTables.map((table) => {
                        const isSelected = selectedTables.some((t) => t.id === table.id);
                        return (
                          <div
                            key={table.id}
                            className={`relative transition-all duration-200 ${isSelected
                                ? 'ring-4 ring-amber-500 rounded-2xl scale-[0.97]'
                                : ''
                              } ${isMergeMode && table.status === 'FREE'
                                ? 'hover:ring-2 hover:ring-amber-300 rounded-2xl'
                                : ''
                              }`}
                          >
                            <TableCard table={table} onSelect={handleSelectTable} />
                            {/* Floor badge overlay */}
                            <div className="absolute bottom-3 left-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {table.floor}
                            </div>
                            {/* Merge selection indicator */}
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white font-black text-[10px]">
                                  {selectedTables.findIndex((t) => t.id === table.id) + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Empty state when search yields nothing on all floors */}
              {floorsToRender.every((f) => getTablesForFloor(f).length === 0) && (
                <EmptyState title="No Tables Found" description="Try adjusting your search query." />
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Waitlist Queue Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">

          {/* Waitlist Panel */}
          <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <UsersRound size={20} className="text-amber-500" />
                <span>Waitlist Queue</span>
              </h2>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                {waitlist.length} waiting
              </span>
            </div>

            {/* Add to Queue Form */}
            <form onSubmit={handleAddWaitlist} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <UserPlus size={14} className="text-amber-500" />
                <span>Add to Waiting Queue</span>
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  placeholder="Guest Name"
                  className="col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs font-semibold text-slate-700"
                  required
                />
                <select
                  value={wSize}
                  onChange={(e) => setWSize(e.target.value)}
                  className="px-2 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold text-slate-700"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={waitlistLoading || !wName.trim()}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow"
              >
                <Plus size={14} />
                <span>Join Queue</span>
              </button>
            </form>

            {/* Queue List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {waitlistLoading && waitlist.length === 0 ? (
                <div className="py-10 text-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : waitlist.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles className="mx-auto text-slate-300 mb-2" size={24} />
                  <p className="text-xs font-bold text-slate-500">No Active Waitlist</p>
                  <p className="text-[10px] text-slate-400 mt-1">Add walk-ins when tables are full.</p>
                </div>
              ) : (
                waitlist.map((wait, idx) => (
                  <div
                    key={wait.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition animate-fade-up"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[10px] flex items-center justify-center border border-amber-200 flex-shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs truncate max-w-[100px]">
                          {wait.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Users size={9} />
                          {wait.groupSize} {wait.groupSize === 1 ? 'Person' : 'People'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSeatingEntry(wait);
                        setSelectedSeatTableIds([]);
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition flex-shrink-0"
                    >
                      Seat ›
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Legend Panel */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Table Status Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>Free — available for new orders</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-rose-400 flex-shrink-0" />
                <span>Occupied — active order in progress</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
                <span>Selected — chosen for merge</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
              Tip: Use <strong>Merge Tables</strong> mode to seat a large group across multiple tables simultaneously.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
