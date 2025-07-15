import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { transactionTypeService, type TransactionType, type PaginatedResponse } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

const TransactionTypesPage = () => {
  const navigate = useNavigate();
  const [transactionTypes, setTransactionTypes] = useState<PaginatedResponse<TransactionType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  const fetchTransactionTypes = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const data = await transactionTypeService.getTransactionTypes({ page: page, pageSize });
      setTransactionTypes(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch transaction types');
      toast({ title: 'Error', description: 'Failed to fetch transaction types', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchTransactionTypes(pageNumber);
  }, [fetchTransactionTypes, pageNumber]);

  const handleCreate = () => {
    navigate('/transaction-types/new');
  };

  const handleEdit = (id: number) => {
    navigate(`/transaction-types/${id}`);
  };

  const handleSwitchActive = async (id: number) => {
    try {
      setSwitchingId(id);
      await transactionTypeService.switchActive(id);
      toast({ title: 'Success', description: 'Transaction type status updated' });
      fetchTransactionTypes(pageNumber);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update transaction type status', variant: 'destructive' });
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>Transaction Types</ToolbarHeading>
        <ToolbarActions>
          <Button onClick={handleCreate}>Create Transaction Type</Button>
        </ToolbarActions>
      </Toolbar>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Transaction Type List</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Sender Required</TableHead>
                  <TableHead>Recipient Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionTypes?.items.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.id}</TableCell>
                    <TableCell onClick={() => handleEdit(type.id)} className="cursor-pointer text-blue-600 hover:underline">{type.name}</TableCell>
                    <TableCell>{type.tenantName || '-'}</TableCell>
                    <TableCell>{type.isSenderRequired ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{type.isRecipientRequired ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        type.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(type.id)}>Edit</Button>
                      <Button 
                        size="sm" 
                        variant={type.isActive ? "destructive" : "default"}
                        onClick={() => handleSwitchActive(type.id)}
                        disabled={switchingId === type.id}
                      >
                        {switchingId === type.id ? 'Updating...' : (type.isActive ? 'Deactivate' : 'Activate')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {transactionTypes && transactionTypes.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))} />
            </PaginationItem>
            {[...Array(transactionTypes.totalPages)].map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink isActive={pageNumber === idx + 1} onClick={() => setPageNumber(idx + 1)}>
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setPageNumber((prev) => Math.min(prev + 1, transactionTypes.totalPages))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </Container>
  );
};

export default TransactionTypesPage; 