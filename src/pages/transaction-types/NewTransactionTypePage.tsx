import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { transactionTypeService } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

const NewTransactionTypePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isSenderRequired, setIsSenderRequired] = useState(false);
  const [isRecipientRequired, setIsRecipientRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  // Optionally, set tenantId if required by backend
  const tenantId = 0; // or get from context if available

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const newId = await transactionTypeService.createTransactionType({
        name,
        isSenderRequired,
        isRecipientRequired,
        tenantId
      });
      toast({ title: 'Success', description: 'Transaction type created' });
      navigate(`/transaction-types/${newId}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create transaction type',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>New Transaction Type</ToolbarHeading>
      </Toolbar>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Create Transaction Type</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={isSenderRequired}
                  onCheckedChange={(checked) => setIsSenderRequired(checked === true)}
                  disabled={loading}
                />
                Sender Required
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={isRecipientRequired}
                  onCheckedChange={(checked) => setIsRecipientRequired(checked === true)}
                  disabled={loading}
                />
                Recipient Required
              </label>
            </div>
            <Button type="submit" disabled={loading}>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NewTransactionTypePage;
