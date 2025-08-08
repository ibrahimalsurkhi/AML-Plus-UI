import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  templateService,
  type Template,
  type PaginatedResponse,
  TemplateStatus,
  TemplateType
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

const getStatusBadge = (status: TemplateStatus) => {
  switch (status) {
    case TemplateStatus.Draft:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Draft</Badge>;
    case TemplateStatus.Active:
      return <Badge variant="default">Active</Badge>;
    case TemplateStatus.Archived:
      return <Badge variant="destructive">Archived</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getStatusLabel = (status: TemplateStatus) => {
  switch (status) {
    case TemplateStatus.Draft:
      return 'Draft';
    case TemplateStatus.Active:
      return 'Active';
    case TemplateStatus.Archived:
      return 'Archived';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: TemplateStatus) => {
  switch (status) {
    case TemplateStatus.Draft:
      return 'text-gray-800';
    case TemplateStatus.Active:
      return 'text-[#1890FF]';
    case TemplateStatus.Archived:
      return 'text-destructive';
    default:
      return 'text-gray-800';
  }
};

const getTemplateTypeName = (templateType: number) => {
  switch (templateType) {
    case TemplateType.Record:
      return 'Record';
    case TemplateType.Account:
      return 'Account';
    case TemplateType.Transaction:
      return 'Transaction';
    default:
      return 'Unknown';
  }
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PaginatedResponse<Template> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates({
        pageNumber: 1,
        pageSize: 10
      });
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Check if returning from create/edit with success message
  useEffect(() => {
    if (location.state?.refreshData) {
      fetchTemplates();

      if (location.state.message) {
        toast({
          title: 'Success',
          description: location.state.message
        });
      }

      // Clear the state to prevent multiple refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, fetchTemplates]);

  const handleCreateTemplate = () => {
    navigate('/create-template');
  };

  const handleStatusChange = async (templateId: string, newStatus: TemplateStatus) => {
    try {
      await templateService.updateTemplateStatus(templateId, newStatus);
      toast({
        title: 'Success',
        description: `Template status updated to ${getStatusLabel(newStatus)}`
      });
      fetchTemplates(); // Refresh the list
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive'
      });
      console.error('Error updating template status:', err);
    }
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button onClick={handleCreateTemplate}>Create Template</Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Template List</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.items.map((template) => (
                <TableRow key={template.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell onClick={() => navigate(`/templates/${template.id}`)}>
                    {template.name}
                  </TableCell>
                  <TableCell onClick={() => navigate(`/templates/${template.id}`)}>
                    {getTemplateTypeName(template.templateType)}
                  </TableCell>
                  <TableCell onClick={() => navigate(`/templates/${template.id}`)}>
                    {template.version}
                  </TableCell>
                  <TableCell onClick={() => navigate(`/templates/${template.id}`)}>
                    {getStatusBadge(template.status)}
                  </TableCell>
                  <TableCell onClick={() => navigate(`/templates/${template.id}`)}>
                    {template.tenantName}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/templates/${template.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          {template.status !== TemplateStatus.Active && (
                            <DropdownMenuItem
                              className={getStatusColor(TemplateStatus.Active)}
                              onClick={() =>
                                handleStatusChange(template.id.toString(), TemplateStatus.Active)
                              }
                            >
                              Convert to Active
                            </DropdownMenuItem>
                          )}
                          {template.status !== TemplateStatus.Draft && (
                            <DropdownMenuItem
                              className={getStatusColor(TemplateStatus.Draft)}
                              onClick={() =>
                                handleStatusChange(template.id.toString(), TemplateStatus.Draft)
                              }
                            >
                              Convert to Draft
                            </DropdownMenuItem>
                          )}
                          {template.status !== TemplateStatus.Archived && (
                            <DropdownMenuItem
                              className={getStatusColor(TemplateStatus.Archived)}
                              onClick={() =>
                                handleStatusChange(template.id.toString(), TemplateStatus.Archived)
                              }
                            >
                              Convert to Archived
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No templates found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
