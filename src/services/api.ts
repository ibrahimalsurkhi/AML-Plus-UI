import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '@/config/api';
import { setupAxios } from '@/auth/_helpers';

export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
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
  }
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
  defaultScoreCriteriaId?: number | null;
  defaultScoreCriteria?: ScoreCriteria | null;
  countryOfBirthWeight?: number;
  nationalityWeight?: number;
  scoreToOpenCase?: number;
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
  TextArea = 6,
  Lookup = 7
}

export enum TemplateType {
  Record = 1,
  Account = 2,
  Transaction = 3
}

export interface TemplateField {
  id?: number;
  templateId?: number;
  sectionId?: number | null;
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
  lookupId?: number | null;
  readOnly?: boolean;
}

export interface TemplateSection {
  id: number;
  title: string;
  displayOrder: number;
  fields: TemplateField[];
}

export interface TemplateFieldsResponse {
  templateId: number;
  sections: TemplateSection[];
  fieldsWithoutSection: TemplateField[];
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

// Prepare Record Response Interfaces
export interface PrepareRecordTemplate {
  id: number;
  name: string;
  description: string;
  version: number;
  scoreToOpenCase: number;
  countryOfBirthWeight: number;
  nationalityWeight: number;
}

export interface PrepareRecordOption {
  id: number;
  value: string;
  displayOrder: number;
}

export interface PrepareRecordCustomField {
  id: number;
  templateId: number;
  label: string;
  fieldType: number;
  weight: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder: string | null;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  minDate: string | null;
  maxDate: string | null;
  pattern: string | null;
  lookupId: number | null;
  lookupName: string | null;
  lookupOptions: PrepareRecordOption[];
  scoreCriteria: any[];
}

export interface PrepareRecordScoreCriteria {
  id: number;
  key: string;
  bgColor: string;
  color: string;
  score: number;
}

export interface PrepareRecordSection {
  id: number;
  title: string;
  displayOrder: number;
  fields: PrepareRecordCustomField[];
}

export interface PrepareRecordResponse {
  template: PrepareRecordTemplate;
  countryOfBirthOptions: PrepareRecordOption[];
  nationalityOptions: PrepareRecordOption[];
  sections: PrepareRecordSection[];
  scoreCriteria: PrepareRecordScoreCriteria[];
}

export const templateService = {
  getTemplates: async (params: TemplateQueryParams): Promise<PaginatedResponse<Template>> => {
    const response = await api.get<PaginatedResponse<Template>>(
      API_CONFIG.endpoints.templates.list,
      { params }
    );
    return response.data;
  },
  getTemplateById: async (id: string): Promise<Template> => {
    const response = await api.get<Template>(`${API_CONFIG.endpoints.templates.list}/${id}`);
    return response.data;
  },
  getTemplateScoreCriteria: async (templateId: string): Promise<ScoreCriteria[]> => {
    const response = await api.get<ScoreCriteria[]>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria`
    );
    return response.data;
  },
  createScoreCriteria: async (
    templateId: string,
    data: Omit<ScoreCriteria, 'id' | 'templateId'>
  ): Promise<ScoreCriteria> => {
    const response = await api.post<ScoreCriteria>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria`,
      data
    );
    return response.data;
  },
  updateScoreCriteria: async (
    templateId: string,
    criteriaId: number,
    data: Omit<ScoreCriteria, 'id' | 'templateId'>
  ): Promise<ScoreCriteria> => {
    const response = await api.put<ScoreCriteria>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria/${criteriaId}`,
      data
    );
    return response.data;
  },
  deleteScoreCriteria: async (templateId: string, criteriaId: number): Promise<void> => {
    await api.delete(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/score-criteria/${criteriaId}`
    );
  },
  updateScoreToOpenCase: async (templateId: string, scoreToOpenCase: number): Promise<void> => {
    await api.put(`${API_CONFIG.endpoints.templates.list}/${templateId}/score-to-open-case`, {
      scoreToOpenCase
    });
  },
  getTemplateFields: async (templateId: string): Promise<TemplateFieldsResponse> => {
    const response = await api.get<TemplateFieldsResponse>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields`
    );
    return response.data;
  },
  createTemplateField: async (templateId: string, field: TemplateField): Promise<TemplateField> => {
    const response = await api.post<TemplateField>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields`,
      field
    );
    return response.data;
  },
  updateTemplateField: async (
    templateId: string,
    fieldId: number,
    field: TemplateField
  ): Promise<TemplateField> => {
    const response = await api.put<TemplateField>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}`,
      field
    );
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
  updateTemplateWeights: async (
    templateId: string,
    weights: { countryOfBirthWeight?: number; nationalityWeight?: number }
  ): Promise<void> => {
    await api.put(`${API_CONFIG.endpoints.templates.list}/${templateId}/weights`, weights);
  },
  getFieldOptions: async (templateId: string, fieldId: number): Promise<FieldOption[]> => {
    const response = await api.get<FieldOption[]>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options`
    );
    return response.data;
  },
  createFieldOption: async (
    templateId: string,
    fieldId: number,
    option: Omit<FieldOption, 'id' | 'fieldId'>
  ): Promise<FieldOption> => {
    const response = await api.post<FieldOption>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options`,
      option
    );
    return response.data;
  },
  updateFieldOption: async (
    templateId: string,
    fieldId: number,
    optionId: number,
    option: Omit<FieldOption, 'id' | 'fieldId'>
  ): Promise<FieldOption> => {
    const response = await api.put<FieldOption>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options/${optionId}`,
      {
        ...option,
        templateId: parseInt(templateId)
      }
    );
    return response.data;
  },
  deleteFieldOption: async (
    templateId: string,
    fieldId: number,
    optionId: number
  ): Promise<void> => {
    await api.delete(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/fields/${fieldId}/options/${optionId}`
    );
  },
  getTemplateScoreCriteriaRanges: async (
    templateId: string,
    fieldId: number
  ): Promise<ScoreCriteriaRange[]> => {
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
  // Section management methods
  createTemplateSection: async (
    templateId: string,
    data: Omit<TemplateSection, 'id' | 'fields'>
  ): Promise<TemplateSection> => {
    const response = await api.post<TemplateSection>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/sections`,
      data
    );
    return response.data;
  },
  updateTemplateSection: async (
    templateId: string,
    sectionId: number,
    data: Omit<TemplateSection, 'id' | 'fields'>
  ): Promise<TemplateSection> => {
    const response = await api.put<TemplateSection>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/sections/${sectionId}`,
      data
    );
    return response.data;
  },
  deleteTemplateSection: async (templateId: string, sectionId: number): Promise<void> => {
    await api.delete(`${API_CONFIG.endpoints.templates.list}/${templateId}/sections/${sectionId}`);
  },
  updateTemplateStatus: async (templateId: string, status: TemplateStatus): Promise<Template> => {
    const response = await api.put<Template>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/status`,
      {
        status
      }
    );
    return response.data;
  },
  updateTemplateDefaultScoreCriteria: async (
    templateId: string,
    defaultScoreCriteriaId: number | null
  ): Promise<void> => {
    await api.put(`${API_CONFIG.endpoints.templates.list}/${templateId}/default-score-criteria`, {
      defaultScoreCriteriaId
    });
  },
  prepareRecord: async (templateId: string): Promise<PrepareRecordResponse> => {
    const response = await api.get<PrepareRecordResponse>(`${API_CONFIG.endpoints.templates.list}/${templateId}/prepare-record`);
    return response.data;
  }
};

