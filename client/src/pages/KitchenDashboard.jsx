import React, { useState, useEffect, useMemo, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import KitchenOrderCard from '../components/KitchenOrderCard';

const API_BASE = '/api';
const SOCKET_BASE = window.location.origin;

const STAGE_TABS = [
  { id: 'TO_COOK', label: 'To Cook' },
  { id: 'PREPARING', label: 'Preparing' },
  { id: 'COMPLETED', label: 'Completed Archive' },
];

function getItemCategoryId(item) {
  return String(item.product?.categoryId ?? item.product?.category_id ?? '');
}

/** Live stages only surface items still being worked; archive shows everything. */
function isItemRelevantForStage(item, stage) {
  if (stage === 'COMPLETED') return true;
  if (stage === 'PREPARING') return !item.completed;
  return true;
}

function orderHasRelevantItem(order, predicate, stage) {
  return order.items.some((item) => isItemRelevantForStage(item, stage) && predicate(item));
}

export default function PremiumKitchenDashboard() {
  const [allCachedOrders, setAllCachedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('TO_COOK');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [socketConnected, setSocketConnected] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [loading, setLoading] = useState(false);

  const isArchiveView = activeTab === 'COMPLETED';

  /** Orders fetched for the currently selected stage only (To Cook / Preparing / Archive). */
  const stageOrders = allCachedOrders;

  const fetchOrdersSync = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/kitchen/orders?status=${activeTab}`);

      const normalized = res.data.map((order) => ({
        ...order,
        notes: order.notes?.trim() || null,
        customer_name: order.customer_name || order.customerName || 'Guest',
        table_id: order.table_id || order.tables?.[0]?.tableNumber || order.tables?.[0]?.id || 'N/A',
        created_at: order.created_at || order.createdAt,
        items: (order.items || order.orderItems || order.order_items || order.OrderItems || []).map(
          (item) => ({
            ...item,
            completed: isArchiveView ? true : item.completed,
            product: item.product
              ? {
                  ...item.product,
                  categoryId: item.product.categoryId ?? item.product.category_id,
                  category_id: item.product.categoryId ?? item.product.category_id,
                  categoryName: item.product.categoryName ?? item.product.category?.name,
                }
              : item.product,
          })
        ),
      }));

      const sorted = isArchiveView
        ? normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        : normalized.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setAllCachedOrders(sorted);
    } catch (err) {
      console.error('KDS sync fault connecting to backend server:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isArchiveView]);

  useEffect(() => {
    fetchOrdersSync();
  }, [fetchOrdersSync]);

  useEffect(() => {
    const socket = io(SOCKET_BASE);
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('order-created', fetchOrdersSync);
    socket.on('order-status-updated', fetchOrdersSync);
    socket.on('item-status-toggled', fetchOrdersSync);
    return () => socket.disconnect();
  }, [fetchOrdersSync]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return stageOrders.filter((order) => {
      const matchesSearch =
        !query ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.id.toString().includes(query) ||
        order.table_id?.toString().toLowerCase().includes(query);

      const matchesProduct =
        selectedProductFilter === 'ALL' ||
        orderHasRelevantItem(
          order,
          (item) => item.product?.name === selectedProductFilter,
          activeTab
        );

      const matchesCategory =
        selectedCategoryFilter === 'ALL' ||
        orderHasRelevantItem(
          order,
          (item) => getItemCategoryId(item) === String(selectedCategoryFilter),
          activeTab
        );

      return matchesSearch && matchesProduct && matchesCategory;
    });
  }, [stageOrders, searchQuery, selectedProductFilter, selectedCategoryFilter, activeTab]);

  /** Sidebar options derived exclusively from the active stage queue. */
  const stageFilterOptions = useMemo(() => {
    const products = new Set();
    const categories = new Map();

    stageOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!isItemRelevantForStage(item, activeTab)) return;
        if (item.product?.name) products.add(item.product.name);
        const id = getItemCategoryId(item);
        if (id) {
          categories.set(id, item.product?.categoryName || `Category ${id}`);
        }
      });
    });

    return {
      products: ['ALL', ...Array.from(products).sort()],
      categories: [
        { id: 'ALL', name: 'All Categories' },
        ...Array.from(categories.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      ],
    };
  }, [stageOrders, activeTab]);

  const uniqueProductsForFilter = stageFilterOptions.products;
  const uniqueCategoriesForFilter = stageFilterOptions.categories;

  useEffect(() => {
    if (
      selectedProductFilter !== 'ALL' &&
      !uniqueProductsForFilter.includes(selectedProductFilter)
    ) {
      setSelectedProductFilter('ALL');
    }
    if (
      selectedCategoryFilter !== 'ALL' &&
      !uniqueCategoriesForFilter.some((c) => c.id === selectedCategoryFilter)
    ) {
      setSelectedCategoryFilter('ALL');
    }
  }, [uniqueProductsForFilter, uniqueCategoriesForFilter, selectedProductFilter, selectedCategoryFilter]);

  const macroSummary = useMemo(() => {
    const counts = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!isItemRelevantForStage(item, activeTab)) return;
        const name = item.product?.name || 'Café Item';
        counts[name] = (counts[name] || 0) + item.quantity;
      });
    });

    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredOrders, activeTab]);

  const handleStageChange = (stageId) => {
    setActiveTab(stageId);
    setSelectedProductFilter('ALL');
    setSelectedCategoryFilter('ALL');
  };

  const handleClearFilters = () => {
    setSelectedProductFilter('ALL');
    setSelectedCategoryFilter('ALL');
    setSearchQuery('');
  };

  const handleMacroStrikeClick = async (productName) => {
    if (isArchiveView) return;

    const updatedOrders = allCachedOrders.map((order) => {
      const updatedItems = order.items.map((item) => {
        if (item.product?.name === productName) {
          return { ...item, completed: true };
        }
        return item;
      });
      return { ...order, items: updatedItems };
    });

    setAllCachedOrders(updatedOrders);

    allCachedOrders.forEach((order) => {
      order.items.forEach(async (item) => {
        if (item.product?.name === productName && !item.completed) {
          try {
            await axios.patch(`${API_BASE}/items/${item.id}/toggle`, { currentStatus: false });
          } catch (err) {
            console.error('Background DB sync failed for item:', item.id, err);
          }
        }
      });
    });
  };

  const handleToggleItemStrike = async (order, itemId, currentCompleted) => {
    if (isArchiveView) return;

    setAllCachedOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        const updatedItems = o.items.map((i) =>
          i.id === itemId ? { ...i, completed: !currentCompleted } : i
        );
        let finalStatus = o.status;
        if (o.status === 'PREPARING' && !currentCompleted) {
          const hasUnfinished = updatedItems.some((i) => !i.completed);
          if (!hasUnfinished) finalStatus = 'COMPLETED';
        }
        return { ...o, status: finalStatus, items: updatedItems };
      })
    );

    try {
      await axios.patch(`${API_BASE}/items/${itemId}/toggle`, { currentStatus: currentCompleted });
      if (order.status === 'PREPARING' && !currentCompleted) {
        const remainingItems = order.items.filter((i) => i.id !== itemId && !i.completed);
        if (remainingItems.length === 0) {
          await axios.patch(`${API_BASE}/orders/${order.id}/status`, { status: 'COMPLETED' });
        }
      }
    } catch (err) {
      console.error('Failed to sync item status change:', err);
    }
  };

  const handleMoveOrderStage = async (orderId, currentStatus) => {
    if (isArchiveView) return;

    const nextStatusMap = { TO_COOK: 'PREPARING', PREPARING: 'COMPLETED' };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    setAllCachedOrders((prev) => prev.filter((o) => o.id !== orderId));

    try {
      await axios.patch(`${API_BASE}/orders/${orderId}/status`, { status: nextStatus });
    } catch (err) {
      fetchOrdersSync();
      setErrorModal({
        isOpen: true,
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'State progression rejected by backend server verification rules.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col">
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in border border-stone-100 text-center">
            <h3 className="text-xl font-bold text-rose-600 mb-2">Action Rejected</h3>
            <p className="text-stone-600 text-sm mb-6">{errorModal.message}</p>
            <button
              onClick={() => setErrorModal({ isOpen: false, message: '' })}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <header className="p-4 md:p-6 border-b border-stone-200/60 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-stone-900">Kitchen Workspace</h1>
            <span
              className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
            />
          </div>
          <p className="text-stone-500 text-xs">
            {isArchiveView
              ? 'Completed orders archive — search and filter historical tickets'
              : 'Real-time Live FIFO Stream Cache Dashboard'}
          </p>
        </div>
        <input
          type="text"
          placeholder={
            isArchiveView
              ? 'Search archive by Order #, name, or table...'
              : 'Filter by Order # or Name...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 bg-[#FDFBF7] border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400 shadow-sm"
        />
      </header>

      <div className="bg-white border-b border-stone-200 px-6 py-3 min-h-[52px] flex items-center overflow-x-auto gap-3 select-none">
        <span className="text-xs font-extrabold tracking-wider text-stone-400 mr-2 whitespace-nowrap">
          {isArchiveView ? 'ARCHIVE SUMMARY:' : 'PREP SUMMARY (CLICK TO COMPLETE):'}
        </span>
        {macroSummary.length === 0 ? (
          <span className="text-xs text-stone-400 italic">
            {isArchiveView ? 'No archived items match current filters.' : 'No items pending in this queue.'}
          </span>
        ) : (
          <div className="flex gap-2">
            {macroSummary.map((item, idx) =>
              isArchiveView ? (
                <span
                  key={idx}
                  className="bg-stone-100 text-stone-700 px-3 py-1 rounded-lg flex items-center gap-2 text-xs font-semibold border border-stone-200"
                >
                  <span className="text-stone-500 font-mono">{item.qty}x</span>
                  <span>{item.name}</span>
                </span>
              ) : (
                <button
                  key={idx}
                  onClick={() => handleMacroStrikeClick(item.name)}
                  className="bg-stone-900 text-[#FDFBF7] hover:bg-emerald-700 active:scale-95 transition-all px-3 py-1 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-sm group cursor-pointer"
                  title={`Click to mark all ${item.name} as complete across all tickets`}
                >
                  <span className="text-amber-400 group-hover:text-white font-mono">{item.qty}x</span>
                  <span>{item.name}</span>
                  <span className="text-[10px] text-stone-400 group-hover:text-emerald-200 border border-stone-700 group-hover:border-emerald-500 px-1 rounded">
                    ✓ Done
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col lg:flex-row min-h-0">
        <aside className="w-full lg:w-64 bg-white border-r border-stone-200 p-4 flex flex-col gap-6 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-widest font-bold text-stone-400">Sidebar Filters</h2>
            <button onClick={handleClearFilters} className="text-xs text-rose-600 font-semibold hover:underline">
              Clear All
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 block mb-2">Order Stage</label>
            <div className="flex flex-col gap-1.5">
              {STAGE_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleStageChange(id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex justify-between items-center ${
                    activeTab === id ? 'bg-stone-900 text-[#FDFBF7]' : 'hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  <span>{label}</span>
                  <span className="font-mono text-[10px] bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                    {activeTab === id ? filteredOrders.length : '•'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 block mb-0.5">Filter by Item</label>
            <p className="text-[10px] text-stone-400 mb-2">
              {isArchiveView ? 'Items in completed archive' : `Pending items in ${activeTab.replace('_', ' ').toLowerCase()} queue`}
            </p>
            <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1 border border-stone-100 rounded-lg p-1.5 bg-stone-50/50">
              {uniqueProductsForFilter.length <= 1 ? (
                <p className="text-[10px] text-stone-400 italic px-2 py-2">No items in this stage.</p>
              ) : (
                uniqueProductsForFilter.map((prodName) => (
                  <button
                    key={prodName}
                    type="button"
                    onClick={() => setSelectedProductFilter(prodName)}
                    className={`block w-full text-left px-2.5 py-2 rounded-md text-xs leading-snug shrink-0 ${
                      selectedProductFilter === prodName
                        ? 'bg-stone-800 text-white font-semibold'
                        : 'text-stone-700 hover:bg-white bg-transparent'
                    }`}
                  >
                    {prodName === 'ALL' ? 'All Items' : prodName}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 block mb-0.5">Filter by Category</label>
            <p className="text-[10px] text-stone-400 mb-2">
              {isArchiveView ? 'Categories in completed archive' : `Categories in ${activeTab.replace('_', ' ').toLowerCase()} queue`}
            </p>
            <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1 border border-stone-100 rounded-lg p-1.5 bg-stone-50/50">
              {uniqueCategoriesForFilter.length <= 1 ? (
                <p className="text-[10px] text-stone-400 italic px-2 py-2">No categories in this stage.</p>
              ) : (
                uniqueCategoriesForFilter.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`block w-full text-left px-2.5 py-2 rounded-md text-xs leading-snug shrink-0 ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-stone-800 text-white font-semibold'
                        : 'text-stone-700 hover:bg-white bg-transparent'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {!isArchiveView && (
            <div className="text-[10px] text-stone-400 leading-relaxed border-t border-stone-100 pt-3">
              Showing {filteredOrders.length} of {stageOrders.length} orders in{' '}
              {activeTab.replace('_', ' ').toLowerCase()} queue.
            </div>
          )}

          {isArchiveView && (
            <div className="text-[10px] text-stone-400 leading-relaxed border-t border-stone-100 pt-3">
              Showing {filteredOrders.length} of {stageOrders.length} archived orders (Completed & Paid).
            </div>
          )}
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-h-0">
          {loading ? (
            <div className="text-center py-24">
              <p className="text-stone-400 font-medium text-sm animate-pulse">Loading kitchen queue...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-stone-200 rounded-2xl bg-white/50">
              <p className="text-stone-400 font-medium text-sm">
                {isArchiveView
                  ? stageOrders.length === 0
                    ? 'No completed orders in the archive yet. Orders appear here after being marked ready.'
                    : 'No archived orders match the current search or filters.'
                  : stageOrders.length === 0
                    ? `No orders in the ${activeTab.replace('_', ' ').toLowerCase()} queue right now.`
                    : 'No orders in this queue match the current search or filters.'}
              </p>
              {(searchQuery || selectedProductFilter !== 'ALL' || selectedCategoryFilter !== 'ALL') && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-xs text-rose-600 font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-6">
              {filteredOrders.map((order, index) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  isArchived={isArchiveView}
                  onMoveStage={handleMoveOrderStage}
                  onToggleItem={handleToggleItemStrike}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
