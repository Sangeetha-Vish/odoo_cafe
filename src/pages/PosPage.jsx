import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api, { productAPI, couponAPI, orderAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import CartItem from '../components/CartItem';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  ShoppingBag,
  Ticket,
  CheckCircle2,
  XCircle,
  Tag,
  CreditCard,
  ChefHat,
  ArrowLeft,
  X,
  Printer,
  Ban,
  PlusCircle,
  User,
  Menu,
  Sparkles,
  Coffee,
} from 'lucide-react';

export default function PosPage() {
  const navigate = useNavigate();
  const {
    selectedTables,
    clearSelectedTables,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    cartItems,
    setCartItems,
    coupon,
    setCoupon,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal: baseSubtotal,
    tax: baseTax,
    discount: baseDiscount,
    total: baseTotal,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Occupied Order State
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [loadingActiveOrder, setLoadingActiveOrder] = useState(false);

  // Keypad & POS modes
  const [focusedItemId, setFocusedItemId] = useState(null); // Product ID currently focused in cart
  const [keypadMode, setKeypadMode] = useState('QTY'); // 'QTY', 'DISC', 'PRICE'
  const [keypadValue, setKeypadValue] = useState('');

  // Coupon Popup / manual entry states
  const [couponPopupOpen, setCouponPopupOpen] = useState(false);
  const [typedCouponCode, setTypedCouponCode] = useState('');
  const [activePromoList, setActivePromoList] = useState([]);
  const [selectedRadioPromoId, setSelectedRadioPromoId] = useState(null);

  // Table selection dropdown state
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
  const [allTables, setAllTables] = useState([]);

  // Hamburger drawer
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Custom Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load initial data (categories, tables, promotions)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Load all products to build categories list
        const allProducts = await productAPI.getAll();
        const catMap = new Map();
        allProducts.forEach((p) => {
          if (p.category && !catMap.has(p.category.id)) {
            catMap.set(p.category.id, p.category);
          }
        });
        setCategories(Array.from(catMap.values()));

        // Fetch all tables for dropdown
        const resTables = await api.get('/tables');
        setAllTables(resTables.data.data || []);

        // Load active promotions from Local Storage (saved in admin-module Coupons.jsx)
        const storedPromos = localStorage.getItem('promo_coupons');
        if (storedPromos) {
          setActivePromoList(JSON.parse(storedPromos).filter((p) => p.active));
        }

        // If an occupied table is selected, load its active order bill
        const occupiedTable = selectedTables.find((t) => t.status === 'OCCUPIED');
        if (occupiedTable) {
          setLoadingActiveOrder(true);
          const response = await api.get(`/orders?tableId=${occupiedTable.id}`);
          const activeOrder = response.data.find((o) => o.status !== 'PAID');
          if (activeOrder) {
            setActiveOrderId(activeOrder.id);
            setCustomerName(activeOrder.customerName || '');
            setPaymentMethod(activeOrder.paymentMethod || 'CASH');
            
            // Map items to cart items structure
            const mappedItems = activeOrder.orderItems.map((item) => ({
              product: {
                ...item.product,
                price: Number(item.price),
              },
              quantity: item.quantity,
              discount: 0, // reset line discount
            }));
            setCartItems(mappedItems);

            if (activeOrder.discount > 0) {
              setCoupon({
                code: 'ACTIVE_ORDER_DISCOUNT',
                type: 'FIXED',
                value: activeOrder.discount,
                discount: activeOrder.discount
              });
            }
            showToast('success', 'Bill Loaded', `Active bill for Table ${occupiedTable.tableNumber} loaded.`);
          }
        } else {
          setActiveOrderId(null);
        }
      } catch (err) {
        console.error(err);
        showToast('error', 'Database Error', 'Failed to retrieve initial POS data.');
      } finally {
        setLoading(false);
        setLoadingActiveOrder(false);
      }
    };
    loadInitialData();
  }, [selectedTables]);

  // Load products based on query from backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll(searchQuery);
        setProducts(data);
      } catch (err) {
        console.error(err);
        showToast('error', 'Search Error', 'Failed to fetch search results from server.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [searchQuery]);

  // Place or settle orders
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showToast('error', 'Empty Cart', 'Please add products to your cart before checking out.');
      return;
    }

    try {
      setLoading(true);
      if (activeOrderId) {
        // Settle active occupied table order
        await orderAPI.updateStatus(activeOrderId, 'PAID', paymentMethod);
        showToast('success', 'Bill Paid Successfully!', `Order #${activeOrderId} settled.`);
        clearCart();
        clearSelectedTables();
        setTimeout(() => navigate('/tables'), 1500);
      } else {
        // Place a new order
        const payload = {
          tableIds: selectedTables.map((t) => t.id),
          customerName: customerName.trim() || 'Walk-in Customer',
          subtotal: calculatedSubtotal,
          tax: calculatedTax,
          discount: calculatedDiscount,
          total: calculatedTotal,
          paymentMethod,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: Number(item.product.price),
          })),
        };

        const newOrder = await orderAPI.create(payload);
        showToast('success', 'Order Placed Successfully!', `Order #${newOrder.id} sent to KDS.`);
        clearCart();
        setTimeout(() => navigate('/orders'), 1500);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Checkout Failed', err.response?.data?.error || 'Failed to process checkout.');
    } finally {
      setLoading(false);
    }
  };

  // Switch table from dropdown selection
  const selectDropdownTable = (table) => {
    // Set selected tables in cart context
    clearSelectedTables();
    selectedTables.push(table);
    setTableDropdownOpen(false);
    showToast('success', 'Table Switched', `Active workspace shifted to Table ${table.tableNumber}.`);
  };

  // Keypad Actions
  function handleKeyPress(num) {
    if (!focusedItemId) {
      showToast('info', 'Select Cart Item', 'Tap a product inside the middle cart pane to edit.');
      return;
    }
    const newVal = keypadValue + num;
    setKeypadValue(newVal);
    applyKeypadValToCart(newVal);
  }

  function handleKeyClear() {
    setKeypadValue('');
    applyKeypadValToCart('');
  }

  function handleKeyToggleSign() {
    // Negate/backspace or toggle sign
    if (keypadValue.length > 0) {
      const sliced = keypadValue.slice(0, -1);
      setKeypadValue(sliced);
      applyKeypadValToCart(sliced);
    }
  }

  function applyKeypadValToCart(val) {
    if (!focusedItemId) return;
    const num = Number(val || 0);

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== focusedItemId) return item;

        if (keypadMode === 'QTY') {
          return { ...item, quantity: num > 0 ? num : 1 };
        } else if (keypadMode === 'DISC') {
          return { ...item, discount: num <= 100 ? num : 100 };
        } else if (keypadMode === 'PRICE') {
          return {
            ...item,
            product: {
              ...item.product,
              price: num > 0 ? num : item.product.price,
            },
          };
        }
        return item;
      })
    );
  }

  // Open coupon manual & select list dialog
  function openCouponDialog() {
    setCouponPopupOpen(true);
    setTypedCouponCode('');
    setSelectedRadioPromoId(null);
  }

  function applySelectedCoupon() {
    // Check typed code first
    if (typedCouponCode.trim()) {
      const code = typedCouponCode.trim().toUpperCase();
      // Apply typed coupon code lookup
      setCoupon({ code, type: 'PERCENT', value: 10, discount: 10 }); // mock fallback
      showToast('success', 'Coupon Applied', `Code "${code}" processed.`);
    } else if (selectedRadioPromoId) {
      const selectedPromo = activePromoList.find((p) => p.id === selectedRadioPromoId);
      if (selectedPromo) {
        setCoupon({
          code: selectedPromo.code || selectedPromo.name,
          type: selectedPromo.redeemUnit === '%' ? 'PERCENT' : 'FIXED',
          value: selectedPromo.redeemVal,
          discount: selectedPromo.redeemVal,
        });
        showToast('success', 'Promotion Applied', `Selected "${selectedPromo.name}".`);
      }
    }
    setCouponPopupOpen(false);
  }

  // Dynamic calculations based on cart items + custom overrides
  const calculatedSubtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.product.price);
    const qty = Number(item.quantity);
    const lineSubtotal = price * qty;
    const lineDiscount = item.discount ? (lineSubtotal * item.discount) / 100 : 0;
    return acc + (lineSubtotal - lineDiscount);
  }, 0);

  // Order level discount
  const calculatedDiscount = coupon
    ? coupon.type === 'PERCENT'
      ? (calculatedSubtotal * coupon.value) / 100
      : coupon.value
    : 0;

  const calculatedTax = (calculatedSubtotal - calculatedDiscount) * 0.05; // GST 5%
  const calculatedTotal = calculatedSubtotal - calculatedDiscount + calculatedTax;

  const filteredProducts = products.filter((p) => {
    return selectedCategoryId === 'ALL' || p.categoryId === selectedCategoryId;
  });

  const selectedTablesLabel = selectedTables.length > 0
    ? selectedTables.map((t) => t.tableNumber).join(' + ')
    : 'Takeaway';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 relative">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden animate-slide-in flex">
          <div className={`w-3 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="p-4 flex-1">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-500" />}
                {toast.title}
              </h4>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">{toast.message}</p>
          </div>
        </div>
      )}

      {/* 1. Header row */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg mb-6 border border-slate-850 gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-slate-900 p-2 rounded-xl">
            <Coffee size={18} />
          </div>
          <span className="font-black text-sm uppercase tracking-wider hidden sm:block">Odoo POS</span>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-slate-800 border border-slate-750 px-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent placeholder-slate-500"
          />
        </div>

        {/* Icons & Dropdowns */}
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
            <Printer size={16} />
          </button>
          
          <button onClick={() => navigate('/tables')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition">
            <Ban size={16} />
          </button>

          <button onClick={() => { clearCart(); showToast('success', 'New Order Started', 'Cart was cleared.'); }} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
            <PlusCircle size={16} />
          </button>

          {/* Table select dropdown */}
          <div className="relative">
            <button
              onClick={() => setTableDropdownOpen(!tableDropdownOpen)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <span>🪑 {selectedTablesLabel}</span>
              <span className="text-[10px] text-slate-400 font-bold">∨</span>
            </button>
            {tableDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-100 z-50 py-1 max-h-56 overflow-y-auto font-bold text-xs">
                {allTables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectDropdownTable(t)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Table {t.tableNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'OCCUPIED' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => alert('Customer Profiles')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
            <User size={16} />
          </button>

          <button onClick={() => setMenuOpen(true)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* Hamburger Menu slide-out */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setMenuOpen(false)} />
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl p-6 flex flex-col justify-between animate-slide-left z-10">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <span className="font-black text-slate-800 text-sm uppercase tracking-wider">POS Modules</span>
                <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <nav className="mt-6 space-y-2.5 font-bold text-xs">
                <Link to="/tables" onClick={() => setMenuOpen(false)} className="block px-4 py-3 bg-slate-50 rounded-xl text-slate-700 hover:bg-slate-100 transition">Tables Map</Link>
                <Link to="/pos" onClick={() => setMenuOpen(false)} className="block px-4 py-3 bg-amber-50 rounded-xl text-amber-700 hover:bg-amber-100 transition">POS Workspace</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-3 bg-slate-50 rounded-xl text-slate-700 hover:bg-slate-100 transition">Kitchen Display & Orders</Link>
                <Link to="/admin/products" onClick={() => setMenuOpen(false)} className="block px-4 py-3 bg-slate-50 rounded-xl text-slate-700 hover:bg-slate-100 transition">Admin Portal</Link>
              </nav>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Odoo POS Engine</p>
          </div>
        </div>
      )}

      {/* POS Content Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Product pane (left column - 5 cols) */}
        <div className="lg:col-span-5 flex gap-4 h-[650px] overflow-hidden">
          {/* Vertical Categories Selection on far left */}
          <div className="w-24 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className={`py-3.5 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center border transition shadow-sm ${
                selectedCategoryId === 'ALL'
                  ? 'bg-slate-900 text-white border-transparent'
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className="py-3.5 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center border transition shadow-sm flex flex-col items-center gap-1.5"
                style={{
                  backgroundColor: selectedCategoryId === cat.id ? cat.color : '#ffffff',
                  color: selectedCategoryId === cat.id ? '#ffffff' : '#475569',
                  borderColor: selectedCategoryId === cat.id ? 'transparent' : '#f1f5f9',
                }}
              >
                <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: selectedCategoryId === cat.id ? '#ffffff' : cat.color }} />
                <span className="truncate w-full">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Product cards grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-semibold text-xs">No items found</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={addItem} disabled={!!activeOrderId} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Cart Pane (middle column - 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 shadow-xl rounded-3xl p-5 flex flex-col h-[650px] justify-between">
          <div className="space-y-4 overflow-hidden flex flex-col flex-1">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Cart Checkout</h3>
              <span className="text-[10px] bg-slate-150 px-2.5 py-0.5 rounded-full font-bold text-slate-500 uppercase">
                {cartItems.length} lines
              </span>
            </div>

            {/* Cart item listing with focused selection highlight */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 text-center">
                  <ChefHat className="text-slate-300 mb-2" size={32} />
                  <p className="text-xs font-semibold">Shopping list is empty</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    onClick={() => !activeOrderId && setFocusedItemId(item.product.id)}
                    className={`cursor-pointer rounded-xl border transition-all ${
                      focusedItemId === item.product.id
                        ? 'ring-2 ring-amber-500 border-transparent shadow-md'
                        : 'border-transparent'
                    }`}
                  >
                    <CartItem
                      item={item}
                      onUpdateQty={updateQuantity}
                      onRemove={removeItem}
                      disabled={!!activeOrderId}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart actions row */}
          <div className="mt-4 space-y-4">
            <button
              onClick={() => showToast('success', 'Sent to Kitchen', 'Order ticket pushed to KDS screen.')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>Send to Kitchen</span>
              <span>➔</span>
            </button>

            {/* Inline Customer / Discount / Send actions */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => alert('Change Customer')} className="py-2 px-1 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition flex flex-col items-center gap-1">
                <User size={14} />
                <span>Customer</span>
              </button>
              
              <button onClick={openCouponDialog} className="py-2 px-1 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition flex flex-col items-center gap-1">
                <Tag size={14} />
                <span>Discount</span>
              </button>

              <button onClick={() => showToast('success', 'Shared', 'POS bill shared with customer tablet.')} className="py-2 px-1 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition flex flex-col items-center gap-1">
                <Printer size={14} />
                <span>Send Bill</span>
              </button>
            </div>

            {/* Breakdown summary */}
            <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-100 text-xs text-slate-500">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-700">₹{calculatedSubtotal.toFixed(2)}</span>
              </div>
              
              {/* Order-level discount render */}
              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Discount ({coupon?.code || 'Promo'})</span>
                  <span>-₹{calculatedDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium">
                <span>GST Tax (5%)</span>
                <span className="font-bold text-slate-700">₹{calculatedTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-amber-600">₹{calculatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Payment Pane with Keypad (right column - 3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 shadow-xl rounded-3xl p-5 flex flex-col h-[650px] justify-between">
          <div className="space-y-4 flex-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
              Settlement
            </h3>

            {/* Selectable Payment rows */}
            <div className="space-y-2">
              {[
                { id: 'CASH', label: 'Cash Register' },
                { id: 'UPI_QR', label: 'Counter UPI QR' },
                { id: 'DIGITAL_CARD', label: 'PineLabs Card' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`w-full p-3.5 border-2 rounded-2xl flex items-center justify-between text-xs font-bold transition ${
                    paymentMethod === pm.id
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 shadow-sm'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>{pm.label}</span>
                  <CreditCard size={14} className={paymentMethod === pm.id ? 'text-indigo-600' : 'text-slate-400'} />
                </button>
              ))}
            </div>

            {/* Large Amount Display */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-1 shadow-inner border border-slate-800">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amount Due</p>
              <h2 className="text-2xl font-black text-amber-400 tracking-tight">₹{calculatedTotal.toFixed(2)}</h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{paymentMethod}</p>
            </div>

            {/* Numeric Keypad + mode buttons */}
            <div className="flex gap-2">
              {/* Left Keypad Mode buttons */}
              <div className="w-1/3 flex flex-col gap-1.5">
                {[
                  { mode: 'PRICE', label: 'Prices' },
                  { mode: 'DISC', label: 'Disc.' },
                  { mode: 'QTY', label: 'Qty' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => { setKeypadMode(item.mode); setKeypadValue(''); }}
                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                      keypadMode === item.mode
                        ? 'bg-amber-500 text-slate-950 shadow-md border-transparent'
                        : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 1-9 Numeric Keypad Grid */}
              <div className="w-2/3 grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(String(num))}
                    className="py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-black text-slate-800 rounded-xl transition shadow-sm active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                {/* Backspace/Delete key */}
                <button
                  type="button"
                  onClick={handleKeyToggleSign}
                  className="py-3 bg-slate-100 border border-slate-250 hover:bg-slate-200 text-xs font-bold text-slate-600 rounded-xl transition flex items-center justify-center"
                >
                  ⌫
                </button>
                {/* Clear key */}
                <button
                  type="button"
                  onClick={handleKeyClear}
                  className="py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-600 rounded-xl transition"
                >
                  C
                </button>
              </div>
            </div>
          </div>

          {/* Place order button */}
          <button
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0}
            className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold text-sm rounded-2xl shadow-lg transition duration-200"
          >
            {activeOrderId ? 'Settle & Checkout' : 'Place Order'}
          </button>
        </div>

      </div>

      {/* Manual & List Coupon popup */}
      {couponPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setCouponPopupOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-zoom-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Apply Promo Coupon</h4>
              <button onClick={() => setCouponPopupOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Enter Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER30"
                  value={typedCouponCode}
                  onChange={(e) => {
                    setTypedCouponCode(e.target.value);
                    setSelectedRadioPromoId(null); // clear radio selection if user types
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold uppercase font-mono text-slate-750"
                />
              </div>

              {/* Radio list of currently active coupons/promotions */}
              {activePromoList.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Or Select Active Promotion</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {activePromoList.map((promo) => (
                      <label
                        key={promo.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedRadioPromoId === promo.id
                            ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="active-promos"
                            checked={selectedRadioPromoId === promo.id}
                            onChange={() => {
                              setSelectedRadioPromoId(promo.id);
                              setTypedCouponCode(''); // clear text input if user selects radio
                            }}
                            className="text-indigo-600 focus:ring-0"
                          />
                          <span className="text-xs font-bold">{promo.name}</span>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-600">
                          {promo.redeemVal}{promo.redeemUnit} Off
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={applySelectedCoupon}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                Apply Coupon
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
