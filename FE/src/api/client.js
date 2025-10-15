import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('access');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
