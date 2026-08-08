import axios from 'axios';

const api = axios.create({ baseURL: '/api/pos' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getPosProducts = async () => {
  const { data } = await api.get('/products');
  return data;
};

export const getPosCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

export const getPosSettings = async () => {
  const { data } = await api.get('/settings');
  return data;
};

export const updatePosSettings = async (settings) => {
  const { data } = await api.put('/settings', settings);
  return data;
};

export const togglePosFavorite = async (productId) => {
  const { data } = await api.post(`/products/${productId}/favorite`);
  return data;
};

export const createPosOrder = async (payload) => {
  const { data } = await api.post('/orders', payload);
  return data;
};

export const getPosOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data;
};

export const getPosOrder = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const payPosOrder = async (id, payload) => {
  const { data } = await api.post(`/orders/${id}/payment`, payload);
  return data;
};

export const holdPosOrder = async (id) => {
  const { data } = await api.post(`/orders/${id}/hold`);
  return data;
};

export const resumePosOrder = async (id) => {
  const { data } = await api.post(`/orders/${id}/resume`);
  return data;
};

export const cancelPosOrder = async (id) => {
  const { data } = await api.post(`/orders/${id}/cancel`);
  return data;
};

export const getPosStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};
