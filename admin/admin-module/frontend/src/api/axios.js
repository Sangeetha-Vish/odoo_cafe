import axios from 'axios';
import { attachAuthInterceptors } from '@shared-auth/authInterceptor.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005',
});

attachAuthInterceptors(api, { loginPath: '/login' });

export default api;
