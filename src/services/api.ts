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

export enum TemplateStatus {
  Draft = 0,
  Active = 1,
  Archived = 2
}

export interface Template {
  id: number;
  tenantId: number;
  tenantName: string;
  name: string;
  description: string;
  status: TemplateStatus;
  version: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface TemplateQueryParams {
  pageNumber: number;
  pageSize: number;
}

export interface ScoreCriteria {
  id: number;
  templateId: number;
  key: string;
  bgColor: string;
  color: string;
  score: number;
}

export const templateService = {
  getTemplates: async (params: TemplateQueryParams): Promise<PaginatedResponse<Template>> => {
    const response = await api.get<PaginatedResponse<Template>>(API_CONFIG.endpoints.templates.list, { params });
    return response.data;
  },
  getTemplateById: async (id: string): Promise<Template> => {
    const response = await api.get<Template>(`${API_CONFIG.endpoints.templates.list}/${id}`);
    return response.data;
  },
  getTemplateScoreCriteria: async (templateId: string): Promise<ScoreCriteria[]> => {
    const response = await api.get<ScoreCriteria[]>(`${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria`);
    return response.data;
  },
  createScoreCriteria: async (templateId: string, data: Omit<ScoreCriteria, 'id' | 'templateId'>): Promise<ScoreCriteria> => {
    const response = await api.post<ScoreCriteria>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria`,
      data
    );
    return response.data;
  },
  updateScoreCriteria: async (templateId: string, criteriaId: number, data: Omit<ScoreCriteria, 'id' | 'templateId'>): Promise<ScoreCriteria> => {
    const response = await api.put<ScoreCriteria>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria/${criteriaId}`,
      data
    );
    return response.data;
  },
  deleteScoreCriteria: async (templateId: string, criteriaId: number): Promise<void> => {
    await api.delete(`${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria/${criteriaId}`);
  }
}; 