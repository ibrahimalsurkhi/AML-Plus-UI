import { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { API_CONFIG } from '@/config/api';
import { api } from '@/services/api';
import { useAuthContext } from '@/auth/useAuthContext';
import { Navigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { KeenIcon } from '@/components';
import clsx from 'clsx';

interface SearchResult {
  id: string;
  dataID: string;
  firstName: string;
  secondName: string;
  unListType: string;
  referenceNumber: string;
  listedOn: string;
  nationalities: Array<{ nationalityText: string }>;
  listTypes: Array<{ listTypeText: string }>;
}

interface SearchResponse {
  total: number;
  results: SearchResult[];
  aggregations: {
    un_list_types: Array<{ key: string; count: number }>;
  };
  highlights: Record<string, Record<string, string[]>>;
}

const SanctionSearchPage = () => {
  const { auth } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!auth) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<SearchResponse>(
        API_CONFIG.endpoints.search.tenants,
        {
          query: searchQuery,
          fieldsToSearch: ["firstName", "secondName"],
          matchMode: 1,
          logicalOperator: 1,
          sortBy: "listedOn"
        }
      );
      setSearchResults(response.data);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to perform search. Please try again.');
      }
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setError(null);
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>Search for sanctioned entities and individuals</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <button 
              className="btn btn-light-primary" 
              onClick={handleClearSearch}
              disabled={!searchQuery && !searchResults}
            >
              <KeenIcon icon="arrows-circle" className="me-2" />
              New Search
            </button>
          </ToolbarActions>
        </Toolbar>

        <div className="card shadow-none border-0">
          <div className="card-body px-0">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="grow relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeenIcon icon="magnifier" className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className={clsx(
                      'form-control w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-colors',
                      { 'pr-24': isLoading }
                    )}
                    placeholder="Search by name (e.g. 'John Smith'), identifier, or other details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          <span className="text-sm text-gray-500">Searching...</span>
                        </div>
                      ) : (
                        <button
                          className="btn btn-icon btn-sm hover:bg-gray-100 transition-colors"
                          onClick={handleClearSearch}
                          title="Clear search"
                        >
                          <KeenIcon icon="close" className="text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  className={clsx(
                    'btn shrink-0 px-6',
                    isLoading ? 'btn-light' : 'btn-primary'
                  )}
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Searching...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <KeenIcon icon="search-list" />
                      Search
                    </span>
                  )}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg">
                  <KeenIcon icon="information-5" className="text-red-500" />
                  {error}
                </div>
              )}

              {searchResults ? (
                <div className="border-t border-gray-100 pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <KeenIcon icon="abstract-45" className="text-primary" />
                      Found {searchResults.total} results
                      {searchQuery && (
                        <span className="text-sm font-normal text-gray-600">
                          for "{searchQuery}"
                        </span>
                      )}
                    </h3>
                    {searchResults.total > 0 && (
                      <div className="text-sm text-gray-600">
                        Showing {Math.min(searchResults.results.length, searchResults.total)} of {searchResults.total} results
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {searchResults.results.map((result) => (
                      <div key={result.id} className="p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all">
                        <div className="font-semibold text-primary">
                          {result.firstName} {result.secondName}
                        </div>
                        <div className="text-sm text-gray-600 mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Reference:</span> {result.referenceNumber}
                          </div>
                          <div>
                            <span className="font-medium">Listed on:</span> {new Date(result.listedOn).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {result.unListType}
                          </div>
                          <div>
                            <span className="font-medium">Nationalities:</span> {result.nationalities.map(n => n.nationalityText).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-5">
                  <div className="text-center text-gray-600 p-8">
                    <KeenIcon icon="search-list" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">Enter search criteria above to find sanctioned entities</p>
                    <p className="text-sm mt-2">You can search by name, identifier, or other details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { SanctionSearchPage }; 