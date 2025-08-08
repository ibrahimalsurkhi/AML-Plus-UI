import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { recordService, type Record, type PaginatedResponse } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

const RecordsPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<{
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }>({
    pageNumber: 1,
    totalPages: 0,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });

  const fetchRecords = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await recordService.getRecords({
        pageNumber: page,
        pageSize: pageSize
      });
      setRecords(response.items);
      setPagination({
        pageNumber: response.pageNumber,
        totalPages: response.totalPages,
        totalCount: response.totalCount,
        hasPreviousPage: response.hasPreviousPage,
        hasNextPage: response.hasNextPage
      });
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch records. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handlePageChange = (page: number) => {
    fetchRecords(page);
  };

  const handleViewRecord = (id: number) => {
    navigate(`/records/${id}`);
  };

  return (
    <Container>
      <div className="space-y-6">
        {' '}
        <Toolbar>
          {' '}
          <ToolbarHeading>Records</ToolbarHeading>{' '}
          <ToolbarActions>
            {' '}
            <Button onClick={() => navigate('/records/new')}> Create New Record </Button>{' '}
          </ToolbarActions>{' '}
        </Toolbar>
        <Card>
          <CardHeader className="bg-gray-50/50 border-b px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Records</h2>
              <div className="text-sm text-gray-500">Total: {pagination.totalCount} Records</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <p>Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No records found</h3>
                <p className="text-gray-500 mb-4">Create your first record to get started</p>
                <Button variant="outline" onClick={() => navigate('/records/new')}>
                  Create New Record
                </Button>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Identification</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow
                        key={record.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewRecord(record.id)}
                      >
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell>{record.templateName}</TableCell>
                        <TableCell>
                          {record.firstName} {record.middleName && `${record.middleName} `}
                          {record.lastName}
                        </TableCell>
                        <TableCell>{formatDate(record.dateOfBirth)}</TableCell>
                        <TableCell>{record.identification}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRecord(record.id);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pagination.totalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        {pagination.hasPreviousPage && (
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(pagination.pageNumber - 1)}
                            />
                          </PaginationItem>
                        )}

                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === pagination.pageNumber}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}

                        {pagination.hasNextPage && (
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(pagination.pageNumber + 1)}
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default RecordsPage;
