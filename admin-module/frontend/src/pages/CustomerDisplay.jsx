import React, { useState, useEffect } from 'react';
import { Coffee, ShieldCheck, Heart, Sparkles, QrCode, Monitor } from 'lucide-react';
import { getSocket } from '../components/Navbar';

export default function CustomerDisplay() {
  // Simulator states for demo: 'CART', 'PAYMENT', 'COMPLETE'
  const [viewState, setViewState] = useState('CART');
  const [cartItems, setCartItems] = useState([
    { name: 'Chicken Burger', qty: 2, price: 180, total: 360 },
    { name: 'Masala Tea', qty: 3, price: 30, total: 90 },
    { name: 'Paneer Pizza', qty: 1, price: 300, total: 300 },
  ]);

  const [discount, setDiscount] = useState(50);
  const [tax, setTax] = useState(37.5); // 5% GST on Subtotal 750
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal + tax - discount;

  // Set up live socket listeners if connected to real POS
  useEffect(() => {
    const socket = getSocket();

    const onCartUpdate = (data) => {
      if (data.items) setCartItems(data.items);
      if (data.discount) setDiscount(data.discount);
      if (data.tax) setTax(data.tax);
      setViewState('CART');
    };

    const onPaymentStart = () => {
      setViewState('PAYMENT');
    };

    const onOrderComplete = () => {
      setViewState('COMPLETE');
      setTimeout(() => {
        setViewState('CART');
        setCartItems([]);
      }, 5000);
    };

    socket.on('pos:cart_update', onCartUpdate);
    socket.on('pos:payment_start', onPaymentStart);
    socket.on('pos:order_complete', onOrderComplete);

    return () => {
      socket.off('pos:cart_update', onCartUpdate);
      socket.off('pos:payment_start', onPaymentStart);
      socket.off('pos:order_complete', onOrderComplete);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans select-none overflow-hidden relative">
      
      {/* Mini Demo state switcher panel at the top (can be clicked during demo/testing) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs font-bold text-slate-400 z-30 shrink-0">
        <span className="flex items-center gap-1.5 text-indigo-400 uppercase tracking-widest text-[10px]">
          <Monitor size={14} />
          <span>Demo Controller</span>
        </span>
        <div className="flex gap-2">
          {['CART', 'PAYMENT', 'COMPLETE'].map((state) => (
            <button
              key={state}
              onClick={() => setViewState(state)}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                viewState === state ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Fixed Branding Panel */}
        <div className="w-1/2 bg-slate-900 border-r border-slate-800 p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b,transparent)] opacity-40" />
          
          {/* Logo and Brand header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl rotate-6">
              <Coffee className="h-6.5 w-6.5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">Odoo Cafe</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Fresh Coffee & Quick Bites</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="relative z-10 space-y-3">
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              Welcome to <br />Odoo Cafe
            </h1>
            <p className="text-sm text-slate-400 max-w-sm font-semibold leading-relaxed">
              We serve organic single-origin coffee and freshly baked food items. Scan, order and checkout.
            </p>
          </div>

          {/* Footer branding */}
          <div className="relative z-10 flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
            <span>Powered by Odoo POS System</span>
          </div>
        </div>

        {/* Right Side: Dynamic Content Panel */}
        <div className="w-1/2 bg-slate-950 p-10 flex flex-col justify-between overflow-hidden">
          
          {/* View State Conditional Rendering */}
          {viewState === 'CART' && (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4 overflow-hidden flex flex-col">
                <div className="pb-3 border-b border-slate-850">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Current Bill Details</h3>
                </div>
                
                {/* Cart list */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3.5">
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10 space-y-2">
                      <Coffee size={32} className="animate-bounce" />
                      <p className="text-xs font-bold uppercase tracking-widest">Waiting for items...</p>
                    </div>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start font-bold">
                        <div>
                          <p className="text-sm text-slate-200">{item.name}</p>
                          <span className="text-[11px] text-slate-500 font-medium">₹{item.price} each</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-200">₹{item.total}</p>
                          <span className="text-[11px] text-slate-500 font-medium">Qty: {item.qty}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Order total footer */}
              {cartItems.length > 0 && (
                <div className="pt-5 border-t border-slate-850 space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-500">
                    <span>Discount Applied</span>
                    <span>- ₹{discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>GST (5%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-800 text-lg font-black text-white">
                    <span>Total Amount</span>
                    <span className="text-indigo-400">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewState === 'PAYMENT' && (
            <div className="flex flex-col h-full items-center justify-center space-y-6">
              <div className="flex items-center gap-1 text-indigo-500 font-black text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>UPI Settle Checkout</span>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount to Pay</p>
                <h3 className="text-3xl font-black text-white">₹{total.toFixed(2)}</h3>
              </div>

              <div className="p-3 bg-white rounded-3xl border-2 border-indigo-500/20 shadow-2xl relative overflow-hidden">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=odoocafe@ybl%26am=${total}`}
                  alt="UPI QR Payment"
                  className="h-44 w-44 block rounded-xl"
                />
              </div>

              <div className="text-center max-w-xs space-y-1 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Scan QR using GPay, PhonePe, Paytm</p>
                <p className="text-xs text-slate-300 font-mono font-bold">odoocafe@ybl</p>
              </div>
            </div>
          )}

          {viewState === 'COMPLETE' && (
            <div className="flex flex-col h-full items-center justify-center text-center space-y-5">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg">
                <Heart size={32} className="fill-emerald-500/10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">Order Placed!</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto font-semibold leading-relaxed">
                  Thank you for dining with us! Your order ticket is sent to the kitchen.
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest animate-pulse">See you again</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
