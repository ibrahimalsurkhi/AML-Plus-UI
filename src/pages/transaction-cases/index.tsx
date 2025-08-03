import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { transactionService, transactionTypeService, type TransactionCase, type PaginatedResponse, type TransactionType } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
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

  const fetchCases = useCallback(async (page = 1) => {
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
      toast({ title: 'Error', description: 'Failed to fetch transaction cases', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pageSize, accountIdFilter]);

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

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'Active';
      case 2: return 'Inactive';
      case 3: return 'Blocked';
      case 4: return 'Suspended';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-gray-600 bg-gray-100';
      case 3: return 'text-red-600 bg-red-100';
      case 4: return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type: number) => {
    const transactionType = transactionTypes.find(t => t.id === type);
    return transactionType?.name || `Type ${type}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatUuid = (uuid: string) => {
    return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 4);
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
              <Label htmlFor="accountIdFilter" className="text-sm whitespace-nowrap">Account ID:</Label>
              <Input
                id="accountIdFilter"
                type="number"
                placeholder="Filter by account ID"
                value={accountIdFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-32"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleFilterChange('')}
              >
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

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Transaction Cases</h2>
              <p className="text-muted-foreground mt-1">
                Monitor and manage transaction cases generated by rule engine
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {cases && (
                <span>
                  Showing {((pageNumber - 1) * pageSize) + 1} to {Math.min(pageNumber * pageSize, cases.totalCount)} of {cases.totalCount} cases
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cases && cases.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case UUID</TableHead>
                      <TableHead>Record Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.items.map((caseItem) => (
                      <TableRow key={caseItem.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="shield-tick" style="outline" className="text-primary" />
                            {formatUuid(caseItem.caseUuid)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {caseItem.recordName ? (
                            <div className="flex items-center gap-2">
                              <KeenIcon icon="user" style="outline" className="text-muted-foreground" />
                              {caseItem.recordName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">No record</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="sort" style="outline" className="text-muted-foreground" />
                            {getTypeLabel(caseItem.type)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(caseItem.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                            {getStatusLabel(caseItem.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(caseItem.created)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(caseItem.caseUuid)}
                            className="h-8 px-2"
                          >
                            <KeenIcon icon="eye" style="outline" className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {cases.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                          className={pageNumber === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, cases.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setPageNumber(page)}
                              isActive={pageNumber === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPageNumber(Math.min(cases.totalPages, pageNumber + 1))}
                          className={pageNumber === cases.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <KeenIcon icon="shield-tick" style="duotone" className="text-muted-foreground text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transaction Cases</h3>
              <p className="text-muted-foreground mb-4">
                No transaction cases found. Cases will appear here when rules are triggered.
              </p>
              <Button onClick={() => navigate('/transactions/new')}>
                <KeenIcon icon="plus" style="duotone" className="mr-2" />
                Create Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default TransactionCasesPage; 