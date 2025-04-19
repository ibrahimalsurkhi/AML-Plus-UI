import { type TMenuConfig } from '@/components/menu';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'element-11',
    path: '/'
  },
  {
    title: 'Sanction Search',
    icon: 'search',
    path: '/sanction-search'
  }
];

export const MENU_ROOT: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'element-11',
    rootPath: '/',
    path: '/',
    childrenIndex: 0
  },
  {
    title: 'Sanction Search',
    icon: 'search',
    rootPath: '/sanction-search',
    path: '/sanction-search',
    childrenIndex: 1
  }
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
  }
];
