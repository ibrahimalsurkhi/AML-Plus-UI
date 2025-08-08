import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { lookupService, type Lookup, type PaginatedResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';

const LookupPage = () => {
  const [lookups, setLookups] = useState<PaginatedResponse<Lookup> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchLookups = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const data = await lookupService.getLookups({ pageNumber: page, pageSize });
        setLookups(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch lookups');
        toast({ title: 'Error', description: 'Failed to fetch lookups', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchLookups(pageNumber);
  }, [fetchLookups, pageNumber]);

  const handleCreate = () => {
    navigate('/lookup/new');
  };

  const handleEdit = (id: number) => {
    navigate(`/lookup/${id}`);
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
  };

  const handleDelete = async (id: number) => {
    try {
      await lookupService.deleteLookup(id);
      toast({ title: 'Success', description: 'Lookup deleted' });
      fetchLookups(pageNumber);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete lookup', variant: 'destructive' });
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>Lookups</ToolbarHeading>
          <ToolbarActions>
            <Button onClick={handleCreate}>Create Lookup</Button>
          </ToolbarActions>
        </Toolbar>
        <Card>
          <CardHeader className="bg-gray-50/50 border-b px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Lookups</h2>
              <div className="text-sm text-gray-500">Total: {lookups?.totalCount ?? 0} Lookups</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <p>Loading lookups...</p>
              </div>
            ) : lookups?.items.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No lookups found</h3>
                <p className="text-gray-500 mb-4">Create your first lookup to get started</p>
                <Button variant="outline" onClick={handleCreate}>
                  Create Lookup
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Is Shared</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lookups?.items.map((lookup) => (
                    <TableRow key={lookup.id} className="hover:bg-gray-50 cursor-pointer">
                      <TableCell>{lookup.id}</TableCell>
                      <TableCell onClick={() => handleEdit(lookup.id)}>{lookup.name}</TableCell>
                      <TableCell>{lookup.isShared ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(lookup.id)}>
                          Edit
                        </Button>
                        <AlertDialog
                          open={deleteId === lookup.id}
                          onOpenChange={(open) => !open && setDeleteId(null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => confirmDelete(lookup.id)}
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lookup</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this lookup? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  if (deleteId !== null) {
                                    await handleDelete(deleteId);
                                    setDeleteId(null);
                                  }
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {/* Pagination controls can be added here if needed */}
      </div>
    </Container>
  );
};

export default LookupPage;
