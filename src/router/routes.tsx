import { type RouteObject } from 'react-router-dom';
import { SanctionSearchPage } from '@/pages/sanction-search';
import { DashboardPage } from '@/pages/dashboard';
import RecordsPage from '@/pages/records/RecordsPage';
import RecordDetailsPage from '@/pages/records/RecordDetailsPage';
import TransactionCasesPage from '@/pages/transaction-cases';
import TransactionCaseDetailsPage from '@/pages/transaction-cases/TransactionCaseDetailsPage';

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
  },
  {
    path: '/records/:id',
    element: <RecordDetailsPage />
  },
  {
    path: '/transaction-cases',
    element: <TransactionCasesPage />
  },
  {
    path: '/transaction-cases/:id',
    element: <TransactionCaseDetailsPage />
  }
];
