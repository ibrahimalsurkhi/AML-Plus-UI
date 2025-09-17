import React, { useCallback, useEffect, useState } from 'react';
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
import { DataPagination, extractPaginationData } from '@/components/common/DataPagination';
import { recordService, type Record, type PaginatedResponse } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

const RecordsPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PaginatedResponse<Record> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);

  const fetchRecords = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const data = await recordService.getRecords({
          pageNumber: page,
          pageSize
        });
        setRecords(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch records');
        toast({
          title: 'Error',
          description: 'Failed to fetch records. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchRecords(pageNumber);
  }, [fetchRecords, pageNumber]);

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleViewRecord = (id: string) => {
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
              <div className="text-sm text-gray-500">
                {records ? `Total: ${records.totalCount} Records` : 'Loading...'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <p>Loading records...</p>
              </div>
            ) : records && records.items.length === 0 ? (
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
                    {records?.items.map((record) => (
                      <TableRow
                        key={record.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewRecord(record.uuid)}
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
                              handleViewRecord(record.uuid);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {records && records.totalPages > 1 && (
                  <div className="p-4 border-t">
                    <DataPagination
                      paginationData={extractPaginationData(records)}
                      onPageChange={handlePageChange}
                      showPageInfo={true}
                    />
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
