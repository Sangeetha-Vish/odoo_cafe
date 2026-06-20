import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productAPI = {
  getAll: () => api.get('/products').then((res) => res.data),
  getById: (id) => api.get(`/products/${id}`).then((res) => res.data),
};

export const tableAPI = {
  getAll: () => api.get('/tables').then((res) => res.data),
};

export const couponAPI = {
  validate: (code, cartTotal) =>
    api.post('/coupons/validate', { code, cartTotal }).then((res) => res.data),
};

export const orderAPI = {
  getAll: (status) =>
    api.get('/orders', { params: status ? { status } : {} }).then((res) => res.data),
  getById: (id) => api.get(`/orders/${id}`).then((res) => res.data),
  create: (orderData) => api.post('/orders', orderData).then((res) => res.data),
  updateStatus: (id, status) =>
    api.put(`/orders/${id}/status`, { status }).then((res) => res.data),
  updateItemStatus: (itemId, status) =>
    api.put(`/order-items/${itemId}/status`, { status }).then((res) => res.data),
};

export const waitlistAPI = {
  getQueue: () => api.get('/waitlist').then((res) => res.data),
  join: (customerName, groupSize) =>
    api.post('/waitlist', { customerName, groupSize }).then((res) => res.data),
  seat: (id, tableIds) =>
    api.post(`/waitlist/${id}/seat`, { tableIds }).then((res) => res.data),
};

export default api;
