import api from './api';

export interface Order {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
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

export const dashboardService = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/dashboard/orders');
    return response.data;
  },

  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    const response = await api.patch<Order>(`/dashboard/orders/${id}/status`, {
      status,
    });
    return response.data;
  },

  updateUserLocalStatus: async (
    id: number,
    local_status: boolean,
    discount_percent: number
  ) => {
    const response = await api.patch(`/dashboard/users/${id}/local-status`, {
      local_status,
      discount_percent,
    });
    return response.data;
  },
};
