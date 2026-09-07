import api from './api';
import axios from 'axios';

const getPublicApiBase = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://vriends-backend-production.up.railway.app/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

export const getOrdersStatus = async () => {
  const { data } = await axios.get(`${getPublicApiBase()}/settings/orders-status`);
  return data;
};

export const getShopSettings = async () => {
  const { data } = await api.get('/settings/shop');
  return data;
};

export const updateShopSettings = async (payload) => {
  const { data } = await api.put('/settings/shop', payload);
  return data;
};

export const sendEmailTest = async (to) => {
  const { data } = await api.post('/settings/email-test', { to });
  return data;
};

export const getEmailLogs = async () => {
  const { data } = await api.get('/settings/email-logs');
  return data;
};
