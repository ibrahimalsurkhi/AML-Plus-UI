import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { templateService, type Template, type PaginatedResponse, TemplateStatus } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PaginatedResponse<Template> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
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
  };

  const handleCreateTemplate = () => {
    navigate('/create-template');
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
                <TableHead>Description</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.items.map((template) => (
                <TableRow 
                  key={template.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/templates/${template.id}`)}
                >
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>{template.version}</TableCell>
                  <TableCell>{getStatusBadge(template.status)}</TableCell>
                  <TableCell>{template.tenantName}</TableCell>
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