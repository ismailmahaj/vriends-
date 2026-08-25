import api from './api';

export const searchCustomers = async (q) => {
  const response = await api.get('/auth/customers/search', { params: { q } });
  return response.data;
};

export const createCustomer = async (payload) => {
  const response = await api.post('/auth/customers', payload);
  return response.data;
};
