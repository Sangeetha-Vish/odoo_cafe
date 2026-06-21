import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingBag, Trash2, Tag, CreditCard, DollarSign, Wallet, ArrowRight, CheckCircle, Coffee } from 'lucide-react';

export default function SelfOrderCheckout() {
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [overallNotes, setOverallNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  
  // Payment simulation state
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const tableData = localStorage.getItem('self_order_table');
    const cartData = localStorage.getItem('self_order_cart');
    
    if (!tableData) {
      navigate('/self-order');
      return;
    }
    setTable(JSON.parse(tableData));
    
    if (!cartData || JSON.parse(cartData).length === 0) {
      navigate('/self-order/menu');
      return;
    }
    setCart(JSON.parse(cartData));
  }, [navigate]);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = cart.reduce((acc, item) => acc + (item.product.tax || 0) * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal + tax - discount);

  function handleQuantityChange(productId, notes, delta) {
    const updated = cart.map((item) => {
      if (item.product.id === productId && item.notes === notes) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean);

    setCart(updated);
    localStorage.setItem('self_order_cart', JSON.stringify(updated));

    if (updated.length === 0) {
      navigate('/self-order/menu');
    }
  }

  function handleRemoveItem(productId, notes) {
    const updated = cart.filter((item) => !(item.product.id === productId && item.notes === notes));
    setCart(updated);
    localStorage.setItem('self_order_cart', JSON.stringify(updated));
    if (updated.length === 0) {
      navigate('/self-order/menu');
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const res = await axios.post('/api/coupons/validate', {
        code: couponCode,
        cartTotal: subtotal
      });
      setAppliedCoupon(res.data);
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code');
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
  }

  async function handleSimulatePayment() {
    if (!customerName.trim()) {
      alert('Please enter your name to complete the order.');
      return;
    }
    
    setPaying(true);
    
    // Simulate UPI / Card processing delay
    setTimeout(async () => {
      try {
        const orderPayload = {
          tableIds: [table.id],
          customerName: customerName.trim(),
          notes: overallNotes.trim() || undefined,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            notes: item.notes || undefined,
          })),
        };

        const res = await axios.post('/api/orders', orderPayload);
        
        setPaying(false);
        setPaymentSuccess(true);
        
        // Clear local cart
        localStorage.removeItem('self_order_cart');

        // Redirect to order status page after a brief celebration delay
        setTimeout(() => {
          navigate(`/self-order/status/${res.data.id}`);
        }, 1500);

      } catch (err) {
        setPaying(false);
        alert(err.response?.data?.error || 'Order creation failed. Please check with staff.');
      }
    }, 2000);
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#FFF9EB] flex flex-col justify-center items-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-amber-100 shadow-2xl text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Your order has been sent directly to the kitchen.</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-full">
            <Coffee size={14} />
            <span>Preparing order...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9EB] text-slate-800 flex flex-col font-sans pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-amber-100/60 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate('/self-order/menu')}
          className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-slate-950">Review Order</h1>
          {table && <span className="text-[10px] text-slate-400 font-bold">Table {table.table_number}</span>}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Cart items list */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Order Items</h2>
          <div className="divide-y divide-slate-100">
            {cart.map((item, idx) => (
              <div key={idx} className="py-3.5 flex justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">{item.product.name}</h3>
                    {item.notes && (
                      <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                        Note
                      </span>
                    )}
                  </div>
                  {item.notes && <p className="text-xs text-slate-400 mt-0.5 italic">"{item.notes}"</p>}
                  <span className="block text-xs text-slate-500 font-bold mt-1">₹{item.product.price.toFixed(2)} each</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1.5 gap-2.5">
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.notes, -1)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <Trash2 size={12} />
                    </button>
                    <span className="font-extrabold text-xs text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.notes, 1)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-black text-sm text-slate-900 min-w-[50px] text-right">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Detail Form */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Customer Info</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name-input" className="block text-xs font-bold text-slate-500 mb-1.5">Your Name (for KDS display)</label>
              <input
                id="name-input"
                type="text"
                required
                placeholder="e.g. John Doe"
                className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-amber-400 bg-slate-50/50"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="notes-input" className="block text-xs font-bold text-slate-500 mb-1.5">Special Order Request (optional)</label>
              <input
                id="notes-input"
                type="text"
                placeholder="e.g. Deliver drinks first"
                className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-amber-400 bg-slate-50/50"
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Apply Coupon</h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-emerald-800 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Tag size={14} />
                Code: {appliedCoupon.code} (₹{appliedCoupon.discount} Saved)
              </span>
              <button onClick={handleRemoveCoupon} className="text-rose-600 font-extrabold">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-amber-400 bg-slate-50/50 uppercase"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button 
                onClick={handleApplyCoupon}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-3 rounded-2xl text-xs transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
          {couponError && <p className="text-xs text-rose-600 font-semibold">{couponError}</p>}
        </div>

        {/* Billing breakdown */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-3">
          <div className="flex justify-between text-xs text-slate-500 font-bold">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Tax / GST</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-bold">
              <span>Discount</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
            <span className="font-extrabold text-sm text-slate-900">Grand Total</span>
            <span className="font-black text-xl text-slate-950">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Payment Option</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'UPI', label: 'UPI / Pay', icon: DollarSign },
              { id: 'CARD', label: 'Card Payment', icon: CreditCard },
              { id: 'CASH', label: 'Pay at Counter', icon: Wallet },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center gap-1.5 transition cursor-pointer ${
                    isSelected 
                      ? 'border-amber-400 bg-amber-50/50 text-amber-700 font-extrabold'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] uppercase font-bold tracking-wider">{method.label}</span>
                </button>
              );
            })}
          </div>

          {/* UPI Mock Scan Container */}
          {paymentMethod === 'UPI' && (
            <div className="mt-4 border border-dashed border-amber-200 bg-amber-50/20 rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden mb-3">
                {/* Simulated QR block dots */}
                <div className="absolute inset-2 grid grid-cols-6 gap-0.5 opacity-60">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-sm ${(i % 3 === 0 || i % 7 === 0) ? 'bg-slate-900' : 'bg-transparent'}`} 
                    />
                  ))}
                </div>
                <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center shadow z-10 animate-pulse">
                  <Coffee size={16} />
                </div>
              </div>
              <span className="text-xs font-black text-slate-900">Scan UPI QR to Pay</span>
              <p className="text-[10px] text-slate-400 mt-1">Accepts GPay, PhonePe, Paytm, & all UPI Apps.</p>
            </div>
          )}
        </div>

        {/* Place Order CTA Button */}
        <button
          onClick={handleSimulatePayment}
          disabled={paying || !customerName.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 active:scale-[0.98] py-4.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          {paying ? 'Authorizing Payment...' : `Confirm & Pay ₹${total.toFixed(2)}`}
          {!paying && <ArrowRight size={16} />}
        </button>
      </main>
    </div>
  );
}
