import axios from 'axios';

// Déterminer l'URL de l'API
// En production Railway, utiliser l'URL du backend
// En développement local, utiliser localhost
const getApiUrl = () => {
  // Si on est en production (pas localhost), utiliser l'URL Railway du backend
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // URL du backend en production Railway
    return 'https://vriends-backend-production.up.railway.app/api';
  }
  // Sinon, utiliser la variable d'environnement ou localhost par défaut
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

const apiUrl = getApiUrl();
console.log('🔍 API URL utilisée:', apiUrl);

const api = axios.create({
  baseURL: apiUrl
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
