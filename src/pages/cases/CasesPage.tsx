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
import {
  Toolbar,
  ToolbarHeading,
  ToolbarActions
} from '@/partials/toolbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { toast } from '@/components/ui/use-toast';
import { caseService } from '@/services/api';

interface CaseScreening {
  id: number;
  individualId: number | null;
  entityId: number | null;
  matchScore: number;
}

interface ScreeningHistory {
  id: number;
  noOfMatches: number;
  caseScreenings: CaseScreening[];
}

interface ActivityLog {
  id: number;
  description: string;
  action: string;
  module: string;
  created: string;
  createdBy: string;
}

interface CaseItem {
  id: number;
  recordId: number;
  fullName: string;
  score: number;
  mediumThreshold: number;
  exceedsMediumThreshold: boolean;
  status: string;
  source: string;
  screeningHistories: ScreeningHistory[];
  activityLogs: ActivityLog[];
}

interface PaginatedCases {
  items: CaseItem[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const CasesPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    totalPages: 0,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });

  const fetchCases = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const data = await caseService.getCases({ pageNumber: page, pageSize });
      setCases(data.items);
      setPagination({
        pageNumber: data.pageNumber,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        hasPreviousPage: data.hasPreviousPage,
        hasNextPage: data.hasNextPage
      });
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cases. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handlePageChange = (page: number) => {
    fetchCases(page);
  };

  const handleViewCase = (id: number) => {
    // You can navigate to a case details page if you have one
    // navigate(`/cases/${id}`);
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>Cases</ToolbarHeading>
          <ToolbarActions>{null}</ToolbarActions>
        </Toolbar>
        <Card>
          <CardHeader className="bg-gray-50/50 border-b px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Cases</h2>
              <div className="text-sm text-gray-500">
                Total: {pagination.totalCount} Cases
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <p>Loading cases...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No cases found</h3>
                <p className="text-gray-500 mb-4">No cases to display.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Medium Threshold</TableHead>
                      <TableHead>Exceeds Medium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewCase(item.id)}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.recordId}</TableCell>
                        <TableCell>{item.fullName}</TableCell>
                        <TableCell>{item.score}</TableCell>
                        <TableCell>{item.mediumThreshold}</TableCell>
                        <TableCell>{item.exceedsMediumThreshold ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.source}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCase(item.id);
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
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === pagination.pageNumber}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
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

export default CasesPage; 