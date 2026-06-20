import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { productAPI, couponAPI, orderAPI } from '../services/api';
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
} from 'lucide-react';

export default function PosPage() {
  const navigate = useNavigate();
  const {
    selectedTables,
    clearSelectedTables,
    customerName,
    setCustomerName,
    orderNotes,
    setOrderNotes,
    paymentMethod,
    setPaymentMethod,
    cartItems,
    coupon,
    setCoupon,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    discount,
    total,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Coupon validation
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponStatus, setCouponStatus] = useState({ type: null, message: '' });

  // Order Placement
  const [orderLoading, setOrderLoading] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        setProducts(data);

        // Extract unique categories
        const catMap = new Map();
        data.forEach((p) => {
          if (p.category && !catMap.has(p.category.id)) {
            catMap.set(p.category.id, p.category);
          }
        });
        setCategories(Array.from(catMap.values()));
      } catch (err) {
        console.error(err);
        showToast('error', 'Database Error', 'Failed to retrieve product catalog.');
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setCouponLoading(true);
      setCouponStatus({ type: null, message: '' });
      const currentSubtotal = subtotal;

      if (currentSubtotal === 0) {
        setCouponStatus({ type: 'error', message: 'Cart is empty. Add items first.' });
        return;
      }

      const result = await couponAPI.validate(couponCode, currentSubtotal);
      setCoupon(result);
      setCouponStatus({
        type: 'success',
        message: `Coupon "${result.code}" applied! Saved ₹${result.discount.toFixed(2)}`,
      });
      showToast('success', 'Coupon Applied', `Discount of ₹${result.discount.toFixed(2)} registered.`);
    } catch (err) {
      console.error(err);
      setCoupon(null);
      setCouponStatus({
        type: 'error',
        message: err.response?.data?.error || 'Invalid Coupon Code',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode('');
    setCouponStatus({ type: null, message: '' });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showToast('error', 'Empty Cart', 'Please add products to your cart before checking out.');
      return;
    }

    try {
      setOrderLoading(true);

      const payload = {
        tableIds: selectedTables.map((t) => t.id),
        customerName: customerName.trim() || 'Walk-in Customer',
        notes: orderNotes.trim() || null,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      const newOrder = await orderAPI.create(payload);
      showToast('success', 'Order Placed Successfully!', `Order #${newOrder.id} has been sent to the kitchen.`);
      
      // Clear Cart state
      clearCart();
      
      setTimeout(() => {
        navigate('/orders');
      }, 1550);

    } catch (err) {
      console.error(err);
      showToast('error', 'Checkout Failed', err.response?.data?.error || 'Failed to register new order.');
    } finally {
      setOrderLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryId === 'ALL' || p.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const selectedTablesLabel = selectedTables.length > 0
    ? selectedTables.map((t) => t.tableNumber).join(' + ')
    : 'Takeaway';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden animate-slide-in flex">
          <div className={`w-3 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="p-4 flex-1">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-rose-500" />
                )}
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

      {/* POS Top Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/tables')}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-sm border border-slate-200 flex items-center"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">POS Workspace</h1>
            <div className="flex items-center mt-1 space-x-2 text-xs flex-wrap gap-y-1">
              <span className="text-slate-400 font-semibold">Active Seating:</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold uppercase tracking-wide">
                {selectedTablesLabel}
              </span>
              {selectedTables.length > 0 ? (
                <button
                  onClick={() => {
                    clearSelectedTables();
                    showToast('success', 'Context Cleared', 'Switched order mode to Takeaway.');
                  }}
                  className="text-rose-500 hover:underline font-bold"
                >
                  Change to Takeaway
                </button>
              ) : (
                <button
                  onClick={() => navigate('/tables')}
                  className="text-amber-600 hover:underline font-bold"
                >
                  Select a Table
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search items by name or keywords..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Catalog / Product Grid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
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
                className="px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm border flex items-center space-x-1.5"
                style={{
                  backgroundColor: selectedCategoryId === cat.id ? cat.color : '#ffffff',
                  color: selectedCategoryId === cat.id ? '#ffffff' : '#475569',
                  borderColor: selectedCategoryId === cat.id ? 'transparent' : '#f1f5f9',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{
                    backgroundColor: selectedCategoryId === cat.id ? '#ffffff' : cat.color,
                  }}
                />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No Products Available"
              description="No menu items matched your active query filters."
              action={{
                label: 'Reset Filters',
                onClick: () => {
                  setSelectedCategoryId('ALL');
                  setSearchQuery('');
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addItem} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: checkout Order Cart */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-100 shadow-xl rounded-3xl p-6 sticky top-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-150">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <ShoppingBag size={20} className="text-amber-500" />
              <span>Current Order</span>
            </h2>
            {cartItems.length > 0 && (
              <button
                onClick={() => {
                  clearCart();
                  showToast('success', 'Cart Cleared', 'All items removed.');
                }}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold border border-rose-100 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart items scrollbox */}
          <div className="max-h-[300px] overflow-y-auto pr-1 mb-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ChefHat className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-xs font-semibold">Your checkout list is empty</p>
                <p className="text-[10px] text-slate-400">Select items from the catalog.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onUpdateQty={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>

          {/* Customer Metadata fields */}
          <div className="space-y-3 mb-6 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Client"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Order Notes (Optional)
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Less spicy, Extra cheese"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Payment Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'DIGITAL_CARD', 'UPI_QR'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-2 px-1 border-2 rounded-xl text-[10px] font-bold tracking-wider transition text-center uppercase flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === pm
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600 bg-white'
                    }`}
                  >
                    <CreditCard size={14} className={paymentMethod === pm ? 'text-amber-600' : 'text-slate-400'} />
                    {pm.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coupons Module */}
          <div className="mb-6 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Promo Coupon Code
            </label>
            {coupon ? (
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3">
                <div className="flex items-center space-x-2 text-xs">
                  <Tag size={14} className="text-emerald-600" />
                  <span className="font-bold">{coupon.code} Applied</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs font-semibold uppercase text-slate-700"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold shadow transition flex items-center"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>
            )}
            {couponStatus.message && (
              <span
                className={`block text-[10px] font-semibold mt-1.5 ${
                  couponStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {couponStatus.message}
              </span>
            )}
          </div>

          {/* Pricing breakdowns */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-slate-700">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Coupon Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Service Tax</span>
              <span className="font-bold text-slate-700">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-dashed border-slate-200">
              <span>Grand Total</span>
              <span className="text-amber-600 text-lg">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            onClick={handlePlaceOrder}
            disabled={orderLoading || cartItems.length === 0}
            className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-200 disabled:to-slate-300 text-white font-extrabold text-sm rounded-2xl shadow-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            {orderLoading ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <>
                <ChefHat size={18} />
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
