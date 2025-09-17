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
import { Badge } from '@/components/ui/badge';
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
import { AlertTriangle, Shield } from 'lucide-react';

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

// Helper function to get status variant for badges
const getStatusVariant = (status: number): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 1: return "outline"; // New
    case 2: return "default"; // In Progress
    case 3: return "secondary"; // Completed
    case 4: return "destructive"; // Rejected
    case 5: return "secondary"; // Closed
    default: return "outline";
  }
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
          <CardHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Cases</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Compliance cases and risk assessments
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xl font-semibold text-gray-900">{pagination.totalCount}</div>
                  <div className="text-xs text-gray-500">Total Cases</div>
                </div>
                {cases.length > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>High Risk: {cases.filter(c => c.riskLevel?.toLowerCase() === 'high').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Exceeds: {cases.filter(c => c.exceedsTargetThreshold).length}</span>
                    </div>
                  </div>
                )}
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
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((item) => {
                      const exceedsThreshold = item.exceedsTargetThreshold;
                      const isHighRisk = item.riskLevel?.toLowerCase() === 'high';

                      return (
                        <TableRow
                          key={item.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            isHighRisk ? 'border-l-2 border-l-red-500' : ''
                          }`}
                          onClick={() => handleViewCase(item.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {isHighRisk && <AlertTriangle className="h-3 w-3 text-red-500" />}
                              #{item.id}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{item.fullName}</div>
                              <div className="text-xs text-gray-500">Record: {item.recordId}</div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: item.scoreBGColor || '#f3f4f6',
                                    color: (item.riskLevelColor && item.riskLevelColor !== null) ? item.riskLevelColor : '#374151'
                                  }}
                                >
                                  {item.score?.toFixed(2)}
                                </div>
                                {exceedsThreshold && (
                                  <Badge variant="destructive" className="text-xs h-5">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Exceeds
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Target: {item.targetThreshold?.toFixed(2)}
                                {exceedsThreshold && (
                                  <span className="text-red-600 font-medium ml-1">
                                    (+{((item.score - item.targetThreshold) || 0).toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {item.riskLevel ? (
                              <div className="flex items-center gap-2">
                                {isHighRisk ? (
                                  <AlertTriangle className="h-3 w-3 text-red-600" />
                                ) : (
                                  <Shield className="h-3 w-3 text-gray-400" />
                                )}
                                <span className={`text-sm font-medium ${
                                  item.riskLevel?.toLowerCase() === 'high' ? 'text-red-600' : 
                                  item.riskLevel?.toLowerCase() === 'medium' ? 'text-yellow-600' : 
                                  'text-gray-600'
                                }`}>
                                  {item.riskLevel}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge 
                              variant={getStatusVariant(Number(item.status))}
                              className="text-xs"
                            >
                              {(item as any).statusString || CaseStatusMap[Number(item.status)] || item.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {(item as any).sourceString || SourceTypeMap[Number(item.source)] || item.source}
                              </div>
                              {((item as any).templateName || item.templateScoreCriteriaId) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Template: {(item as any).templateName || item.templateScoreCriteriaId}
                                </div>
                              )}
                            </div>
                          </TableCell>

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
                      );
                    })}
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
