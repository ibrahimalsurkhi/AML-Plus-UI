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
import { toast } from '@/components/ui/use-toast';
import { caseService, Case, PaginatedResponse } from '@/services/api';
import { FileText } from 'lucide-react';

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

// Using Case interface from API service instead of local CaseItem interface

const CaseStatusMap: Record<number, string> = {
  1: 'New',
  2: 'In Progress',
  3: 'Completed',
  4: 'Rejected',
  5: 'Closed'
};

const SourceTypeMap: Record<number, string> = {
  0: 'Web',
  1: 'Api'
};

const CasesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Case>>({
    items: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });
  const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({});

  const fetchCases = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      const response = await caseService.getCases({ pageNumber, pageSize: pagination.pageSize });
      setCases(response.items);
      setPagination(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch cases',
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
    navigate(`/cases/${id}`);
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
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
              <div className="text-sm text-gray-500">Total: {pagination.totalCount} Cases</div>
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
                      <TableHead>Exceeds Medium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewCase(item.id)}
                      >
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.recordId}</TableCell>
                        <TableCell>{item.fullName}</TableCell>
                        <TableCell>
                          <div
                            className="px-2 w-16 text-center py-1 rounded-md inline-block"
                            style={{
                              backgroundColor: item.riskLevelBGColor || item.scoreBGColor,
                              color: item.riskLevelColor
                            }}
                          >
                            {item.score}
                          </div>
                        </TableCell>
                        <TableCell>{item.exceedsTargetThreshold ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{CaseStatusMap[Number(item.status)] || item.status}</TableCell>
                        <TableCell>{SourceTypeMap[Number(item.source)] || item.source}</TableCell>
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

export default CasesPage;
