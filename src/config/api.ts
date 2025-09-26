import.meta.env.DEV && console.debug('[MAIN] API Config loading');

// Conclusively fix the double /api issue by making the URL construction clear:
export const API_CONFIG = {
  baseURL: '/api',
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
