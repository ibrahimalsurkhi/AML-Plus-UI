import { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>Welcome to Greedfield Sanction Search</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <h2 className="text-2xl font-bold mb-4">Sanction Search</h2>
                <p className="text-gray-600 mb-6">
                  Search and screen entities against global sanctions lists.
                </p>
                <button 
                  onClick={() => navigate('/sanction-search')} 
                  className="btn btn-primary"
                >
                  Start Search
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="bg-light rounded-lg p-4">
                    <div className="text-3xl font-bold text-primary mb-1">0</div>
                    <div className="text-sm text-gray-600">Searches Today</div>
                  </div>
                  <div className="bg-light rounded-lg p-4">
                    <div className="text-3xl font-bold text-primary mb-1">0</div>
                    <div className="text-sm text-gray-600">Matches Found</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { DashboardPage }; 