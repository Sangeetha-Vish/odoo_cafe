import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Coffee, Search, ShoppingBag, Plus, Minus, Check, Tag, Clock, ArrowLeft, X, Smartphone, Wallet, QrCode } from 'lucide-react';
import api from '../api/axios';

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60',
];

export default function MobileSelfOrder() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Settings loaded from local storage
  const isEnabled = localStorage.getItem('self_order_enabled') !== 'false';
  const bgType = localStorage.getItem('self_order_bg_type') || 'COLOR';
  const bgColor = localStorage.getItem('self_order_bg_color') || '#FDF8F2';

  // Flow State: 'SPLASH' | 'BROWSE' | 'REVIEW' | 'PAYMENT' | 'CONFIRMED'
  const [screen, setScreen] = useState('SPLASH');
  
  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [table, setTable] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Customization Popup state
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [customNotesText, setCustomNotesText] = useState('');

  // Payment Selection state
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' or 'COUNTER'
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiTimer, setUpiTimer] = useState(300); // 5 minutes timer

  // Track status state
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('TO_COOK');

  // Auto-scroll simulation index
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (bgType === 'IMAGES') {
      const interval = setInterval(() => {
        setBgIndex((prev) => (prev + 1) % MOCK_IMAGES.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bgType]);

  // Load products & find table by token
  useEffect(() => {
    const loadData = async () => {
      try {
        const resProds = await api.get('/api/products');
        const prodData = resProds.data || [];
        setProducts(prodData);

        // Map categories dynamically
        const catMap = new Map();
        prodData.forEach((p) => {
          if (p.category && !catMap.has(p.category.id)) {
            catMap.set(p.category.id, p.category);
          }
        });
        setCategories(Array.from(catMap.values()));

        // Scan tables for matching token
        const resTables = await api.get('/api/tables');
        const list = resTables.data || [];
        const found = list.find((t) => `T${t.id}` === token);
        if (found) {
          setTable(found);
        } else {
          // Fallback parsing of token
          const parsedId = parseInt(token?.replace(/[^0-9]/g, ''));
          const foundById = list.find((t) => t.id === parsedId);
          if (foundById) {
            setTable(foundById);
          } else {
            setTable({ id: 1, tableNumber: 'Table ' + token, status: 'FREE' });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [token]);

  // Poll order status from the server
  useEffect(() => {
    if (!confirmedOrderId) return;

    const pollStatus = async () => {
      try {
        const res = await api.get(`/api/orders/${confirmedOrderId}`);
        if (res.data && res.data.status) {
          setOrderStatus(res.data.status);
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    };

    // Poll immediately
    pollStatus();

    const interval = setInterval(pollStatus, 4000);
    return () => clearInterval(interval);
  }, [confirmedOrderId]);

  // UPI Countdown Timer
  useEffect(() => {
    if (!showUpiModal) return;
    const interval = setInterval(() => {
      setUpiTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showUpiModal]);

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl max-w-sm w-full space-y-4">
          <X className="mx-auto text-rose-500" size={48} />
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Self-Ordering Disabled</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please ask the cafe manager to reactivate mobile table ordering in settings.
          </p>
        </div>
      </div>
    );
  }

  // Cart operations
  function addToCart(product) {
    setCustomizingProduct(product);
    setCustomNotesText('');
  }

  function handleSaveCustomizations() {
    const customizedProduct = {
      ...customizingProduct,
      customNote: customNotesText.trim(),
    };

    setCart((prev) => {
      // Find if item with same ID and note already exists
      const existsIdx = prev.findIndex(
        (item) => item.product.id === customizedProduct.id && item.product.customNote === customizedProduct.customNote
      );
      if (existsIdx > -1) {
        const newCart = [...prev];
        newCart[existsIdx].quantity += 1;
        return newCart;
      }
      return [...prev, { product: customizedProduct, quantity: 1 }];
    });

    setCustomizingProduct(null);
  }

  function updateQty(productId, customNote, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.product.customNote === customNote) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/api/coupons/validate', {
        code: couponCode,
        cartTotal: subtotal,
      });
      setCouponDiscount(res.data.discount);
      alert(`Coupon ${res.data.code} applied successfully! Discount: ₹${res.data.discount.toFixed(2)}`);
    } catch (err) {
      setCouponDiscount(0);
      alert(err.response?.data?.error || 'Invalid Promo Code');
    }
  }

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountVal = couponDiscount;
  const gst = (subtotal - discountVal) * 0.05;
  const total = subtotal - discountVal + gst;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCatId === 'ALL' || p.categoryId === selectedCatId;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOrderSubmission = async (pMethod, isPaid = false) => {
    try {
      // Append special notes to customer name to display on KDS without schema changes
      const notesString = cart
        .map((item) => (item.product.customNote ? `${item.product.name} (${item.product.customNote})` : ''))
        .filter(Boolean)
        .join(', ');

      const customerDetails = notesString
        ? `Self-Order - Table ${table?.tableNumber || token} [Notes: ${notesString}]`
        : `Self-Order - Table ${table?.tableNumber || token}`;

      // 1. Place the order
      const res = await api.post('/api/orders', {
        tableIds: table ? [table.id] : [],
        customerName: customerDetails,
        subtotal,
        tax: gst,
        discount: discountVal,
        total,
        paymentMethod: pMethod === 'UPI' ? 'UPI_QR' : 'CASH',
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      const orderId = res.data?.id;
      if (!orderId) throw new Error('Order creation failed');

      // 2. If paid online via UPI QR simulation, update status to PAID
      if (isPaid) {
        await api.put(`/api/orders/${orderId}/status`, {
          status: 'PAID',
          paymentMethod: 'UPI_QR',
        });
        setOrderStatus('PAID');
      } else {
        setOrderStatus('TO_COOK');
      }

      setConfirmedOrderId(orderId);
      setScreen('CONFIRMED');
      setCart([]);
      setShowUpiModal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to place order. Please call a waiter.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center py-4 px-2">
      <div className="w-full max-w-md bg-white min-h-[760px] rounded-[40px] shadow-2xl overflow-hidden flex flex-col justify-between border-[8px] border-slate-900 relative">
        
        {/* Status Bar notch simulation */}
        <div className="bg-slate-900 text-white text-[10px] px-8 py-1.5 flex justify-between items-center font-bold tracking-tight z-30">
          <span>9:41</span>
          <div className="h-4.5 w-24 bg-slate-900 rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2" />
          <span className="flex items-center gap-1">5G 🔋</span>
        </div>

        {/* SCREEN 1: SPLASH */}
        {screen === 'SPLASH' && (
          <div
            className="flex-1 flex flex-col justify-between p-8 text-center bg-cover bg-center relative transition-all duration-500"
            style={{
              backgroundImage: bgType === 'IMAGES' ? `url(${MOCK_IMAGES[bgIndex]})` : 'none',
              backgroundColor: bgType === 'COLOR' ? bgColor : '#0f172a',
            }}
          >
            {bgType === 'IMAGES' && <div className="absolute inset-0 bg-black/55 z-0" />}

            <div className="z-10 pt-16 space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/10">
                <Coffee size={36} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-wider">
                  Odoo Café
                </h1>
                <p className="text-xs font-bold text-amber-550 uppercase tracking-widest mt-1">
                  Table Order Portal
                </p>
              </div>
              {table && (
                <span className="inline-block px-4 py-1.5 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                  {table.tableNumber}
                </span>
              )}
            </div>

            <button
              onClick={() => setScreen('BROWSE')}
              className="z-10 py-4.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 transition duration-200"
            >
              Browse Menu & Order
            </button>
          </div>
        )}

        {/* SCREEN 2: BROWSE */}
        {screen === 'BROWSE' && (
          <div className="flex-1 flex flex-col h-full bg-slate-50 justify-between">
            {/* Header bar */}
            <div className="bg-white border-b border-slate-150/70 p-4 flex items-center justify-between sticky top-0 z-20">
              <button onClick={() => setScreen('SPLASH')} className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition">
                <ArrowLeft size={16} />
              </button>
              <div className="flex flex-col items-center">
                <span className="font-black text-xs text-slate-900 uppercase tracking-widest">Odoo Café</span>
                <span className="text-[10px] text-amber-600 font-bold uppercase">{table?.tableNumber || 'Menu'}</span>
              </div>
              <button
                onClick={() => cart.length > 0 && setScreen('REVIEW')}
                className="relative p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-md transition active:scale-95"
              >
                <ShoppingBag size={16} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center border border-white">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Search & Categories */}
            <div className="p-4 bg-white border-b border-slate-100 space-y-3.5">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search food, coffee, drinks..."
                  className="w-full bg-slate-50 border border-slate-150 px-4 py-3 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                />
                <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCatId('ALL')}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition shrink-0 ${
                    selectedCatId === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  All Items
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCatId(c.id)}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition shrink-0 ${
                      selectedCatId === c.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {filteredProducts.map((p) => {
                // Find all quantities for this product id in the cart (regardless of customizations)
                const cartQty = cart
                  .filter((item) => item.product.id === p.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div key={p.id} className="bg-white border border-slate-150/50 p-4 rounded-[22px] flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{p.name}</h4>
                      <p className="text-[11px] text-slate-450 mt-1 leading-relaxed line-clamp-2">{p.description}</p>
                      <span className="text-sm font-black text-slate-900 mt-2.5 block">₹{Number(p.price).toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center transition border ${
                        cartQty > 0
                          ? 'bg-amber-50 border-amber-300 text-amber-600 font-black'
                          : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-amber-500 hover:text-white hover:border-transparent'
                      }`}
                    >
                      {cartQty > 0 ? (
                        <span className="text-xs font-black">+{cartQty}</span>
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <Coffee size={36} className="mx-auto text-slate-350 animate-bounce" />
                  <p className="text-xs font-bold text-slate-450">No products match your search.</p>
                </div>
              )}
            </div>

            {/* Sticky Cart Footer */}
            {cart.length > 0 && (
              <div className="bg-white p-4.5 border-t border-slate-150/70 flex items-center justify-between shadow-2xl animate-fade-up">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Subtotal</span>
                  <span className="text-base font-black text-indigo-650">₹{subtotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setScreen('REVIEW')}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg transition active:scale-97"
                >
                  Review Order
                </button>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 3: CUSTOMIZATION POPUP */}
        {customizingProduct && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-[32px] p-6 w-full max-w-sm space-y-5 shadow-2xl border border-slate-100 animate-scale-up">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{customizingProduct.name}</h4>
                  <span className="text-xs text-amber-600 font-bold">Special Requests</span>
                </div>
                <button onClick={() => setCustomizingProduct(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-550 transition">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cooking / Preparation Notes</label>
                <textarea
                  placeholder="e.g. less spicy, no onions, extra ice..."
                  value={customNotesText}
                  onChange={(e) => setCustomNotesText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 h-24 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none placeholder-slate-400"
                />
              </div>

              <button
                onClick={handleSaveCustomizations}
                className="w-full py-4 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/10 transition"
              >
                Add to Order
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: REVIEW */}
        {screen === 'REVIEW' && (
          <div className="flex-1 flex flex-col h-full bg-slate-50 justify-between">
            <div className="bg-white border-b border-slate-150/70 p-4 flex items-center justify-between sticky top-0 z-20">
              <button onClick={() => setScreen('BROWSE')} className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition">
                <ArrowLeft size={16} />
              </button>
              <span className="font-black text-xs text-slate-900 uppercase tracking-widest">Review Cart</span>
              <div className="w-9" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Cart List */}
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={`${item.product.id}-${idx}`} className="bg-white p-4 rounded-[22px] border border-slate-150/50 flex items-center justify-between text-xs font-semibold text-slate-700 shadow-sm">
                    <div className="flex-1 pr-3">
                      <span className="font-extrabold text-slate-900 text-xs block">{item.product.name}</span>
                      {item.product.customNote && (
                        <span className="inline-block text-[9px] bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded-md font-bold uppercase mt-1">
                          Note: {item.product.customNote}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-bold block mt-1.5">₹{Number(item.product.price).toFixed(2)} each</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner shrink-0">
                        <button onClick={() => updateQty(item.product.id, item.product.customNote, -1)} className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg">
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.product.customNote, 1)} className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg">
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="font-black text-slate-900 w-16 text-right shrink-0">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="bg-white p-4.5 rounded-[22px] border border-slate-150/50 space-y-2.5 shadow-sm">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Promo Coupon Code</label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button onClick={handleApplyCoupon} className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition">
                    Apply
                  </button>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="bg-white p-4.5 rounded-[22px] border border-slate-150/50 space-y-3 text-xs font-semibold text-slate-500 shadow-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800 font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount code</span>
                    <span>-₹{discountVal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Tax (5%)</span>
                  <span className="text-slate-800 font-bold">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-150/70">
                  <span>Grand Total</span>
                  <span className="text-indigo-650 font-black">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Option */}
            <div className="bg-white p-4.5 border-t border-slate-150/70 space-y-4 shadow-2xl">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3.5 border-2 rounded-2xl flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'UPI'
                        ? 'border-indigo-650 bg-indigo-50/40 text-indigo-700 font-extrabold'
                        : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Smartphone size={18} />
                    <span className="text-[10px] uppercase tracking-wide">UPI / Instant Pay</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('COUNTER')}
                    className={`p-3.5 border-2 rounded-2xl flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'COUNTER'
                        ? 'border-indigo-650 bg-indigo-50/40 text-indigo-700 font-extrabold'
                        : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wallet size={18} />
                    <span className="text-[10px] uppercase tracking-wide">Pay at Counter</span>
                  </button>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (paymentMethod === 'UPI') {
                    setUpiTimer(300);
                    setShowUpiModal(true);
                  } else {
                    await handleOrderSubmission('COUNTER', false);
                  }
                }}
                className="w-full py-4.5 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition active:scale-97"
              >
                {paymentMethod === 'UPI' ? 'Pay & Confirm Order' : 'Confirm Order (Pay at Counter)'}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: CONFIRMATION & LIVE TRACKING */}
        {screen === 'CONFIRMED' && (
          <div className="flex-1 flex flex-col h-full bg-slate-50 justify-between p-6">
            <div className="text-center pt-6 space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-350 shadow-inner">
                <Check size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Order Confirmed</h3>
                <p className="text-xs text-slate-500 font-semibold">Your order <span className="text-indigo-600 font-bold">#{confirmedOrderId}</span> has been dispatched to the kitchen.</p>
              </div>
            </div>

            {/* Live Progress Track */}
            <div className="bg-white border border-slate-150/50 rounded-[28px] p-5.5 shadow-sm space-y-5">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} className="text-amber-500 animate-spin-slow" />
                <span>Live Order Track</span>
              </span>

              <div className="space-y-4.5">
                {[
                  { id: 'TO_COOK', label: 'Order Received', desc: 'Queued for preparation' },
                  { id: 'PREPARING', label: 'Preparing Food', desc: 'Kitchen crew is cooking' },
                  { id: 'COMPLETED', label: 'Ready for Service', desc: 'Hot and ready to be served' },
                  { id: 'PAID', label: 'Order Settled', desc: 'Receipt closed' },
                ].map((step, idx) => {
                  const statusCycle = ['TO_COOK', 'PREPARING', 'COMPLETED', 'PAID'];
                  const activeIdx = statusCycle.indexOf(orderStatus);
                  const isDone = activeIdx >= idx;
                  const isCurrent = orderStatus === step.id;

                  return (
                    <div key={step.id} className="flex gap-4.5">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-black border transition ${
                            isCurrent
                              ? 'bg-amber-500 border-transparent text-slate-950 shadow-md scale-110'
                              : isDone
                              ? 'bg-emerald-600 border-transparent text-white'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        {idx < 3 && (
                          <div className={`w-0.5 h-9 mt-1 transition ${isDone ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                        )}
                      </div>

                      <div className="text-xs font-semibold pt-0.5">
                        <span className={`block ${isCurrent ? 'text-slate-900 font-extrabold' : 'text-slate-500'}`}>
                          {step.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal mt-0.5 block">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setScreen('BROWSE')}
              className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow transition"
            >
              Order More
            </button>
          </div>
        )}

        {/* UPI Payment Modal Overlay */}
        {showUpiModal && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
            <div className="bg-white rounded-[32px] p-6 w-full max-w-sm flex flex-col items-center text-center space-y-5 shadow-2xl border border-slate-100 animate-zoom-in">
              <div className="flex justify-between w-full items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">UPI Instant Checkout</span>
                <button onClick={() => setShowUpiModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Amount Due</span>
                <span className="text-2xl font-black text-slate-900">₹{total.toFixed(2)}</span>
              </div>

              {/* Dynamic QR Code Mock */}
              <div className="bg-slate-50 border border-slate-150 p-5.5 rounded-3xl relative shadow-inner">
                <QrCode size={180} className="text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 opacity-0 hover:opacity-100 transition duration-200">
                  <span className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-full uppercase">Scan to Pay</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>Expires in:</span>
                  <span className="text-rose-500 font-black font-mono">{formatTimer(upiTimer)}</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                  Scan the QR code using GPay, PhonePe, Paytm, or any BHIM UPI app to secure your checkout.
                </p>
              </div>

              <div className="w-full pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                <button
                  onClick={() => handleOrderSubmission('UPI', true)}
                  className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition active:scale-97"
                >
                  Simulate Payment Success
                </button>
                <button
                  onClick={() => setShowUpiModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-2xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
