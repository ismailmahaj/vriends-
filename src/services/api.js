import axios from 'axios';

// Debug: Afficher l'URL utilisée
console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔍 Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
