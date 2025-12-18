import apiClient from './client';
import { LoginRequest, SignupRequest, AuthResponse, User } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/v1/auth/login', data);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/v1/auth/signup', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/v1/auth/logout');
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/v1/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/v1/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  updateProfile: async (data: { name: string; email: string }): Promise<User> => {
    const response = await apiClient.put<User>('/v1/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/v1/auth/password', { currentPassword, newPassword });
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/v1/auth/account');
  },
};
