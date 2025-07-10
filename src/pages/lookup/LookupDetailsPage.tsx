import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { lookupService, type Lookup, type LookupValue, type PaginatedResponse } from '@/services/api';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const LookupDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [values, setValues] = useState<PaginatedResponse<LookupValue> | null>(null);
  const [loading, setLoading] = useState(true);
  const [valueLoading, setValueLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIsShared, setEditIsShared] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteValueId, setDeleteValueId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    lookupService.getLookupById(Number(id)).then((data) => {
      setLookup(data);
      setEditName(data.name);
      setEditIsShared(data.isShared);
      setLoading(false);
    });
    fetchValues(Number(id), 1);
    // eslint-disable-next-line
  }, [id]);

  const fetchValues = async (lookupId: number, page = 1) => {
    setValueLoading(true);
    try {
      const data = await lookupService.getLookupValues(lookupId, { pageNumber: page, pageSize });
      setValues(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch values', variant: 'destructive' });
    } finally {
      setValueLoading(false);
    }
  };

  const handleUpdateLookup = async () => {
    if (!lookup) return;
    try {
      await lookupService.updateLookup(lookup.id, { id: lookup.id, name: editName, isShared: editIsShared });
      toast({ title: 'Success', description: 'Lookup updated' });
      setLookup({ ...lookup, name: editName, isShared: editIsShared });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update lookup', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!lookup) return;
    try {
      await lookupService.deleteLookup(lookup.id);
      toast({ title: 'Success', description: 'Lookup deleted' });
      navigate('/lookup');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete lookup', variant: 'destructive' });
    }
  };

  const handleAddValue = async () => {
    if (!lookup || !newValue.trim()) return;
    try {
      await lookupService.createLookupValue(lookup.id, { value: newValue });
      setNewValue('');
      fetchValues(lookup.id, pageNumber);
      toast({ title: 'Success', description: 'Value added' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add value', variant: 'destructive' });
    }
  };

  const handleDeleteValue = async (valueId: number) => {
    if (!lookup) return;
    try {
      await lookupService.deleteLookupValue(valueId);
      fetchValues(lookup.id, pageNumber);
      toast({ title: 'Success', description: 'Value deleted' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete value', variant: 'destructive' });
    }
  };

  if (loading || !lookup) {
    return <Container><div className="p-8 text-center">Loading...</div></Container>;
  }

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>Lookup Details</ToolbarHeading>
          <ToolbarActions>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Lookup</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lookup</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this lookup? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleDelete();
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={() => navigate('/lookup')}>Back</Button>
          </ToolbarActions>
        </Toolbar>
        <Card>
          <CardHeader className="bg-gray-50/50 border-b px-6">
            <h2 className="text-xl font-semibold">Edit Lookup</h2>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input
                className="input input-bordered w-full"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Is Shared</label>
              <input
                type="checkbox"
                checked={editIsShared}
                onChange={e => setEditIsShared(e.target.checked)}
              />
            </div>
            <Button onClick={handleUpdateLookup}>Save</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="bg-gray-50/50 border-b px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Values</h2>
              <div className="text-sm text-gray-500">
                Total: {values?.totalCount ?? 0} Values
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2 mb-4">
              <input
                className="input input-bordered flex-1"
                placeholder="New value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddValue(); }}
              />
              <Button onClick={handleAddValue}>Add</Button>
            </div>
            {valueLoading ? (
              <div>Loading values...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values?.items.map((val) => (
                    <TableRow key={val.id}>
                      <TableCell>{val.id}</TableCell>
                      <TableCell>{val.value}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteValueId(val.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <AlertDialog open={deleteValueId !== null} onOpenChange={open => !open && setDeleteValueId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Value</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this value? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteValueId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (deleteValueId !== null) {
                    await handleDeleteValue(deleteValueId);
                    setDeleteValueId(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Container>
  );
};

export default LookupDetailsPage; 