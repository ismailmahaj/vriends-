import api from './api';

export const createOrder = async ({ items, pickupTime, notes = '', cgvAccepted = false, address = null, orderType } = {}) => {
  const response = await api.post('/orders', {
    items,
    pickupTime,
    notes,
    cgvAccepted,
    address,
    orderType,
  });
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

export const updateOrderAddress = async (id, address, confirm = false) => {
  const response = await api.patch(`/orders/${id}/address`, { address, confirm });
  return response.data;
};
