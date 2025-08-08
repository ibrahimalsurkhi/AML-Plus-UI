import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ruleService, RuleListItem, PaginatedRulesResponse } from '@/services/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

const PAGE_SIZE = 10;

const RuleListPage: React.FC = () => {
  const [rules, setRules] = useState<RuleListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      try {
        const data: PaginatedRulesResponse = await ruleService.getRules(page, PAGE_SIZE);
        setRules(data.items);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, [page]);

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleActivateToggle = async (rule: RuleListItem) => {
    try {
      await ruleService.activateRule(rule.id, !rule.isActive);
      setRules((rules) =>
        rules.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
      );
      toast({
        title: 'Success',
        description: `Rule ${!rule.isActive ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update rule status.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>Rules</ToolbarHeading>
          <ToolbarActions>
            <Button onClick={() => navigate('/rules/new')}>Create Rule</Button>
          </ToolbarActions>
        </Toolbar>
        <Card>
          <CardHeader className="bg-gray-50/50 border-b px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Rules</h2>
              <div className="text-sm text-gray-500">Total: {totalCount} Rules</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <p>Loading rules...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No rules found</h3>
                <p className="text-gray-500 mb-4">Create your first rule to get started</p>
                <Button variant="outline" onClick={() => navigate('/rules/new')}>
                  Create Rule
                </Button>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Rule Type</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id} className="hover:bg-gray-50 cursor-pointer">
                        <TableCell className="font-medium">{rule.id}</TableCell>
                        <TableCell>{rule.name}</TableCell>
                        <TableCell>{rule.ruleType}</TableCell>
                        <TableCell>{rule.isActive ? 'Yes' : 'No'}</TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/rules/${rule.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant={rule.isActive ? 'outline' : 'default'}
                            size="sm"
                            className="ml-2"
                            onClick={() => handleActivateToggle(rule)}
                          >
                            {rule.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        {page > 1 && (
                          <PaginationItem>
                            <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                          </PaginationItem>
                        )}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === page}
                              onClick={() => handlePageChange(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        {page < totalPages && (
                          <PaginationItem>
                            <PaginationNext onClick={() => handlePageChange(page + 1)} />
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

export default RuleListPage;
