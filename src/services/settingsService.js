import api from './api';
import axios from 'axios';

// Récupérer toutes les settings
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

// Récupérer une setting spécifique
export const getSetting = async (key) => {
  const response = await api.get(`/settings?key=${key}`);
  return response.data.value;
};

// Mettre à jour une setting (admin seulement)
export const updateSetting = async (key, value) => {
  const response = await api.put('/settings', { key, value });
  return response.data;
};

// Récupérer l'URL du QR code (public, pas besoin de token)
export const getQRCodeUrl = async () => {
  try {
    // Utiliser axios directement sans passer par l'intercepteur qui ajoute le token
    // Déterminer l'URL de l'API (même logique que api.js)
    const getApiUrl = () => {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://vriends-backend-production.up.railway.app/api';
      }
      return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    };
    
    const baseURL = getApiUrl();
    const response = await axios.get(`${baseURL}/settings?key=qr_code_url`);
    return response.data.value;
  } catch (error) {
    console.error('Erreur récupération URL QR code:', error);
    // Retourner null en cas d'erreur, le code utilisera les fallbacks
    return null;
  }
};
