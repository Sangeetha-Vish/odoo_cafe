import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Coffee, Search, ShoppingBag, Plus, Minus, Check, Clock, ArrowLeft, X, CreditCard, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { getSocket } from '../components/Navbar';

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
  const mode = localStorage.getItem('self_order_mode') || 'ONLINE';
  const bgType = localStorage.getItem('self_order_bg_type') || 'COLOR';
  const bgColor = localStorage.getItem('self_order_bg_color') || '#FDF8F2';

  // Flow State: 'SPLASH' | 'BROWSE' | 'REVIEW' | 'PAYMENT' | 'PAYING' | 'CONFIRMED'
  const [screen, setScreen] = useState('SPLASH');
  
  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [table, setTable] = useState(null);
  const [coupons, setCoupons] = useState([]);

  // Cart State
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Customization Popup state
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [itemNote, setItemNote] = useState('');
  const [customizations, setCustomizations] = useState({
    extraCheese: false,
    extraSauce: false,
  });

  // Track status state
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('TO_COOK');

  // Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [upiApp, setUpiApp] = useState('gpay');

  // Auto-scroll background simulation index
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (bgType === 'IMAGES') {
      const interval = setInterval(() => {
        setBgIndex((prev) => (prev + 1) % MOCK_IMAGES.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bgType]);

  // Load products, tables, and coupons
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resProds, resCats, resTables, resCoupons] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
          api.get('/tables'),
          api.get('/coupons').catch(() => ({ data: { data: [] } })), // Optional fallback
        ]);

        const prodData = resProds.data.data || [];
        setProducts(prodData);
        setCategories(resCats.data.data || []);
        setCoupons(resCoupons.data?.data || []);

        // Find table by token
        const found = (resTables.data.data || []).find(
          (t) => localStorage.getItem(`table_token_${t.id}`) === token
        );
        if (found) {
          setTable(found);
        } else {
          // Fallback table matching fuzzy or mock
          const dummyTable = (resTables.data.data || [])[0] || { id: 1, table_number: '1', status: 'FREE' };
          setTable(dummyTable);
        }
      } catch (err) {
        console.error('Failed to load self order metadata', err);
      }
    };
    loadData();
  }, [token]);

  // Socket.IO Status Listener for real-time tracking
  useEffect(() => {
    if (!confirmedOrderId) return;
    const socket = getSocket();

    const handleOrderUpdated = (updatedOrder) => {
      if (Number(updatedOrder.id) === Number(confirmedOrderId)) {
        setOrderStatus(updatedOrder.status);
      }
    };

    socket.on('order:updated', handleOrderUpdated);

    // Fallback Polling every 4 seconds in case sockets aren't connected
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${confirmedOrderId}`);
        if (res.data?.success && res.data?.data) {
          setOrderStatus(res.data.data.status);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 4000);

    return () => {
      socket.off('order:updated', handleOrderUpdated);
      clearInterval(interval);
    };
  }, [confirmedOrderId]);

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-[#faf6f0] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-4 border border-[#e6dcd0]">
          <X className="mx-auto text-rose-500" size={48} />
          <h2 className="text-lg font-black text-[#5c4033] uppercase">Self-Ordering Disabled</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Table ordering has been temporarily turned off. Please scan again or consult a staff member.
          </p>
        </div>
      </div>
    );
  }

  // Cart operations
  function addToCart(product) {
    setCustomizingProduct(product);
    setItemNote('');
    setCustomizations({ extraCheese: false, extraSauce: false });
  }

  function handleSaveCustomizations() {
    const extraPrice = (customizations.extraCheese ? 30 : 0);
    const itemPrice = Number(customizingProduct.price) + extraPrice;
    
    // Construct special notes
    const notesArray = [];
    if (customizations.extraCheese) notesArray.push('Extra Cheese');
    if (customizations.extraSauce) notesArray.push('Extra Sauce');
    if (itemNote.trim()) notesArray.push(itemNote.trim());
    
    const notesString = notesArray.join(', ');

    setCart((prev) => {
      // Check if item already exists in cart WITH the exact same custom notes
      const matchIndex = prev.findIndex(
        (item) => item.product.id === customizingProduct.id && item.notes === notesString
      );

      if (matchIndex > -1) {
        return prev.map((item, idx) =>
          idx === matchIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
          product: customizingProduct,
          quantity: 1,
          price: itemPrice,
          notes: notesString,
        },
      ];
    });

    setCustomizingProduct(null);
  }

  function updateQty(productId, notes, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.notes === notes) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    
    // First check hardcoded Welcome promo
    if (code === 'WELCOME10') {
      setAppliedCoupon({ code: 'WELCOME10', type: 'percentage', value: 10 });
      alert('10% Promo Code applied successfully!');
      return;
    }

    // Next check from DB coupons
    const matched = coupons.find((c) => c.code.toUpperCase() === code);
    if (matched) {
      setAppliedCoupon({ code: matched.code, type: matched.type.toLowerCase(), value: Number(matched.value) });
      alert(`Coupon ${matched.code} applied successfully!`);
    } else {
      alert('Invalid Promo Code. Please try another one.');
    }
  }

  // Cost Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  let discountVal = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountVal = (subtotal * appliedCoupon.value) / 100;
    } else {
      discountVal = Math.min(appliedCoupon.value, subtotal);
    }
  }
  
  const gst = (subtotal - discountVal) * 0.05;
  const total = Math.max(0, subtotal - discountVal + gst);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCatId === 'ALL' || p.category_id === Number(selectedCatId);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle placing order and simulating payments
  const handleCheckoutSubmit = async () => {
    if (selectedPaymentMethod === 'UPI') {
      // Transition to UPI loading overlay
      setScreen('PAYING');
      
      // Simulate payment verification
      setTimeout(async () => {
        await createFinalOrder('UPI', 'PAID');
      }, 3500);
    } else {
      // Cash/Counter settlement, goes straight to cooking
      await createFinalOrder(selectedPaymentMethod, 'TO_COOK');
    }
  };

  const createFinalOrder = async (payMethod, initialStatus) => {
    try {
      const payload = {
        tableIds: table ? [table.id] : [],
        customerName: `Table ${table?.table_number || 'Guest'}`,
        subtotal,
        tax: gst,
        discount: discountVal,
        total,
        paymentMethod: payMethod,
        status: initialStatus, // 'PAID' or 'TO_COOK'
        notes: `Mobile Order - ${payMethod}`,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || null,
        })),
      };

      const res = await api.post('/orders', payload);
      const orderId = res.data?.data?.id || res.data?.id;

      setConfirmedOrderId(orderId);
      setOrderStatus(initialStatus);
      setScreen('CONFIRMED');
      setCart([]);
    } catch (err) {
      console.error('Checkout failed', err);
      alert('Failed to place order. Please call staff for assistance.');
      setScreen('REVIEW');
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1816] flex justify-center items-center py-4 px-2 font-sans select-none">
      <div className="w-full max-w-md bg-[#faf6f0] min-h-[760px] rounded-[44px] shadow-2xl overflow-hidden flex flex-col justify-between border-[8px] border-amber-950 relative">
        
        {/* Status Bar notch simulation */}
        <div className="bg-amber-950 text-[#faf6f0]/85 text-[10px] px-8 py-2 flex justify-between items-center font-bold tracking-tight z-30">
          <span>9:41 AM</span>
          <div className="h-4.5 w-24 bg-amber-950 rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2" />
          <span className="flex items-center gap-1">5G 🔋</span>
        </div>

        {/* SCREEN 1: SPLASH */}
        {screen === 'SPLASH' && (
          <div
            className="flex-1 flex flex-col justify-between p-8 text-center bg-cover bg-center relative"
            style={{
              backgroundImage: bgType === 'IMAGES' ? `url(${MOCK_IMAGES[bgIndex]})` : 'none',
              backgroundColor: bgType === 'COLOR' ? bgColor : '#1c1816',
            }}
          >
            {bgType === 'IMAGES' && <div className="absolute inset-0 bg-black/50 z-0" />}

            <div className="z-10 pt-16 space-y-4">
              <div className="mx-auto w-20 h-20 bg-[#b38b6d] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 animate-pulse">
                <Coffee size={36} />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-white uppercase tracking-wider">
                  Odoo Cafe
                </h1>
                <p className="text-[10px] tracking-widest text-[#d8c2b0] uppercase font-bold">
                  Savor the Experience
                </p>
              </div>
              {table && (
                <div className="inline-flex mt-4 px-4 py-1.5 bg-[#b38b6d]/90 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-md">
                  Table {table.table_number}
                </div>
              )}
            </div>

            <button
              onClick={() => setScreen('BROWSE')}
              className="z-10 py-4 bg-[#b38b6d] hover:bg-[#997355] text-white font-black rounded-2xl text-sm shadow-xl transition-all duration-300 border border-white/20 active:scale-95"
            >
              Order Here
            </button>
          </div>
        )}

        {/* SCREEN 2: BROWSE */}
        {screen === 'BROWSE' && (
          <div className="flex-1 flex flex-col h-full bg-[#faf6f0] justify-between">
            {/* Header */}
            <div className="bg-[#faf6f0] border-b border-[#e6dcd0] p-4 flex items-center justify-between z-10 shadow-xs">
              <button onClick={() => setScreen('SPLASH')} className="p-2 text-slate-500 hover:bg-[#f0e8dd] rounded-xl transition">
                <ArrowLeft size={16} />
              </button>
              <div className="text-center">
                <span className="font-black text-xs text-[#5c4033] uppercase tracking-widest">
                  Table {table?.table_number || 'Menu'}
                </span>
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Self-Order Session</span>
              </div>
              <button
                onClick={() => cart.length > 0 && setScreen('REVIEW')}
                className="relative p-2 bg-[#b38b6d] text-white rounded-xl shadow-md transition hover:scale-105"
              >
                <ShoppingBag size={16} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Search and Categories */}
            <div className="p-3 bg-white space-y-3 shadow-xs">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item, drinks..."
                  className="w-full bg-[#faf6f0] border border-[#e6dcd0] px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#b38b6d] text-slate-800 font-semibold"
                />
                <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCatId('ALL')}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition shrink-0 ${
                    selectedCatId === 'ALL'
                      ? 'bg-[#b38b6d] text-white shadow-sm'
                      : 'bg-[#f0e8dd] text-[#5c4033]/70 hover:bg-[#e6dcd0]'
                  }`}
                >
                  All Menu
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCatId(c.id)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition shrink-0 ${
                      selectedCatId === c.id
                        ? 'bg-[#b38b6d] text-white shadow-sm'
                        : 'bg-[#f0e8dd] text-[#5c4033]/70 hover:bg-[#e6dcd0]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[460px]">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No items found.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const cartCount = cart
                    .filter((item) => item.product.id === p.id)
                    .reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <div key={p.id} className="bg-white border border-[#e6dcd0]/60 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-xs truncate">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 font-medium leading-normal">{p.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-black text-slate-900">₹{Number(p.price).toFixed(2)}</span>
                          {p.tax > 0 && (
                            <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              +{p.tax}% Tax
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-center">
                        {cartCount > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-bold text-[#b38b6d] uppercase bg-[#faf6f0] px-2 py-0.5 rounded border border-[#e6dcd0]">
                              {cartCount} in Cart
                            </span>
                            <button
                              onClick={() => addToCart(p)}
                              className="p-1.5 bg-[#b38b6d] text-white rounded-lg hover:bg-[#997355] transition shadow-xs text-[10px] font-bold flex items-center gap-0.5"
                            >
                              <Plus size={10} />
                              <span>Add more</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(p)}
                            className="p-2.5 bg-[#fdfaf6] hover:bg-[#b38b6d] hover:text-white border border-[#e6dcd0] text-slate-600 rounded-xl transition shadow-xs"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Cart footer */}
            {cart.length > 0 && (
              <div className="bg-white p-4 border-t border-[#e6dcd0] flex items-center justify-between rounded-t-3xl shadow-lg z-10">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total amount</span>
                  <span className="text-sm font-black text-[#5c4033]">₹{total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setScreen('REVIEW')}
                  className="bg-[#b38b6d] hover:bg-[#997355] text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <ShoppingBag size={14} />
                  <span>Review & Pay</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 3: CUSTOMIZATION POPUP */}
        {customizingProduct && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl border border-[#e6dcd0] animate-fade-up">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-[#5c4033] text-sm">{customizingProduct.name}</h4>
                  <span className="text-[10px] text-slate-450 font-bold uppercase">Customize order</span>
                </div>
                <button onClick={() => setCustomizingProduct(null)} className="p-1 bg-[#faf6f0] rounded-lg text-slate-400 hover:text-slate-650 transition">
                  <X size={14} />
                </button>
              </div>

              {/* Cooking Instruction Notes */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">
                    Special Cooking Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    placeholder="e.g. less spicy, no onion, extra hot"
                    className="w-full bg-[#faf6f0] border border-[#e6dcd0] px-3.5 py-2.5 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#b38b6d]"
                  />
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-700">
                  <label className="flex items-center justify-between p-2.5 bg-[#faf6f0] rounded-xl cursor-pointer hover:bg-[#f0e8dd] transition">
                    <span>Extra Cheese (+₹30.00)</span>
                    <input
                      type="checkbox"
                      checked={customizations.extraCheese}
                      onChange={(e) => setCustomizations((p) => ({ ...p, extraCheese: e.target.checked }))}
                      className="text-[#b38b6d] rounded focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-[#faf6f0] rounded-xl cursor-pointer hover:bg-[#f0e8dd] transition">
                    <span>Extra Sauce (Free)</span>
                    <input
                      type="checkbox"
                      checked={customizations.extraSauce}
                      onChange={(e) => setCustomizations((p) => ({ ...p, extraSauce: e.target.checked }))}
                      className="text-[#b38b6d] rounded focus:ring-0"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveCustomizations}
                className="w-full py-3.5 bg-[#b38b6d] hover:bg-[#997355] text-white font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: REVIEW */}
        {screen === 'REVIEW' && (
          <div className="flex-1 flex flex-col h-full bg-[#faf6f0] justify-between">
            <div className="bg-white border-b border-[#e6dcd0] p-4 flex items-center justify-between shadow-xs">
              <button onClick={() => setScreen('BROWSE')} className="p-2 text-slate-500 rounded-xl hover:bg-[#faf6f0]">
                <ArrowLeft size={16} />
              </button>
              <span className="font-black text-xs text-[#5c4033] uppercase tracking-wider">Review Order Items</span>
              <div className="w-8" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]">
              {/* Item Card Lists */}
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="bg-white p-3.5 rounded-2xl border border-[#e6dcd0]/50 flex items-center justify-between text-xs font-semibold text-slate-700 shadow-xs">
                    <div className="space-y-1 max-w-[60%]">
                      <span className="font-extrabold text-slate-800">{item.product.name}</span>
                      {item.notes && (
                        <span className="block text-[8.5px] text-[#b38b6d] font-bold uppercase tracking-wider bg-[#faf6f0] px-1.5 py-0.5 rounded border border-[#e6dcd0]/40 w-fit">
                          {item.notes}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block font-bold">₹{item.price.toFixed(2)} each</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-[#faf6f0] border border-[#e6dcd0] rounded-xl p-1 shadow-inner shrink-0">
                        <button onClick={() => updateQty(item.product.id, item.notes, -1)} className="p-1 text-slate-500 hover:bg-[#f0e8dd] rounded-lg">
                          <Minus size={10} />
                        </button>
                        <span className="px-2 text-xs font-black text-[#5c4033]">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.notes, 1)} className="p-1 text-slate-500 hover:bg-[#f0e8dd] rounded-lg">
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="font-black text-slate-800 text-right w-16">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#e6dcd0]/50 space-y-2 shadow-xs">
                <label className="block text-[9px] font-black text-slate-450 uppercase tracking-wide">Have a promo coupon?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#faf6f0] border border-[#e6dcd0] rounded-xl text-xs font-bold uppercase text-slate-800"
                  />
                  <button onClick={handleApplyCoupon} className="bg-[#5c4033] text-white px-4 py-2 rounded-xl text-xs font-bold transition hover:bg-[#402d24]">
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-[10px] text-emerald-600 font-bold">
                    ✓ Applied {appliedCoupon.code} ({appliedCoupon.value}{appliedCoupon.type === 'percentage' ? '%' : ' INR'} off)
                  </p>
                )}
              </div>

              {/* Bill Details */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#e6dcd0]/50 space-y-2.5 text-xs font-semibold text-slate-550 shadow-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800 font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount</span>
                    <span>-₹{discountVal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST Tax (5%)</span>
                  <span className="text-slate-800 font-bold">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-150">
                  <span>Total Amount</span>
                  <span className="text-[#b38b6d] font-black text-base">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 border-t border-[#e6dcd0] rounded-t-3xl shadow-lg">
              <button
                onClick={() => setScreen('PAYMENT')}
                className="w-full py-4 bg-[#b38b6d] hover:bg-[#997355] text-white font-black text-xs rounded-2xl shadow-md transition active:scale-95"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: PAYMENT FLOW */}
        {screen === 'PAYMENT' && (
          <div className="flex-1 flex flex-col h-full bg-[#faf6f0] justify-between">
            <div className="bg-white border-b border-[#e6dcd0] p-4 flex items-center justify-between shadow-xs">
              <button onClick={() => setScreen('REVIEW')} className="p-2 text-slate-500 rounded-xl hover:bg-[#faf6f0]">
                <ArrowLeft size={16} />
              </button>
              <span className="font-black text-xs text-[#5c4033] uppercase tracking-wider">Select Payment Method</span>
              <div className="w-8" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]">
              {/* Payment selector chips */}
              <div className="space-y-3">
                {[
                  { id: 'UPI', label: 'UPI (India Instant Pay)', desc: 'Pay via GPay, PhonePe, Paytm, or QR Code', icon: Wallet },
                  { id: 'CARD', label: 'Credit / Debit Card', desc: 'Settle instantly via card portal', icon: CreditCard },
                  { id: 'CASH', label: 'Pay at Counter (Cash/POS)', desc: 'Submit order and pay when eating', icon: DollarSign },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSel = selectedPaymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`w-full p-4 border-2 rounded-2xl text-left transition flex items-start gap-3.5 ${
                        isSel
                          ? 'border-[#b38b6d] bg-[#b38b6d]/5 text-[#5c4033] shadow-xs'
                          : 'border-[#e6dcd0] bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isSel ? 'bg-[#b38b6d] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black block">{pm.label}</span>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">{pm.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* UPI Suboptions */}
              {selectedPaymentMethod === 'UPI' && (
                <div className="bg-white p-4 rounded-2xl border border-[#e6dcd0]/50 space-y-3 animate-fade-up">
                  <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Choose UPI Option</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-2 p-2.5 bg-[#faf6f0] rounded-xl cursor-pointer">
                      <input
                        type="radio"
                        name="upi-opt"
                        checked={upiApp === 'gpay'}
                        onChange={() => setUpiApp('gpay')}
                        className="text-[#b38b6d]"
                      />
                      <span>Google Pay / PhonePe</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-[#faf6f0] rounded-xl cursor-pointer">
                      <input
                        type="radio"
                        name="upi-opt"
                        checked={upiApp === 'qr'}
                        onChange={() => setUpiApp('qr')}
                        className="text-[#b38b6d]"
                      />
                      <span>UPI QR Code</span>
                    </label>
                  </div>

                  {upiApp === 'qr' && (
                    <div className="flex flex-col items-center justify-center p-4 bg-[#faf6f0] rounded-xl space-y-2 border border-[#e6dcd0]">
                      {/* Generates a dummy mock UPI QR code */}
                      <div className="bg-white p-3 rounded-lg border border-[#e6dcd0] shadow-inner">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=odoocafe@upi%26pn=Odoo%20Cafe%26am=${total.toFixed(2)}%26cu=INR`}
                          alt="UPI QR Code"
                          className="h-28 w-28 object-contain"
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest text-center">
                        Scan QR & pay ₹{total.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div className="bg-white p-4 border-t border-[#e6dcd0] rounded-t-3xl shadow-lg space-y-3">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="font-semibold text-slate-500">Billing Amount</span>
                <span className="font-black text-slate-900 text-sm">₹{total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckoutSubmit}
                className="w-full py-4 bg-[#b38b6d] hover:bg-[#997355] text-white font-black text-xs rounded-2xl shadow-md transition active:scale-95"
              >
                {selectedPaymentMethod === 'UPI' ? 'Verify & Place Order' : 'Place Order'}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 6: UPI PROCESSING LOADER */}
        {screen === 'PAYING' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#faf6f0] p-6 text-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-[#b38b6d]/30 border-t-[#b38b6d] rounded-full animate-spin" />
              <Coffee size={24} className="absolute text-[#b38b6d]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#5c4033] uppercase tracking-wider">Verifying UPI Transaction</h3>
              <p className="text-[10px] text-slate-450 font-semibold leading-relaxed px-6">
                Please authorize the payment request of <strong>₹{total.toFixed(2)}</strong> on your UPI app. Do not close this window.
              </p>
            </div>
          </div>
        )}

        {/* SCREEN 7: CONFIRMATION & LIVE TRACKING */}
        {screen === 'CONFIRMED' && (
          <div className="flex-1 flex flex-col h-full bg-[#faf6f0] justify-between p-6">
            <div className="text-center pt-6 space-y-3">
              <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-300 shadow-inner">
                <Check size={26} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#5c4033] uppercase tracking-wider">Order Confirmed</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">
                  Order #{confirmedOrderId} has been logged and sent to kitchen.
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#e6dcd0] rounded-3xl p-5 shadow-xs space-y-4 flex-1 my-4 flex flex-col justify-center">
              <span className="block text-[9px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1">
                <Clock size={12} className="text-amber-500 animate-spin-slow" />
                <span>Live cooking tracker</span>
              </span>

              <div className="space-y-3 pt-2">
                {[
                  { id: 'TO_COOK', label: 'Queued to Cook', desc: 'Order received by the kitchen' },
                  { id: 'PREPARING', label: 'Preparing Food', desc: 'Chef is preparing your meal' },
                  { id: 'COMPLETED', label: 'Ready for Service', desc: 'Hot and fresh, ready to serve' },
                  { id: 'PAID', label: 'Completed & Paid', desc: 'Settle and closing invoice' },
                ].map((step, idx) => {
                  const statusCycle = ['TO_COOK', 'PREPARING', 'COMPLETED', 'PAID'];
                  const activeIdx = statusCycle.indexOf(orderStatus);
                  const isDone = activeIdx >= idx;
                  const isCurrent = orderStatus === step.id;

                  return (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition ${
                            isCurrent
                              ? 'bg-[#b38b6d] border-transparent text-white shadow-md scale-110'
                              : isDone
                              ? 'bg-emerald-600 border-transparent text-white'
                              : 'bg-white border-slate-200 text-slate-350'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        {idx < 3 && (
                          <div className={`w-0.5 h-7 transition ${isDone ? 'bg-emerald-600' : 'bg-slate-150'}`} />
                        )}
                      </div>

                      <div className="text-xs font-semibold">
                        <span className={`block ${isCurrent ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                        <span className="text-[8.5px] text-slate-400 font-normal block mt-0.5">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setScreen('BROWSE')}
              className="w-full py-4 bg-[#5c4033] hover:bg-[#402d24] text-white font-black text-xs rounded-2xl shadow transition active:scale-95"
            >
              Order More Items
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
