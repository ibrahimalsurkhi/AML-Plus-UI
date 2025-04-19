export const API_CONFIG = {
  baseURL: import.meta.env.VITE_APP_API_URL || 'https://localhost:5001/api',
  endpoints: {
    auth: {
      login: 'Auth/login',
    },
    search: {
      tenants: 'Tenants/search',
    },
  },
} as const; 