import { type TMenuConfig } from '@/components/menu';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'element-11',
    path: '/'
  },
  {
    title: 'Sanction Search',
    icon: 'parcel-tracking',
    path: '/sanction-search'
  },
  {
    title: 'Templates',
    icon: 'document',
    path: '/templates'
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
  },
  {
    title: 'Lookup',
    icon: 'sort', // changed to match Create Template icon
    path: '/lookup'
  },
  {
    title: 'Transaction Types',
    icon: 'sort',
    path: '/transaction-types'
  }
];

export const MENU_ROOT: TMenuConfig = [
  
];

// Minimal mega menu configuration
export const MENU_MEGA: TMenuConfig = [
  {
    title: 'Dashboard',
    path: '/'
  },
  {
    title: 'Sanction Search',
    path: '/sanction-search'
  },
  
];
