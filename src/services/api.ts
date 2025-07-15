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
  templateType: TemplateType;
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
  templateType?: TemplateType;
}

export interface ScoreCriteria {
  id: number;
  templateId: number;
  key: string;
  bgColor: string;
  color: string;
  score: number;
}

export enum FieldType {
  Text = 0,
  Dropdown = 1,
  Radio = 2,
  Checkbox = 3,
  Date = 4,
  Number = 5,
  TextArea = 6
}


export enum TemplateType {
  Record = 1,
  Account = 2,
  Transaction = 3
}

export interface TemplateField {
  id?: number;
  templateId?: number;
  label: string;
  fieldType: FieldType;
  weight: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  minDate?: string | null;
  maxDate?: string | null;
  pattern?: string | null;
}

export interface FieldOption {
  id?: number;
  fieldId?: number;
  label: string;
  scoreCriteriaId: number;
  displayOrder: number;
}

export interface ScoreCriteriaRange {
  id: number;
  fieldId: number;
  minValue: number;
  maxValue: number;
  scoreCriteriaId: number;
  displayOrder: number;
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
  },
  getTemplateFields: async (templateId: string): Promise<TemplateField[]> => {
    const response = await api.get<TemplateField[]>(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields`);
    return response.data;
  },
  createTemplateField: async (templateId: string, field: TemplateField): Promise<TemplateField> => {
    const response = await api.post<TemplateField>(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields`, field);
    return response.data;
  },
  updateTemplateField: async (templateId: string, fieldId: number, field: TemplateField): Promise<TemplateField> => {
    const response = await api.put<TemplateField>(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}`, field);
    return response.data;
  },
  deleteTemplateField: async (templateId: string, fieldId: number): Promise<void> => {
    await api.delete(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}`);
  },
  updateFieldWeight: async (templateId: string, fieldId: number, weight: number): Promise<void> => {
    await api.put(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/weight`, {
      weight
    });
  },
  getFieldOptions: async (templateId: string, fieldId: number): Promise<FieldOption[]> => {
    const response = await api.get<FieldOption[]>(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options`);
    return response.data;
  },
  createFieldOption: async (templateId: string, fieldId: number, option: Omit<FieldOption, 'id' | 'fieldId'>): Promise<FieldOption> => {
    const response = await api.post<FieldOption>(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options`, option);
    return response.data;
  },
  updateFieldOption: async (templateId: string, fieldId: number, optionId: number, option: Omit<FieldOption, 'id' | 'fieldId'>): Promise<FieldOption> => {
    const response = await api.put<FieldOption>(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options/${optionId}`, option);
    return response.data;
  },
  deleteFieldOption: async (templateId: string, fieldId: number, optionId: number): Promise<void> => {
    await api.delete(`${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options/${optionId}`);
  },
  getTemplateScoreCriteriaRanges: async (templateId: string, fieldId: number): Promise<ScoreCriteriaRange[]> => {
    const response = await api.get<ScoreCriteriaRange[]>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/score-criteria`
    );
    return response.data;
  },
  createScoreCriteriaRange: async (
    templateId: string, 
    fieldId: number, 
    data: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>
  ): Promise<ScoreCriteriaRange> => {
    const response = await api.post<ScoreCriteriaRange>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/score-criteria`,
      data
    );
    return response.data;
  },
  updateScoreCriteriaRange: async (
    templateId: string, 
    fieldId: number, 
    rangeId: number, 
    data: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>
  ): Promise<ScoreCriteriaRange> => {
    const response = await api.put<ScoreCriteriaRange>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/score-criteria/${rangeId}`,
      data
    );
    return response.data;
  },
  deleteScoreCriteriaRange: async (
    templateId: string, 
    fieldId: number, 
    rangeId: number
  ): Promise<void> => {
    await api.delete(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/score-criteria/${rangeId}`
    );
  },
  updateTemplateStatus: async (templateId: string, status: TemplateStatus): Promise<Template> => {
    const response = await api.put<Template>(`${API_CONFIG.endpoints.templates.list}/${templateId}/status`, {
      status
    });
    return response.data;
  },
};

export interface FieldResponse {
  id: number;
  fieldId: number;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
}

export interface Record {
  id: number;
  templateId: number;
  templateName: string;
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  country: number;
  nationality: number;
  identification: string;
  tenantId: number;
  fieldResponses: FieldResponse[];
  score: number;
  scoreBGColor: string;
}

export interface RecordQueryParams {
  pageNumber: number;
  pageSize: number;
  templateId?: number;
}

export const recordService = {
  getRecords: async (params: RecordQueryParams): Promise<PaginatedResponse<Record>> => {
    const { templateId, ...queryParams } = params;
    const endpoint = templateId 
      ? `${API_CONFIG.endpoints.templates.list}/records`
      : API_CONFIG.endpoints.records.list.replace('{templateId}', 'all');
    const response = await api.get<PaginatedResponse<Record>>(endpoint, { params: queryParams });
    return response.data;
  },
  getRecordById: async (templateId: number, recordId: number): Promise<Record> => {
    const response = await api.get<Record>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/records/${recordId}`
    );
    return response.data;
  },
  createRecord: async (templateId: number, data: Omit<Record, 'id' | 'templateId' | 'templateName'>): Promise<Record> => {
    const response = await api.post<Record>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/records`,
      data
    );
    return response.data;
  },
  updateRecord: async (templateId: number, recordId: number, data: Omit<Record, 'id' | 'templateId' | 'templateName'>): Promise<Record> => {
    const response = await api.put<Record>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/records/${recordId}`,
      data
    );
    return response.data;
  },
  deleteRecord: async (templateId: number, recordId: number): Promise<void> => {
    await api.delete(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/records/${recordId}`
    );
  }
};

