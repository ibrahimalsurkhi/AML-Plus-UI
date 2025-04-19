import { Fragment, useState, useRef, useEffect } from 'react';
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

interface SearchOptions {
  fieldsToSearch: string[];
  matchMode: number;
  logicalOperator: number;
  sortBy: string;
}

const AVAILABLE_FIELDS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'secondName', label: 'Second Name' },
  { value: 'unListType', label: 'List Type' },
  { value: 'referenceNumber', label: 'Reference Number' },
  { value: 'nationalities', label: 'Nationalities' },
] as const;

const MATCH_MODES = [
  { value: 1, label: 'Contains' },
  { value: 2, label: 'Exact Match' },
  { value: 3, label: 'Starts With' },
  { value: 4, label: 'Ends With' },
] as const;

const LOGICAL_OPERATORS = [
  { value: 1, label: 'AND' },
  { value: 2, label: 'OR' },
] as const;

const SORT_OPTIONS = [
  { value: 'listedOn', label: 'Listed Date' },
  { value: 'firstName', label: 'First Name' },
  { value: 'secondName', label: 'Second Name' },
  { value: 'unListType', label: 'List Type' },
] as const;

interface MultiSelectProps {
  options: typeof AVAILABLE_FIELDS;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const MultiSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select options...' 
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue]
    );
  };

  const selectedLabels = options
    .filter(option => value.includes(option.value))
    .map(option => option.label)
    .join(', ');

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={clsx(
          'form-select w-full h-[42px] bg-white px-3 cursor-pointer',
          'flex items-center text-left',
          'border border-gray-200 rounded-lg',
          'transition-all duration-200',
          'hover:border-primary/50',
          'focus:border-primary focus:ring-1 focus:ring-primary',
          isOpen && 'border-primary ring-1 ring-primary shadow-sm',
          !selectedLabels && 'text-gray-500'
        )}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {value.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-md">
              {value.length}
            </span>
          )}
          <span className="truncate text-[13px] text-gray-700">
            {selectedLabels || placeholder}
          </span>
        </div>
        <div className="flex items-center ps-2">
          <KeenIcon 
            icon={isOpen ? 'arrow-up' : 'arrow-down'} 
            className={clsx(
              'w-4 h-4 transition-transform duration-200',
              isOpen ? 'text-primary' : 'text-gray-400'
            )}
          />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="py-2">
              <div className="px-3 pb-2 text-[13px] text-gray-600">
                Select fields to include in search
              </div>
              <div className="max-h-[240px] overflow-y-auto">
                {options.map(option => (
                  <div
                    key={option.value}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-[7px]',
                      'cursor-pointer transition-colors',
                      'hover:bg-gray-50',
                      value.includes(option.value) && 'bg-blue-50/50'
                    )}
                    onClick={() => toggleOption(option.value)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleOption(option.value);
                      }
                    }}
                  >
                    <div className={clsx(
                      'relative flex items-center justify-center',
                      'w-[18px] h-[18px] rounded transition-colors',
                      value.includes(option.value)
                        ? 'bg-primary border-primary'
                        : 'border-2 border-gray-300 hover:border-primary'
                    )}>
                      {value.includes(option.value) && (
                        <span className="ki-duotone ki-check absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] leading-none text-white before:content-['\ea1e'] before:font-ki" />
                      )}
                    </div>
                    <span className={clsx(
                      'flex-1 text-[13px]',
                      value.includes(option.value) ? 'text-primary' : 'text-gray-700'
                    )}>
                      {option.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div
                  className="text-[13px] text-gray-600 hover:text-primary transition-colors cursor-pointer"
                  onClick={() => onChange([])}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onChange([]);
                    }
                  }}
                >
                  Clear all
                </div>
                <div
                  className="text-[13px] text-primary hover:text-primary-dark transition-colors cursor-pointer"
                  onClick={() => onChange(options.map(o => o.value))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onChange(options.map(o => o.value));
                    }
                  }}
                >
                  Select all
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SanctionSearchPage = () => {
  const { auth } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    fieldsToSearch: ['firstName', 'secondName'],
    matchMode: 1,
    logicalOperator: 1,
    sortBy: 'listedOn'
  });

  if (!auth) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    if (searchOptions.fieldsToSearch.length === 0) {
      setError('Please select at least one field to search');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<SearchResponse>(
        API_CONFIG.endpoints.search.tenants,
        {
          query: searchQuery,
          ...searchOptions
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
    setSearchOptions({
      fieldsToSearch: ['firstName', 'secondName'],
      matchMode: 1,
      logicalOperator: 1,
      sortBy: 'listedOn'
    });
  };

  const renderSearchResults = () => {
    if (!searchResults) {
      return (
        <div className="border-t border-gray-100 pt-5">
          <div className="text-center text-gray-600 p-8">
            <KeenIcon icon="search-list" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Enter search criteria above to find sanctioned entities</p>
            <p className="text-sm mt-2">You can search by name, identifier, or other details</p>
          </div>
        </div>
      );
    }

    return (
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
    );
  };

  const renderAdvancedSearch = () => {
    if (!showAdvanced) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 divide-y divide-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Fields to Search
              </label>
              <MultiSelect
                options={AVAILABLE_FIELDS}
                value={searchOptions.fieldsToSearch}
                onChange={(fields) => setSearchOptions(prev => ({
                  ...prev,
                  fieldsToSearch: fields
                }))}
                placeholder="Select fields to search..."
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Match Mode
              </label>
              <select
                className={clsx(
                  'form-select w-full h-[42px] bg-white border-gray-200 rounded-lg text-[13px]',
                  'hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary'
                )}
                value={searchOptions.matchMode}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  matchMode: Number(e.target.value)
                }))}
              >
                {MATCH_MODES.map(mode => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Logical Operator
              </label>
              <select
                className={clsx(
                  'form-select w-full h-[42px] bg-white border-gray-200 rounded-lg text-[13px]',
                  'hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary'
                )}
                value={searchOptions.logicalOperator}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  logicalOperator: Number(e.target.value)
                }))}
              >
                {LOGICAL_OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Sort By
              </label>
              <select
                className={clsx(
                  'form-select w-full h-[42px] bg-white border-gray-200 rounded-lg text-[13px]',
                  'hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary'
                )}
                value={searchOptions.sortBy}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  sortBy: e.target.value
                }))}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex items-center gap-2 text-[13px] text-gray-600">
            <KeenIcon icon="information-5" className="text-gray-400" />
            <span>
              Select multiple fields and customize how the search is performed.
              The logical operator determines how multiple fields are combined in the search.
            </span>
          </div>
        </div>
      </div>
    );
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
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="grow relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <KeenIcon icon="magnifier" className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className={clsx(
                        'form-control w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg',
                        'focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-colors',
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

                <div className="flex items-center justify-between">
                  <button
                    className="btn btn-sm btn-light-primary"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <KeenIcon 
                      icon={showAdvanced ? "minus-square" : "plus-square"} 
                      className="me-2"
                    />
                    Advanced Search Options
                  </button>
                  {showAdvanced && (
                    <div className="text-sm text-gray-500">
                      {searchOptions.fieldsToSearch.length} fields selected
                    </div>
                  )}
                </div>

                {renderAdvancedSearch()}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg">
                  <KeenIcon icon="information-5" className="text-red-500" />
                  {error}
                </div>
              )}

              {renderSearchResults()}
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { SanctionSearchPage }; 