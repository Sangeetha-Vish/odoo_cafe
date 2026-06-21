import axios from 'axios';
import { attachAuthInterceptors } from '@shared-auth/authInterceptor.js';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

attachAuthInterceptors(api, { loginPath: '/login' });

export default api;
