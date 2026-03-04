import api from './api';

export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const toggleProduct = async (id) => {
  const response = await api.patch(`/products/${id}/toggle`);
  return response.data;
};