export interface FieldResponse {
  id: number;
  fieldId: number;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
}

export interface FieldResponseCreate {
  fieldId: number;
  optionId?: number | null;
  templateFieldScoreCriteriaId?: number | null;
  valueText?: string | null;
  valueNumber?: number | null;
  valueDate?: string | null;
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
  countryOfBirthLookupValueId: number;
  nationalityLookupValueId: number;
  identification: string;
  tenantId: number;
  fieldResponses: FieldResponse[];
  score: number;
  scoreBGColor: string;
  uuid: string;
  customerReferenceId?: string;
}

export interface RecordQueryParams {
  pageNumber: number;
  pageSize: number;
  templateId?: number;
  customerRefId?: string;
}

// Detailed Record interfaces for the new API response
export interface DetailedLookupValue {
  id: number;
  uuid: string;
  value: string;
  description: string | null;
  displayOrder: number;
  lookupId: number;
  lookupName: string;
}

export interface DetailedLookup {
  id: number;
  uuid: string;
  tenantId: number;
  templateFieldId: number | null;
  fieldType: number;
  name: string;
  key: string | null;
  isShared: boolean;
  values: DetailedLookupValue[];
}

export interface DetailedFieldResponse {
  id: number;
  fieldId: number;
  optionId: number | null;
  templateFieldScoreCriteriaId: number | null;
  templateScoreCriteriaId: number | null;
  score: number | null;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  fieldName: string;
  fieldLabel: string;
  fieldType: number;
  lookupValue: DetailedLookupValue | null;
  scoreCriteria: any | null;
}

