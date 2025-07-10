import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { lookupService } from '@/services/api';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { toast } from '@/components/ui/use-toast';

const NewLookupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Name is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // tenantId is required by the API, set to 1 by default or get from context if available
      const newLookupId = await lookupService.createLookup({ tenantId: 1, name, isShared });
      toast({ title: 'Success', description: 'Lookup created' });
      navigate(`/lookup/${newLookupId}`);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create lookup', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>Create Lookup</ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={() => navigate('/lookup')}>Back</Button>
          </ToolbarActions>
        </Toolbar>
        <Card>
          <CardHeader className="bg-gray-50/50 border-b px-6">
            <h2 className="text-xl font-semibold">New Lookup</h2>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input
                  className="input input-bordered w-full"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Is Shared</label>
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={e => setIsShared(e.target.checked)}
                />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default NewLookupPage; 