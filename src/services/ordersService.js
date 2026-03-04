import api from './api';

export const createOrder = async (items, pickupTime, totalPrice) => {
  const response = await api.post('/orders', { items, pickupTime });
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/orders/me');
  return response.data;
};

export const getAllOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const updateStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};
