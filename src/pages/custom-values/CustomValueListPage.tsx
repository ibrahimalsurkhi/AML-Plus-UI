import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const CustomValueListPage = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-primary">Custom Values</span>
              <span className="text-base text-muted-foreground">
                Manage custom aggregated values and their filter conditions
              </span>
            </div>
          </ToolbarHeading>
          <ToolbarActions>
            <Button 
              variant="default" 
              className="bg-primary text-white"
              onClick={() => navigate('/custom-values/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Value
            </Button>
          </ToolbarActions>
        </Toolbar>

        <Card className="shadow-md border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">Custom Values List</h3>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No custom values created yet.</p>
              <Button 
                variant="outline"
                onClick={() => navigate('/custom-values/new')}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Custom Value
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default CustomValueListPage;
