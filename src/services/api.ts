import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '@/config/api';
import { setupAxios } from '@/auth/_helpers';

export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup auth token interceptor
setupAxios(api);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  errorMessage: string | null;
  token: string;
  refreshToken: string | null;
  userId: string;
  userName: string;
  email: string;
  roles: string[] | null;
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(API_CONFIG.endpoints.auth.login, data);
    return response.data;
  },
}; 