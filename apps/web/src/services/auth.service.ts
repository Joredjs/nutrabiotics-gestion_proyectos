import { api } from '../lib/axios';
import { LoginDto, RegisterDto, AuthUser, User } from '@nutrabiotics-system/shared-types';

export const authService = {
  async login(data: LoginDto): Promise<AuthUser> {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  },

  async register(data: RegisterDto): Promise<AuthUser> {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async refreshTokens(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  }
};
