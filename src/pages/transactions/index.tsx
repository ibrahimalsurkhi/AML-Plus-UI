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
import { DataPagination, extractPaginationData } from '@/components/common/DataPagination';
import { transactionService, type Transaction, type PaginatedResponse } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { KeenIcon } from '@/components/keenicons';
import { formatCurrency } from '@/utils/currency';

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
        const data = await transactionService.getTransactions({ 
          pageNumber: page, 
          pageSize,
          sortBy: 'id',
          sortDirection: 'desc'
        });
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

  const handleView = (transaction: Transaction) => {
    // Use UUID if available, otherwise fall back to ID
    const identifier = transaction.uuid || transaction.id;
    if (identifier) {
      navigate(`/transactions/${identifier}`);
    }
  };

  const handleSenderClick = (transaction: Transaction) => {
    // Use the senderRecordUuid for navigation
    const recordUuid = transaction.senderRecordUuid;
    if (recordUuid) {
      navigate(`/records/${recordUuid}`);
    } else {
      toast({
        title: 'Information',
        description: 'No record information available for this sender',
        variant: 'default'
      });
    }
  };

  const handleRecipientClick = (transaction: Transaction) => {
    // Use the recipientRecordUuid for navigation
    const recordUuid = transaction.recipientRecordUuid;
    if (recordUuid) {
      navigate(`/records/${recordUuid}`);
    } else {
      toast({
        title: 'Information',
        description: 'No record information available for this recipient',
        variant: 'default'
      });
    }
  };


  const formatAmount = (amount: number, currencyName?: string) => {
    return formatCurrency(amount, currencyName);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatUuid = (uuid: string) => {
    if (!uuid) return 'N/A';
    return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 4);
  };

  const getStatusColor = (transaction: Transaction) => {
    // Use transactionStatusId for color determination (primary method)
    const statusId = transaction.transactionStatusId || transaction.transactionStatus;
    
    switch (statusId) {
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
        <ToolbarHeading>
          <div className="flex items-center gap-2">
            <KeenIcon icon="credit-card" style="duotone" className="text-primary" />
            Transactions
          </div>
        </ToolbarHeading>
        <ToolbarActions>
          <Button onClick={handleCreate}>
            <KeenIcon icon="plus" style="duotone" className="mr-2" />
            Create Transaction
          </Button>
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
                      <TableHead>Sender</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.items.map((transaction) => (
                      <TableRow key={transaction.id || transaction.uuid} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="credit-card" style="outline" className="text-primary" />
                            {transaction.transactionID || transaction.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="sort" style="outline" className="text-muted-foreground" />
                            {transaction.transactionTypeName ||
                              `Type ${transaction.transactionTypeId}`}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="dollar" style="outline" className="text-green-600" />
                            {formatAmount(transaction.transactionAmount, transaction.transactionCurrencyName)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div 
                              className={`font-medium flex items-center gap-2 ${
                                transaction.senderRecordUuid 
                                  ? 'text-primary hover:text-primary-dark cursor-pointer transition-colors' 
                                  : 'text-muted-foreground'
                              }`}
                              onClick={() => transaction.senderRecordUuid && handleSenderClick(transaction)}
                            >
                              <KeenIcon 
                                icon={transaction.senderRecordUuid ? "link" : "user"} 
                                style="outline" 
                                className={transaction.senderRecordUuid ? "text-primary" : "text-muted-foreground"} 
                              />
                              {transaction.senderName || transaction.sender?.name || 'N/A'}
                              {transaction.senderRecordUuid && (
                                <KeenIcon 
                                  icon="external-link" 
                                  style="outline" 
                                  className="h-3 w-3 text-primary ml-1" 
                                />
                              )}
                            </div>
                            
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div 
                              className={`font-medium flex items-center gap-2 ${
                                transaction.recipientRecordUuid 
                                  ? 'text-primary hover:text-primary-dark cursor-pointer transition-colors' 
                                  : 'text-muted-foreground'
                              }`}
                              onClick={() => transaction.recipientRecordUuid && handleRecipientClick(transaction)}
                            >
                              <KeenIcon 
                                icon={transaction.recipientRecordUuid ? "link" : "user"} 
                                style="outline" 
                                className={transaction.recipientRecordUuid ? "text-primary" : "text-muted-foreground"} 
                              />
                              {transaction.recipientName || transaction.recipient?.name || 'N/A'}
                              {transaction.recipientRecordUuid && (
                                <KeenIcon 
                                  icon="external-link" 
                                  style="outline" 
                                  className="h-3 w-3 text-primary ml-1" 
                                />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction)}`}
                          >
                            <KeenIcon icon="shield-tick" style="outline" className="mr-1" />
                            {transaction.transactionStatusText}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <KeenIcon icon="calendar" style="outline" className="text-muted-foreground" />
                            {formatDate(transaction.transactionTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(transaction)}
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
              <div className="mt-6">
                <DataPagination
                  paginationData={extractPaginationData(transactions)}
                  onPageChange={setPageNumber}
                  showPageInfo={true}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <KeenIcon
                icon="credit-card"
                style="duotone"
                className="text-muted-foreground text-4xl mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground mb-4">
                There are no transactions in the system yet. Create your first transaction to get started.
              </p>
              <Button onClick={handleCreate}>
                <KeenIcon icon="plus" style="duotone" className="mr-2" />
                Create Your First Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default TransactionsPage;
