import { type RouteObject } from 'react-router-dom';
import { SanctionSearchPage } from '@/pages/sanction-search';
import { DashboardPage } from '@/pages/dashboard';
import RecordsPage from '@/pages/records/RecordsPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <DashboardPage />
  },
  {
    path: '/sanction-search',
    element: <SanctionSearchPage />
  },
  {
    path: '/records',
    element: <RecordsPage />
  }
]; 