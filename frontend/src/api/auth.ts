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

  // 이메일 인증
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post('/v1/auth/verify-email', { token });
  },

  // 인증 이메일 재발송
  resendVerification: async (email: string): Promise<void> => {
    await apiClient.post('/v1/auth/resend-verification', { email });
  },

  // 비밀번호 찾기 (재설정 이메일 발송)
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/v1/auth/forgot-password', { email });
  },

  // 비밀번호 재설정
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/v1/auth/reset-password', { token, newPassword });
  },

  // 비밀번호 재설정 토큰 유효성 검사
  validateResetToken: async (token: string): Promise<boolean> => {
    const response = await apiClient.get<boolean>('/v1/auth/validate-reset-token', {
      params: { token },
    });
    return response.data;
  },
};
