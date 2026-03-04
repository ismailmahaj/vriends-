import api from './api';

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  pickup_time: string;
  status: string;
  createdAt: string;
  orderItems: Array<{
    id: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      name: string;
      price: number;
    };
  }>;
}

export const orderService = {
  createOrder: async (items: OrderItem[], pickup_time: string): Promise<Order> => {
    const response = await api.post<Order>('/orders', {
      items,
      pickup_time,
    });
    return response.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders/my-orders');
    return response.data;
  },
};
