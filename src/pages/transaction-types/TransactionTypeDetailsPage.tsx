import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { transactionTypeService, type TransactionType } from '@/services/api';
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

const TransactionTypeDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState<TransactionType | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsSenderRequired, setEditIsSenderRequired] = useState(false);
  const [editIsRecipientRequired, setEditIsRecipientRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    transactionTypeService.getTransactionTypeById(Number(id)).then((data) => {
      setTransactionType(data);
      setEditName(data.name);
      setEditIsSenderRequired(data.isSenderRequired);
      setEditIsRecipientRequired(data.isRecipientRequired);
      setLoading(false);
    });
  }, [id]);

  const handleUpdate = async () => {
    if (!transactionType) return;
    setSaving(true);
    try {
      await transactionTypeService.updateTransactionType(transactionType.id, {
        name: editName,
        isSenderRequired: editIsSenderRequired,
        isRecipientRequired: editIsRecipientRequired,
        tenantId: transactionType.tenantId,
      });
      toast({ title: 'Success', description: 'Transaction type updated' });
      setTransactionType({ ...transactionType, name: editName, isSenderRequired: editIsSenderRequired, isRecipientRequired: editIsRecipientRequired });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update transaction type', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionType) return;
    try {
      await transactionTypeService.deleteTransactionType(transactionType.id);
      toast({ title: 'Success', description: 'Transaction type deleted' });
      navigate('/transaction-types');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete transaction type', variant: 'destructive' });
    }
  };

  if (loading || !transactionType) {
    return <Container><div className="p-8 text-center">Loading...</div></Container>;
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>Transaction Type Details</ToolbarHeading>
      </Toolbar>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Edit Transaction Type</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); setUpdateDialogOpen(true); }} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} required disabled={saving} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <Checkbox checked={editIsSenderRequired} onCheckedChange={checked => setEditIsSenderRequired(checked === true)} disabled={saving} />
                Sender Required
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={editIsRecipientRequired} onCheckedChange={checked => setEditIsRecipientRequired(checked === true)} disabled={saving} />
                Recipient Required
              </label>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>Save</Button>
              <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={saving}>Delete</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Update Confirmation Dialog */}
      <AlertDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Transaction Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this transaction type?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUpdateDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleUpdate();
                setUpdateDialogOpen(false);
              }}
            >
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction type? This action cannot be undone.
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
    </Container>
  );
};

export default TransactionTypeDetailsPage; 