export interface Case {
  id: number;
  recordId: number;
  fullName: string;
  score: number;
  scoreBGColor: string;
  mediumThreshold: number;
  exceedsMediumThreshold: boolean;
  status: string;
  source: string;
  created?: string;
  screeningHistories?: ScreeningHistory[];
  activityLogs?: ActivityLog[];
}

export interface ScreeningHistory {
  id: number;
  noOfMatches: number;
  caseScreenings: CaseScreening[];
}

export interface CaseScreening {
  id: number;
  individualId: number | null;
  individualName?: string;
  entityId: number | null;
  matchScore: number;
}

export interface ActivityLog {
  id: number;
  description: string;
  action: string;
  module: string;
  created: string;
  createdBy: string;
}

export const caseService = {
  async getCases({ pageNumber, pageSize }: { pageNumber: number; pageSize: number }): Promise<PaginatedResponse<Case>> {
    const response = await api.get<PaginatedResponse<Case>>('/cases', { params: { pageNumber, pageSize } });
    return response.data;
  },
  async getCaseById(id: number): Promise<Case> {
    const response = await api.get<Case>(`/cases/${id}`);
    return response.data;
  },
  async getCasesByRecordId(recordId: number): Promise<Case[]> {
    const response = await api.get<Case[]>(`/cases/by-record/${recordId}`);
    return response.data;
  }
}; 

// Lookup types
export interface Lookup {
  id: number;
  tenantId: number;
  name: string;
  isShared: boolean;
}

export interface LookupValue {
  id: number;
  lookupId: number;
  value: string;
}

export interface LookupQueryParams {
  pageNumber: number;
  pageSize: number;
}

export interface LookupValueQueryParams {
  pageNumber: number;
  pageSize: number;
}

export const lookupService = {
  getLookups: async (params: LookupQueryParams): Promise<PaginatedResponse<Lookup>> => {
    const response = await api.get<PaginatedResponse<Lookup>>(`/Lookups`, { params });
    return response.data;
  },
  getLookupById: async (id: number): Promise<Lookup> => {
    const response = await api.get<Lookup>(`/Lookups/${id}`);
    return response.data;
  },
  createLookup: async (data: Omit<Lookup, 'id'>): Promise<Lookup> => {
    const response = await api.post<Lookup>(`/Lookups`, data);
    return response.data;
  },
  updateLookup: async (id: number, data: Omit<Lookup, 'tenantId'>): Promise<Lookup> => {
    const response = await api.put<Lookup>(`/Lookups/${id}`, data);
    return response.data;
  },
  deleteLookup: async (id: number): Promise<void> => {
    await api.delete(`/Lookups/${id}`);
  },
  getLookupValues: async (lookupId: number, params: LookupValueQueryParams): Promise<PaginatedResponse<LookupValue>> => {
    const response = await api.get<PaginatedResponse<LookupValue>>(`/Lookups/${lookupId}/values`, { params });
    return response.data;
  },
  getLookupValueById: async (id: number): Promise<LookupValue> => {
    const response = await api.get<LookupValue>(`/Lookups/values/${id}`);
    return response.data;
  },
  createLookupValue: async (lookupId: number, data: Omit<LookupValue, 'id' | 'lookupId'>): Promise<LookupValue> => {
    const response = await api.post<LookupValue>(`/Lookups/${lookupId}/values`, data);
    return response.data;
  },
  updateLookupValue: async (id: number, data: Omit<LookupValue, 'lookupId'>): Promise<LookupValue> => {
    const response = await api.put<LookupValue>(`/Lookups/values/${id}`, data);
    return response.data;
  },
  deleteLookupValue: async (id: number): Promise<void> => {
    await api.delete(`/Lookups/values/${id}`);
  },
}; 

export interface TransactionType {
  id: number;
  name: string;
  tenantId?: number;
  tenantName?: string;
  isSenderRequired: boolean;
  isRecipientRequired: boolean;
  isActive: boolean;
}

export interface TransactionTypeQueryParams {
  page: number;
  pageSize: number;
}

export interface TransactionTypeCreate {
  name: string;
  isSenderRequired: boolean;
  isRecipientRequired: boolean;
  tenantId?: number;
}

export interface TransactionTypeUpdate {
  name: string;
  isSenderRequired: boolean;
  isRecipientRequired: boolean;
  tenantId?: number;
}

export const transactionTypeService = {
  getTransactionTypes: async (params: TransactionTypeQueryParams): Promise<PaginatedResponse<TransactionType>> => {
    const response = await api.get<PaginatedResponse<TransactionType>>(API_CONFIG.endpoints.transactionTypes.list, { params });
    return response.data;
  },
  getTransactionTypeById: async (id: number): Promise<TransactionType> => {
    const response = await api.get<TransactionType>(`${API_CONFIG.endpoints.transactionTypes.details}/${id}`);
    return response.data;
  },
  createTransactionType: async (data: TransactionTypeCreate): Promise<number> => {
    const response = await api.post<number>(API_CONFIG.endpoints.transactionTypes.create, data);
    return response.data;
  },
  updateTransactionType: async (id: number, data: TransactionTypeUpdate): Promise<void> => {
    await api.put(`${API_CONFIG.endpoints.transactionTypes.details}/${id}`, data);
  },
  deleteTransactionType: async (id: number): Promise<void> => {
    await api.delete(`${API_CONFIG.endpoints.transactionTypes.details}/${id}`);
  },
  switchActive: async (id: number): Promise<void> => {
    await api.put(`${API_CONFIG.endpoints.transactionTypes.details}/${id}/switch-active`);
  },
}; 