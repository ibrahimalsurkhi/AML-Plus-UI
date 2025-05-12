import { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { useNavigate } from 'react-router-dom';
import { CreateTemplateContent } from './CreateTemplateContent';

const CreateTemplatePage = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Create and manage your templates</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                className="btn btn-sm btn-light"
                onClick={() => navigate('/templates')}
              >
                View Templates
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-icons text-primary">info</span>
              <h2 className="text-xl font-semibold">Template Information</h2>
            </div>
            <p className="text-gray-600">
              Fill out the form below to create a new template. Templates help you standardize and manage your workflows efficiently.
            </p>
            <ul className="list-disc pl-6 text-gray-500 text-sm">
              <li>Give your template a clear, descriptive name.</li>
              <li>Provide a concise description for future reference.</li>
              <li>After creation, you can add score criteria and other details.</li>
            </ul>
          </div>
        </div>
        <CreateTemplateContent />
      </Container>
    </Fragment>
  );
};

export default CreateTemplatePage; 