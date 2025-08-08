import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { transactionService, type Transaction, type PaginatedResponse } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PaginatedResponse<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);

  const fetchTransactions = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const data = await transactionService.getTransactions({ pageNumber: page, pageSize });
        setTransactions(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch transactions');
        toast({
          title: 'Error',
          description: 'Failed to fetch transactions',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchTransactions(pageNumber);
  }, [fetchTransactions, pageNumber]);

  const handleCreate = () => {
    navigate('/transactions/new');
  };

  const handleView = (id: number) => {
    navigate(`/transactions/${id}`);
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Active';
      case 2:
        return 'Inactive';
      case 3:
        return 'Blocked';
      case 4:
        return 'Suspended';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'text-green-600 bg-green-100';
      case 2:
        return 'text-gray-600 bg-gray-100';
      case 3:
        return 'text-red-600 bg-red-100';
      case 4:
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transactions...</p>
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
          <Button onClick={() => fetchTransactions(pageNumber)} variant="outline">
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>Transactions</ToolbarHeading>
        <ToolbarActions>
          <Button onClick={handleCreate}>Create Transaction</Button>
        </ToolbarActions>
      </Toolbar>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">All Transactions</h2>
              <p className="text-muted-foreground">
                Manage and view all transactions in the system
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions && transactions.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.items.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{transaction.transactionID}</TableCell>
                        <TableCell>
                          {transaction.transactionTypeName ||
                            `Type ${transaction.transactionTypeId}`}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(transaction.transactionAmount)}
                        </TableCell>
                        <TableCell>
                          {transaction.transactionCurrencyName ||
                            `Currency ${transaction.transactionCurrencyId}`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.senderName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.senderNumber || 'No account'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.recipientName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.recipientNumber || 'No account'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.transactionStatus)}`}
                          >
                            {getStatusLabel(transaction.transactionStatus)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(transaction.transactionTime)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(transaction.id!)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {transactions.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {transactions.hasPreviousPage && (
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                          />
                        </PaginationItem>
                      )}
                      {[...Array(transactions.totalPages)].map((_, idx) => (
                        <PaginationItem key={idx}>
                          <PaginationLink
                            isActive={pageNumber === idx + 1}
                            onClick={() => setPageNumber(idx + 1)}
                          >
                            {idx + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      {transactions.hasNextPage && (
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setPageNumber((prev) => Math.min(prev + 1, transactions.totalPages))
                            }
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-muted-foreground mb-4">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                <p className="text-muted-foreground">
                  There are no transactions in the system yet.
                </p>
              </div>
              <Button onClick={handleCreate}>Create Your First Transaction</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default TransactionsPage;
