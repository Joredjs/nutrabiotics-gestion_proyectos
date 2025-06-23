import axios from 'axios';
import { AuthTokens } from '@nutrabiotics-system/shared-types';

const API_URL = import.meta.env.API_URL || 'http://localhost:3333/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autorización a las solicitudes
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('auth-tokens');
    if (tokens) {
      const parsedTokens: AuthTokens = JSON.parse(tokens);
      config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar la expiración del token y refrescarlo
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('auth-tokens');
        if (tokens) {
          const parsedTokens: AuthTokens = JSON.parse(tokens);
          const response = await api.post('/auth/refresh', {
            refreshToken: parsedTokens.refreshToken,
          });

          const newTokens = response.data.data;
          localStorage.setItem('auth-tokens', JSON.stringify(newTokens));

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si falla la actualización del token, redirigir al usuario a la página de inicio de sesión
        localStorage.removeItem('auth-tokens');
        localStorage.removeItem('auth-user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
