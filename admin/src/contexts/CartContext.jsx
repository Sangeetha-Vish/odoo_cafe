import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [selectedTables, setSelectedTables] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // default

  // Load state from localStorage on init if available
  useEffect(() => {
    const savedTables = localStorage.getItem('odoo_pos_tables');
    if (savedTables) {
      try {
        setSelectedTables(JSON.parse(savedTables));
      } catch (e) {
        console.error('Error parsing tables from storage', e);
      }
    }
  }, []);

  // Sync selected tables to localStorage
  const handleSetSelectedTables = (tables) => {
    const validTables = Array.isArray(tables) ? tables : [];
    setSelectedTables(validTables);
    if (validTables.length > 0) {
      localStorage.setItem('odoo_pos_tables', JSON.stringify(validTables));
    } else {
      localStorage.removeItem('odoo_pos_tables');
    }
  };

  const toggleTableSelection = (table) => {
    setSelectedTables((prev) => {
      const exists = prev.find((t) => t.id === table.id);
      let updated;
      if (exists) {
        updated = prev.filter((t) => t.id !== table.id);
      } else {
        updated = [...prev, table];
      }
      localStorage.setItem('odoo_pos_tables', JSON.stringify(updated));
      return updated;
    });
  };

  const clearSelectedTables = () => {
    setSelectedTables([]);
    localStorage.removeItem('odoo_pos_tables');
  };

  const addItem = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setCustomerName('');
    setOrderNotes('');
    setPaymentMethod('CASH');
  };

  // derived calculations
  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  };

  const calculateTax = () => {
    return cartItems.reduce((acc, item) => {
      const itemSubtotal = item.product.price * item.quantity;
      const itemTax = (itemSubtotal * (item.product.tax || 0)) / 100;
      return acc + itemTax;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!coupon) return 0;
    const subtotal = calculateSubtotal();
    let disc = 0;
    if (coupon.type === 'PERCENTAGE') {
      disc = (subtotal * coupon.value) / 100;
    } else if (coupon.type === 'FIXED') {
      disc = coupon.value;
    }
    return Math.min(disc, subtotal);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discount = calculateDiscount();
    return Math.max(0, subtotal + tax - discount);
  };

  return (
    <CartContext.Provider
      value={{
        selectedTables,
        setSelectedTables: handleSetSelectedTables,
        toggleTableSelection,
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
        removeItem,
        updateQuantity,
        clearCart,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        discount: calculateDiscount(),
        total: calculateTotal(),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
