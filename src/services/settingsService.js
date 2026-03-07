import api from './api';
import axios from 'axios';

// Récupérer toutes les settings
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

// Récupérer une setting spécifique (utilise axios directement pour les settings publiques)
export const getSetting = async (key) => {
  try {
    // Pour qr_code_url et qr_code_image_url, utiliser axios directement (public)
    if (key === 'qr_code_url' || key === 'qr_code_image_url') {
      const getApiUrl = () => {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          return 'https://vriends-backend-production.up.railway.app/api';
        }
        return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      };
      
      const baseURL = getApiUrl();
      const response = await axios.get(`${baseURL}/settings?key=${key}`);
      return response.data.value;
    }
    
    // Pour les autres settings, utiliser api (nécessite token)
    const response = await api.get(`/settings?key=${key}`);
    return response.data.value;
  } catch (error) {
    console.error(`Erreur récupération setting ${key}:`, error);
    throw error;
  }
};

// Mettre à jour une setting (admin seulement)
export const updateSetting = async (key, value) => {
  const response = await api.put('/settings', { key, value });
  return response.data;
};

// Récupérer l'URL du QR code (public, pas besoin de token)
export const getQRCodeUrl = async () => {
  try {
    const getApiUrl = () => {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://vriends-backend-production.up.railway.app/api';
      }
      return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    };
    
    const baseURL = getApiUrl();
    console.log('🔍 getQRCodeUrl: Appel API vers:', `${baseURL}/settings?key=qr_code_url`);
    
    const response = await axios.get(`${baseURL}/settings?key=qr_code_url`);
    
    console.log('🔍 getQRCodeUrl: Réponse complète:', response.data);
    console.log('🔍 getQRCodeUrl: Valeur récupérée:', response.data.value);
    
    if (response.data && response.data.value) {
      return response.data.value;
    }
    
    console.warn('⚠️ getQRCodeUrl: Aucune valeur dans la réponse');
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération URL QR code:', error);
    console.error('❌ Détails erreur:', error.response?.data || error.message);
    return null;
  }
};

// Récupérer l'URL de l'image QR code (public, pas besoin de token)
export const getQRCodeImageUrl = async () => {
  try {
    const getApiUrl = () => {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://vriends-backend-production.up.railway.app/api';
      }
      return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    };
    
    const baseURL = getApiUrl();
    const response = await axios.get(`${baseURL}/settings?key=qr_code_image_url`);
    return response.data.value;
  } catch (error) {
    console.error('Erreur récupération image QR code:', error);
    return null;
  }
};
