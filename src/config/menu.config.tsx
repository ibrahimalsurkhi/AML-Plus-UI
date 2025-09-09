import { type TMenuConfig } from '@/components/menu';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'element-11',
    path: '/'
  },
  {
    title: 'Screening & Monitoring',
    icon: 'shield-tick',
    children: [
      {
        title: 'Sanction Search',
        icon: 'parcel-tracking',
        path: '/sanction-search'
      }
    ]
  },
  {
    title: 'Compliance Management',
    icon: 'document',
    children: [
      
      {
        title: 'Transaction Monitoring',
        icon: 'sort',
        path: '/transactions'
      },
      {
        title: 'Transaction Cases',
        icon: 'shield-tick',
        path: '/transaction-cases'
      },
      {
        title: 'Records',
        icon: 'simcard-2',
        path: '/records'
      },
      {
        title: 'Cases',
        icon: 'devices-2',
        path: '/cases'
      }
    ]
  },
  {
    title: 'Data & Analytics',
    icon: 'sort',
    children: [
      {
        title: 'Lookup',
        icon: 'sort',
        path: '/lookup'
      },
      {
        title: 'Transaction Types',
        icon: 'sort',
        path: '/transaction-types'
      },
      {
        title: 'Rule Builder',
        icon: 'document',
        path: '/rules'
      },
      {
        title: 'Templates',
        icon: 'document',
        path: '/templates'
      },
    ]
  }
];

export const MENU_ROOT: TMenuConfig = [];

// Minimal mega menu configuration
export const MENU_MEGA: TMenuConfig = [
  {
    title: 'Dashboard',
    path: '/'
  },
  {
    title: 'Screening & Monitoring',
    children: [
      {
        title: 'Sanction Search',
        path: '/sanction-search'
      },
      {
        title: 'Transaction Monitoring',
        path: '/transactions'
      }
    ]
  },
  {
    title: 'Compliance Management',
    children: [
      {
        title: 'Rule Builder',
        path: '/rules'
      },
      {
        title: 'Templates',
        path: '/templates'
      }
    ]
  },
  {
    title: 'Case Management',
    children: [
      {
        title: 'Cases',
        path: '/cases'
      },
      {
        title: 'Transaction Cases',
        path: '/transaction-cases'
      }
    ]
  }
];
