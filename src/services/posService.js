import api from './api';

export const getPosProducts = async () => {
  const { data } = await api.get('/pos/products');
  return data;
};

export const getPosCategories = async () => {
  const { data } = await api.get('/pos/categories');
  return data;
};

export const getPosSettings = async () => {
  const { data } = await api.get('/pos/settings');
  return data;
};

export const updatePosSettings = async (settings) => {
  const { data } = await api.put('/pos/settings', settings);
  return data;
};

export const togglePosFavorite = async (productId) => {
  const { data } = await api.post(`/pos/products/${productId}/favorite`);
  return data;
};

export const createPosOrder = async (payload) => {
  const { data } = await api.post('/pos/orders', payload);
  return data;
};

export const getPosOrders = async (params = {}) => {
  const { data } = await api.get('/pos/orders', { params });
  return data;
};

export const getPosOrder = async (id) => {
  const { data } = await api.get(`/pos/orders/${id}`);
  return data;
};

export const payPosOrder = async (id, payload) => {
  const { data } = await api.post(`/pos/orders/${id}/payment`, payload);
  return data;
};

export const holdPosOrder = async (id) => {
  const { data } = await api.post(`/pos/orders/${id}/hold`);
  return data;
};

export const resumePosOrder = async (id) => {
  const { data } = await api.post(`/pos/orders/${id}/resume`);
  return data;
};

export const cancelPosOrder = async (id) => {
  const { data } = await api.post(`/pos/orders/${id}/cancel`);
  return data;
};

export const getPosStats = async () => {
  const { data } = await api.get('/pos/stats');
  return data;
};
