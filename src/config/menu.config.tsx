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
  },
  {
    title: 'Templates',
    icon: 'document',
    path: '/templates'
  },
  {
    title: 'Records',
    icon: 'folder-open',
    path: '/records'
  },
  {
    title: 'Cases',
    icon: 'gavel',
    path: '/cases'
  },
  {
    title: 'Create Template',
    icon: 'document',
    path: '/create-template'
  },
  {
    title: 'Lookup',
    icon: 'document', // changed to match Create Template icon
    path: '/lookup'
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
  },
  {
    title: 'Templates',
    icon: 'document',
    rootPath: '/templates',
    path: '/templates',
    childrenIndex: 2
  },
  {
    title: 'Records',
    icon: 'folder-open',
    rootPath: '/records',
    path: '/records',
    childrenIndex: 3
  },
  {
    title: 'Cases',
    icon: 'gavel',
    rootPath: '/cases',
    path: '/cases',
    childrenIndex: 4
  },
  {
    title: 'Lookup',
    icon: 'document', // changed to match Create Template icon
    rootPath: '/lookup',
    path: '/lookup',
    childrenIndex: 5
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
  },
  {
    title: 'Templates',
    path: '/templates'
  },
  {
    title: 'Records',
    path: '/records'
  },
  {
    title: 'Cases',
    path: '/cases'
  },
  {
    title: 'Lookup',
    path: '/lookup'
  }
];
