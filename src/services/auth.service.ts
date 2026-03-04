import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  local_status: boolean;
  discount_percent: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};