export interface DetailedTemplateField {
  id: number;
  uuid: string;
  templateId: number;
  sectionId: number;
  lookupId: number | null;
  label: string;
  fieldType: number;
  weight: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder: string | null;
  minLength: number | null;
  maxLength: number | null;
  minValue: number | null;
  maxValue: number | null;
  minDate: string | null;
  maxDate: string | null;
  pattern: string | null;
  lookup: DetailedLookup | null;
  fieldResponse: DetailedFieldResponse | null;
}

export interface DetailedTemplateSection {
  id: number;
  uuid: string;
  templateId: number;
  title: string;
  displayOrder: number;
  fields: DetailedTemplateField[];
}

export interface DetailedTemplate {
  id: number;
  uuid: string;
  name: string;
  description: string;
}

export interface DetailedRecord {
  uuid: string;
  id: number;
  templateId: number;
  userId: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  identification: string;
  countryOfBirthLookupValueId: number;
  nationalityLookupValueId: number;
  customerReferenceId: string;
  countryOfBirthWeight?: number;
  nationalityWeight?: number;
  countryOfBirthLookupValue: DetailedLookupValue;
  nationalityLookupValue: DetailedLookupValue;
  template: DetailedTemplate;
  sections: DetailedTemplateSection[];
}

export const recordService = {
  getRecords: async (params: RecordQueryParams): Promise<PaginatedResponse<Record>> => {
    const { templateId, customerRefId, pageNumber, pageSize } = params;
    const endpoint = templateId
      ? `${API_CONFIG.endpoints.templates.list}/records`
      : API_CONFIG.endpoints.records.list.replace('{templateId}', 'all');

    // Use POST method with request body for server-side pagination and filtering
    const requestBody = {
      templateId: templateId, // Default template ID
      customerRefId: customerRefId || '',
      pageNumber,
      pageSize
    };

    const response = await api.post<PaginatedResponse<Record>>(endpoint, requestBody);
    return response.data;
  },
  getRecordById: async (recordId: string): Promise<Record> => {
    const response = await api.get<Record>(
      `${API_CONFIG.endpoints.templates.list}/records/${recordId}`
    );
    return response.data;
  },
  getRecordDetails: async (recordUuid: string): Promise<DetailedRecord> => {
    const response = await api.get<DetailedRecord>(
      `${API_CONFIG.endpoints.templates.list}/records/${recordUuid}`
    );
    return response.data;
  },
  createRecord: async (
    templateId: number,
    data: Omit<Record, 'id' | 'templateId' | 'templateName'>
  ): Promise<Record> => {
    const response = await api.post<Record>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/records`,
      data
    );
    return response.data;
  },
  updateRecord: async (
    templateId: number,
    recordId: number,
    data: Omit<Record, 'id' | 'templateId' | 'templateName'>
  ): Promise<Record> => {
    const response = await api.put<Record>(
      `${API_CONFIG.endpoints.templates.list}/${templateId}/records/${recordId}`,
      data
    );
    return response.data;
  },
  deleteRecord: async (templateId: number, recordId: number): Promise<void> => {
    await api.delete(`${API_CONFIG.endpoints.templates.list}/${templateId}/records/${recordId}`);
  }
};

export interface Case {
  id: number;
  recordId: number;
  fullName: string;
  score: number;
  scoreBGColor: string;
  targetThreshold: number;
  exceedsTargetThreshold: boolean;
  status: string;
  source: string;
  created?: string;
  noCaseNeed?: boolean;
  templateScoreCriteriaId?: number;
  riskLevel?: string;
  riskLevelBGColor?: string;
  riskLevelColor?: string;
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
  async getCases({
    pageNumber,
    pageSize
  }: {
    pageNumber: number;
    pageSize: number;
  }): Promise<PaginatedResponse<Case>> {
    const response = await api.post<PaginatedResponse<Case>>('/cases/search', {
      pageNumber, pageSize
    });
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
  scoreCriteriaId?: number;
  scoreCriteriaKey?: string;
  scoreCriteriaScore?: number;
  scoreCriteriaBGColor?: string;
  scoreCriteriaColor?: string;
}

export interface LookupQueryParams {
  pageNumber: number;
  pageSize: number;
}

export interface LookupValueQueryParams {
  templateId?: number;
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
  getLookupValues: async (
    lookupId: number,
    params: LookupValueQueryParams
  ): Promise<PaginatedResponse<LookupValue>> => {
    const response = await api.get<PaginatedResponse<LookupValue>>(`/Lookups/${lookupId}/values`, {
      params
    });
    return response.data;
  },
  getLookupValuesByKey: async (
    key: string,
    params: LookupValueQueryParams
  ): Promise<PaginatedResponse<LookupValue>> => {
    const response = await api.get<PaginatedResponse<LookupValue>>(
      `/Lookups/values/by-key/${key}`,
      {
        params
      }
    );
    return response.data;
  },
  getLookupValueById: async (id: number): Promise<LookupValue> => {
    const response = await api.get<LookupValue>(`/Lookups/values/${id}`);
    return response.data;
  },
  createLookupValue: async (
    lookupId: number,
    data: Omit<LookupValue, 'id' | 'lookupId'>
  ): Promise<LookupValue> => {
    const response = await api.post<LookupValue>(`/Lookups/${lookupId}/values`, data);
    return response.data;
  },
  updateLookupValue: async (
    id: number,
    data: Omit<LookupValue, 'lookupId'>
  ): Promise<LookupValue> => {
    const response = await api.put<LookupValue>(`/Lookups/values/${id}`, data);
    return response.data;
  },
  deleteLookupValue: async (id: number): Promise<void> => {
    await api.delete(`/Lookups/values/${id}`);
  }
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
  getTransactionTypes: async (
    params: TransactionTypeQueryParams
  ): Promise<PaginatedResponse<TransactionType>> => {
    const response = await api.get<PaginatedResponse<TransactionType>>(
      API_CONFIG.endpoints.transactionTypes.list,
      { params }
    );
    return response.data;
  },
  getTransactionTypeById: async (id: number): Promise<TransactionType> => {
    const response = await api.get<TransactionType>(
      `${API_CONFIG.endpoints.transactionTypes.details}/${id}`
    );
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
  }
};

export interface Rule {
  id?: number;
  name: string;
  ruleType: string | number;
  root?: any;
  isActive: boolean;
  tenantId: number;
}

export interface RuleListItem {
  id: number;
  name: string;
  ruleType: string | number;
  isActive: boolean;
  tenantId: number;
  ruleConditions: { id: number; condition: string }[];
}

export interface PaginatedRulesResponse {
  items: RuleListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const ruleService = {
  createRule: async (data: Omit<Rule, 'id'>): Promise<Rule> => {
    console.log('Posting rule to backend:', data);
    const response = await api.post<Rule>(API_CONFIG.endpoints.rules.create, data);
    return response.data;
  },
  getRules: async (pageNumber: number, pageSize: number): Promise<PaginatedRulesResponse> => {
    const response = await api.get<PaginatedRulesResponse>(`/Rules`, {
      params: { PageNumber: pageNumber, PageSize: pageSize }
    });
    return response.data;
  },
  getRuleById: async (id: number): Promise<Rule> => {
    const response = await api.get<Rule>(`/Rules/${id}`);
    return response.data;
  },
  activateRule: async (id: number, isActive: boolean): Promise<void> => {
    await api.put(`/Rules/${id}/status`, isActive, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export interface AccountQueryParams {
  recordId?: number;
  recordUUID?: string;
  number?: string;
  pageNumber: number;
  pageSize: number;
}

export const accountService = {
  getAccountsByRecordId: async (params: AccountQueryParams) => {
    const response = await api.post('/Accounts/by-record', params);
    return response.data;
  },
  createAccount: async (account: any) => {
    const response = await api.post('/Accounts', account);
    return response.data;
  }
};

// Transaction interfaces
export interface Transaction {
  id?: number;
  uuid?: string;
  transactionTypeId: number;
  transactionTypeName?: string;
  tenantId?: number;
  transactionStatus: number;
  transactionStatusId?: number;
  transactionStatusText?: string;
  transactionID: string;
  transactionTime: string;
  transactionAmount: number;
  transactionPurpose: string;
  currencyAmount: number;
  transactionCurrencyId: number;
  transactionCurrencyName?: string;
  senderId?: number;
  senderName?: string;
  senderNumber?: string;
  senderUuid?: string;
  senderRecordUuid?: string;
  recipientId?: number;
  recipientName?: string;
  recipientNumber?: string;
  recipientUuid?: string;
  recipientRecordUuid?: string;
  created?: string;
  createdBy?: string;
  processingStatus?: number;
  sender?: TransactionParticipant | null;
  recipient?: TransactionParticipant | null;
  fieldResponses?: TransactionFieldResponse[];
}

// New interfaces for the updated API response
export interface TransactionParticipant {
  id: number;
  name: string;
  number: string;
  bankOfCountryName: string;
  bankOfCity: string;
  accountStatus: number;
  record?: {
    id: number;
    templateName: string;
    recordName: string;
    dateOfBirth: string;
    identification: string;
    countryOfBirth: string;
    nationality: string;
    customerReferenceId: string;
  };
}

export interface TransactionFieldResponse {
  id: number;
  fieldId: number;
  fieldName: string;
  fieldLabel: string;
  optionId: number | null;
  optionValue: string | null;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  score: number | null;
  scoreCriteriaKey: string | null;
  scoreCriteriaBGColor: string | null;
  scoreCriteriaColor: string | null;
}

export interface TransactionCreate {
  transactionTypeId: number;
  transactionCurrencyId: number;
  transactionAmount: number;
  currencyAmount: number;
  transactionID: string;
  transactionTime: string;
  transactionPurpose: string;
  transactionStatus: number;
  senderId?: number;
  recipientId?: number;
  fieldResponses?: FieldResponseCreate[];
}

export enum TransactionProcessingStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3
}

export interface RuleMatch {
  ruleId: number;
  ruleName: string;
  isMatched: boolean;
  executedAt: string;
}

export interface TransactionProcessingStatusResponse {
  transactionId: number;
  processingStatus: TransactionProcessingStatus;
  transactionStatus: number;
  hasRuleMatches: boolean;
  matchedRulesCount: number;
  totalRulesEvaluated: number;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  ruleMatches: RuleMatch[];
}

// Transaction Case interfaces
export interface TransactionCase {
  id: number;
  caseUuid: string;
  tenantId: number;
  type: number;
  status: number;
  amount: number;
  currencyId: number;
  accountId: number | null;
  ruleExecutionId: number;
  recordName: string | null;
  created: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
}

// Extended interfaces for case details
export interface TransactionType {
  id: number;
  uuid: string;
  name: string;
  description: string;
}

export interface Currency {
  id: number;
  uuid: string;
  value: string;
  description: string;
}

export interface MatchedRule {
  id: number;
  uuid: string;
  name: string;
  ruleType: number;
  isActive: boolean;
  applyTo: number;
  created: string;
  createdBy: string;
}

// Rule details for preview
export interface RuleDetails {
  id: number;
  uuid: string;
  name: string;
  ruleType: number;
  isActive: boolean;
  applyTo: number;
  created: string;
  createdBy: string;
  description?: string;
  conditions?: RuleCondition[];
  actions?: RuleAction[];
}

export interface RuleCondition {
  id: number;
  field: string;
  ComparisonOperator: number; // Changed property name to match backend expectation
  value: string;
  logicalOperator?: string;
}

export interface RuleAction {
  id: number;
  actionType: string;
  parameters: { [key: string]: any };
}

export interface Account {
  id: number;
  uuid: string;
  name: string;
  number: string;
  bankOfCountryName: string;
  bankOfCity: string;
  creationDate: string;
  accountStatus: number;
}

export interface Record {
  id: number;
  uuid: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  identification: string;
}

export interface TransactionCaseDetails {
  uuid: string;
  id: number;
  tenantId: number;
  type: number;
  status: number;
  amount: number;
  currencyId: number;
  accountId: number;
  ruleExecutionId: number;
  created: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
  transactionType?: TransactionType;
  currency?: Currency;
  matchedRule?: MatchedRule;
  account?: Account;
  record?: Record;
}

// Field Response interfaces
export interface FieldResponseDetail {
  id: number;
  masterResponseId: number | null;
  fieldId: number;
  fieldName: string;
  optionId: number | null;
  optionValue: string | null;
  templateFieldScoreCriteriaId: number | null;
  templateScoreCriteriaId: number | null;
  score: number | null;
  templateScoreCriteria?: {
    id: number;
    templateId: number;
    key: string;
    bgColor: string;
    color: string;
    score: number;
  } | null;
  transactionId: number | null;
  accountId: number | null;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  created: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
}

// Field Response Service
export const fieldResponseService = {
  getFieldResponses: async (params: {
    masterResponseId?: number;
    transactionId?: number;
    accountId?: number;
  }): Promise<FieldResponseDetail[]> => {
    const queryParams = new URLSearchParams();
    if (params.masterResponseId)
      queryParams.append('MasterResponseId', params.masterResponseId.toString());
    if (params.transactionId) queryParams.append('TransactionId', params.transactionId.toString());
    if (params.accountId) queryParams.append('AccountId', params.accountId.toString());

    const response = await api.get<FieldResponseDetail[]>(
      `/FieldResponses?${queryParams.toString()}`
    );
    return response.data;
  }
};

// Custom Value interfaces
export interface CustomValueFilter {
  aggregateFieldId: number;
  comparisonOperator: number;
  jsonValue: string;
}

export interface CustomValue {
  id?: number;
  key: number;
  title: string;
  isAggregated: boolean;
  isAggregatedCustomField: boolean;
  aggregateFieldId: number | null;
  customFieldId: number | null;
  aggregateFunction: number | null;
  aggregationBy: number | null;
  filterBy: number | null;
  comparisonOperator: number | null;
  duration: number | null;
  durationType: number | null;
  lastTransactionCount: number | null;
  accountType: number | null;
  filters: CustomValueFilter[];
}

// Simplified interface for dropdown selections
export interface CustomValueOption {
  id: number;
  title: string;
}

export interface CreateCustomValueRequest {
  title: string;
  isAggregated: boolean;
  isAggregatedCustomField: boolean;
  aggregateFieldId: number | null;
  customFieldId: number | null;
  aggregateFunction: number | null;
  aggregationBy: number | null;
  filterBy: number | null;
  comparisonOperator: number | null;
  duration: number | null;
  durationType: number | null;
  lastTransactionCount: number | null;
  accountType: number | null;
  filters: CustomValueFilter[];
}

export const customValueService = {
  createCustomValue: async (data: CreateCustomValueRequest): Promise<CustomValue> => {
    console.log('Creating custom value with data:', data);
    const response = await api.post<CustomValue>('/CustomValues', data);
    console.log('Custom value creation response:', response.data);
    return response.data;
  },
  getCustomValues: async (params: {
    pageNumber: number;
    pageSize: number;
  }): Promise<PaginatedResponse<CustomValue>> => {
    const response = await api.get<PaginatedResponse<CustomValue>>('/CustomValues', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize
      }
    });
    return response.data;
  },
  getCustomValueOptions: async (): Promise<CustomValueOption[]> => {
    const response = await api.get<PaginatedResponse<CustomValue>>('/CustomValues', {
      params: {
        PageNumber: 1,
        PageSize: 100 // Get a large number to include all custom values
      }
    });
    // Transform the response to simplified options
    return response.data.items.map((item) => ({
      id: item.id || item.key,
      title: item.title
    }));
  },
  getCustomValueById: async (id: number): Promise<CustomValue> => {
    const response = await api.get<CustomValue>(`/api/CustomValues/${id}`);
    return response.data;
  },
  updateCustomValue: async (id: number, data: CreateCustomValueRequest): Promise<CustomValue> => {
    const response = await api.put<CustomValue>(`/api/CustomValues/${id}`, data);
    return response.data;
  },
  deleteCustomValue: async (id: number): Promise<void> => {
    await api.delete(`/api/CustomValues/${id}`);
  }
};

// Transaction prepare interfaces
export interface TransactionTemplate {
  id: number;
  name: string;
  description: string;
  version: number;
  scoreToOpenCase: number;
}

export interface TransactionTypeOption {
  id: number;
  name: string;
  isSenderRequired: boolean;
  isRecipientRequired: boolean;
}

export interface CurrencyOption {
  id: number;
  value: string;
  displayOrder: number;
}

export interface StatusOption {
  id: number;
  name: string;
  value: string;
}

export interface ProcessingStatusOption {
  id: number;
  name: string;
  value: string;
}

export interface CustomField {
  id: number;
  templateId: number;
  label: string;
  fieldType: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  minDate?: string;
  maxDate?: string;
  pattern?: string;
  lookupId?: number;
  lookupName?: string;
  lookupOptions: LookupOption[];
}

export interface LookupOption {
  id: number;
  value: string;
  displayOrder: number;
}

export interface TransactionPrepareResponse {
  transactionTemplates: TransactionTemplate[];
  transactionTypes: TransactionTypeOption[];
  currencyOptions: CurrencyOption[];
  statusOptions: StatusOption[];
  processingStatusOptions: ProcessingStatusOption[];
  customFields: CustomField[];
}

export const transactionService = {
  prepareTransaction: async (): Promise<TransactionPrepareResponse> => {
    const response = await api.get<TransactionPrepareResponse>('/transactions/prepare');
    return response.data;
  },
  createTransaction: async (data: TransactionCreate): Promise<number> => {
    console.log('Creating transaction with data:', data);
    const response = await api.post<number>(API_CONFIG.endpoints.transactions.create, data);
    console.log('Transaction creation response:', response.data);
    return response.data;
  },
  getTransactions: async (params: {
    pageNumber: number;
    pageSize: number;
    sortBy?: string;
    sortDirection?: string;
  }): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.post<PaginatedResponse<Transaction>>('/Transactions/search', {
      Page: params.pageNumber,
      PageSize: params.pageSize,
      SortBy: params.sortBy || 'id',
      SortDirection: params.sortDirection || 'desc'
    });
    return response.data;
  },
  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/Transactions/${id}/details`);
    return response.data;
  },
  getTransactionProcessingStatus: async (
    id: number
  ): Promise<TransactionProcessingStatusResponse> => {
    const response = await api.get<TransactionProcessingStatusResponse>(
      `/Transactions/${id}/processing-status`
    );
    return response.data;
  },
  getTransactionCases: async (params: {
    pageNumber: number;
    pageSize: number;
    accountId?: number;
  }): Promise<PaginatedResponse<TransactionCase>> => {
    const response = await api.get<PaginatedResponse<TransactionCase>>('/Transactions/cases', {
      params: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        accountId: params.accountId
      }
    });
    return response.data;
  },
  getTransactionCaseByUuid: async (uuid: string): Promise<TransactionCaseDetails> => {
    const response = await api.get<TransactionCaseDetails>(`/Transactions/cases/by-uuid/${uuid}`);
    return response.data;
  },
  getRuleDetails: async (ruleId: number): Promise<RuleDetails> => {
    const response = await api.get<RuleDetails>(`/Rules/${ruleId}`);
    return response.data;
  }
};
