const apiBaseURL = import.meta.env.VITE_APP_API_URL || '/api';
console.log('API Base URL is:', apiBaseURL);

export const API_CONFIG = {
  baseURL: apiBaseURL,
  endpoints: {
    auth: {
      login: 'Auth/login'
    },
    search: {
      tenants: 'Tenants/search'
    },
    templates: {
      create: 'templates',
      list: 'templates'
    },
    records: {
      list: 'templates/records'
    },
    transactionTypes: {
      list: 'transactiontypes',
      create: 'transactiontypes',
      details: 'transactiontypes' // will use /transactiontypes/:id
    },
    transactions: {
      create: 'Transactions',
      list: 'Transactions',
      details: 'Transactions' // will use /Transactions/:id
    },
    rules: {
      create: 'rules',
      list: 'rules'
    }
  }
} as const;
