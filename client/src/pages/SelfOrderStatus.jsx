import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@shared-auth/supabaseClient.js';
import { Coffee, CheckCircle, Clock, ChefHat, ArrowRight, HelpCircle, PhoneCall } from 'lucide-react';
import axios from 'axios';

export default function SelfOrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();

    // Setup Supabase realtime subscription for the specific order status change
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, status: payload.new.status } : payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function fetchOrder() {
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Error fetching order status:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9EB] flex flex-col justify-center items-center">
        <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFF9EB] flex flex-col justify-center items-center px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <p className="text-slate-500 text-xs mt-1">We couldn't locate this order in our system.</p>
        <button 
          onClick={() => navigate('/self-order/menu')}
          className="mt-6 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const steps = [
    { id: 'TO_COOK', label: 'Order Received', icon: Clock, desc: 'We have received your order and payment.' },
    { id: 'PREPARING', label: 'Preparing', icon: ChefHat, desc: 'Our chef is preparing your meal right now.' },
    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle, desc: 'Ready! Delivered to your table.' }
  ];

  const currentStatus = order.status;
  const currentStepIndex = steps.findIndex(s => s.id === currentStatus);

  return (
    <div className="min-h-screen bg-[#FFF9EB] text-slate-800 flex flex-col font-sans py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-amber-100 p-6 md:p-8 shadow-2xl mx-auto space-y-8">
        
        {/* Header summary */}
        <div className="text-center">
          <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">
            Live Order Status
          </span>
          <h1 className="text-2xl font-black text-slate-950 mt-3">Order #{order.id}</h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Table: {order.tables?.[0]?.tableNumber || 'N/A'}</p>
        </div>

        {/* Progress Tracker */}
        <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIndex || currentStatus === 'COMPLETED' || currentStatus === 'PAID';
            const isActive = currentStatus === step.id;
            
            return (
              <div key={step.id} className="relative flex gap-4 transition duration-300">
                <div className={`absolute -left-8 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : isActive 
                      ? 'bg-amber-500 border-amber-500 text-slate-950 animate-pulse'
                      : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  <Icon size={14} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold transition ${
                    isCompleted || isActive ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Details summary */}
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">Your Items</h3>
          <div className="space-y-2">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>{item.quantity}x {item.product?.name}</span>
                <span className="text-slate-500">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-50 pt-2 flex justify-between items-center text-xs font-black text-slate-900">
              <span>Paid via {order.paymentMethod}</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="space-y-3.5 pt-4">
          <button
            onClick={() => navigate('/self-order/menu')}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] py-4 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/10 transition cursor-pointer"
          >
            Order More Food
            <ArrowRight size={14} />
          </button>
          
          <div className="flex justify-center items-center gap-2 py-2 text-xs text-slate-400 font-semibold cursor-pointer hover:text-slate-600 transition">
            <PhoneCall size={14} />
            <span>Need assistance? Tap to call staff.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
