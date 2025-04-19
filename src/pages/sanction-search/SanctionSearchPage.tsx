import { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';

const SanctionSearchPage = () => {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>Search for sanctioned entities and individuals</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <button className="btn btn-primary">
              New Search
            </button>
          </ToolbarActions>
        </Toolbar>

        <div className="card">
          <div className="card-body">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="grow">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, identifier, or other details..."
                  />
                </div>
                <button className="btn btn-primary shrink-0">
                  Search
                </button>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <div className="text-center text-gray-600">
                  Enter search criteria above to find sanctioned entities
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { SanctionSearchPage }; 