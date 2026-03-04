import api from './api';

export interface Product {
  id: number;
  name: string;
  price: number;
  available: boolean;
}

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products');
    return response.data;
  },

  updateAvailability: async (id: number, available: boolean): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}/availability`, {
      available,
    });
    return response.data;
  },
};
