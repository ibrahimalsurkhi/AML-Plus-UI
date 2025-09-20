import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TransactionCasesTable from '@/components/transactions/TransactionCasesTable';
import {
  transactionService,
  transactionTypeService,
  type TransactionCase,
  type PaginatedResponse,
  type TransactionType
} from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { KeenIcon } from '@/components/keenicons';

const TransactionCasesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<PaginatedResponse<TransactionCase> | null>(null);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [accountIdFilter, setAccountIdFilter] = useState<string>('');

  const fetchCases = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params: { pageNumber: number; pageSize: number; accountId?: number } = {
          pageNumber: page,
          pageSize
        };

        // Add account ID filter if provided
        if (accountIdFilter.trim()) {
          const accountId = parseInt(accountIdFilter.trim());
          if (!isNaN(accountId)) {
            params.accountId = accountId;
          }
        }

        const data = await transactionService.getTransactionCases(params);
        setCases(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch transaction cases');
        toast({
          title: 'Error',
          description: 'Failed to fetch transaction cases',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    },
    [pageSize, accountIdFilter]
  );

  // Fetch transaction types for display
  const fetchTransactionTypes = useCallback(async () => {
    try {
      const response = await transactionTypeService.getTransactionTypes({ page: 1, pageSize: 100 });
      setTransactionTypes(response.items);
    } catch (err) {
      console.error('Failed to fetch transaction types:', err);
    }
  }, []);

  useEffect(() => {
    fetchCases(pageNumber);
    fetchTransactionTypes();
  }, [fetchCases, fetchTransactionTypes, pageNumber]);

  // Initialize account ID filter from URL params
  useEffect(() => {
    const accountId = searchParams.get('accountId');
    if (accountId) {
      setAccountIdFilter(accountId);
    }
  }, [searchParams]);

  const handleView = (uuid: string) => {
    navigate(`/transaction-cases/${uuid}`);
  };

  const handleFilterChange = (value: string) => {
    setAccountIdFilter(value);
    setPageNumber(1);

    // Update URL params
    if (value.trim()) {
      setSearchParams({ accountId: value });
    } else {
      setSearchParams({});
    }
  };


  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transaction cases...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchCases(pageNumber)}>Try Again</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <div className="flex items-center gap-2">
            <KeenIcon icon="shield-tick" style="duotone" className="text-primary" />
            Transaction Cases
          </div>
        </ToolbarHeading>
        <ToolbarActions>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="accountIdFilter" className="text-sm whitespace-nowrap">
                Account ID:
              </Label>
              <Input
                id="accountIdFilter"
                type="number"
                placeholder="Filter by account ID"
                value={accountIdFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-32"
              />
              <Button variant="outline" size="sm" onClick={() => handleFilterChange('')}>
                Clear
              </Button>
            </div>
            <Button onClick={() => navigate('/transactions/new')}>
              <KeenIcon icon="plus" style="duotone" className="mr-2" />
              Create Transaction
            </Button>
          </div>
        </ToolbarActions>
      </Toolbar>

      <div className="mt-6">
        <TransactionCasesTable
          cases={cases}
          transactionTypes={transactionTypes}
          loading={loading}
          error={error}
          pageNumber={pageNumber}
          onPageChange={setPageNumber}
          showPagination={true}
          compact={false}
        />
      </div>
    </Container>
  );
};

export default TransactionCasesPage;
