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
  sourceID: string;
  versionNum: string;
  firstName: string;
  secondName: string;
  thirdName?: string;
  unListType: string;
  referenceNumber: string;
  listedOn: string;
  nameOriginalScript?: string;
  comments?: string;
  titles: string[];
  designations: Array<{
    designationText: string;
  }>;
  nationalities: Array<{
    nationalityText: string;
  }>;
  listTypes: Array<{
    listTypeText: string;
  }>;
  documents: Array<{
    typeOfDocument?: string | null;
    number?: string | null;
    countryOfIssue?: string | null;
    dateOfIssue?: string | null;
    cityOfIssue?: string | null;
    note?: string | null;
  }>;
  addresses: Array<{
    street: string | null;
    city: string | null;
    stateProvince: string | null;
    country: string | null;
    zipCode: string | null;
    note: string | null;
  }>;
  aliases: Array<{
    aliasName: string;
    quality: 'Good' | 'Low';
    note: string | null;
  }>;
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
  { value: 'nameOriginalScript', label: 'Name Original Script' },
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

interface DetailModalProps {
  result: SearchResult;
  highlights?: Record<string, string[]>;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ result, highlights, onClose }) => {
  const renderValue = (value: string | null | undefined, field?: string) => {
    if (!value) return '-';
    if (!highlights || !field) return value;
    
    const fieldHighlights = highlights[field];
    if (!fieldHighlights) return value;
    
    return (
      <span dangerouslySetInnerHTML={{ __html: fieldHighlights[0] }} />
    );
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const renderTableRow = (icon: string, label: string, value: any, highlight?: string[]) => (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pl-4 pr-3 whitespace-nowrap w-[200px]">
        <div className="flex items-center gap-2">
          <KeenIcon icon={icon} className="text-gray-400 w-5 h-5" />
          <span className="font-medium text-gray-600">{label}</span>
        </div>
      </td>
      <td className="py-3 px-3">
        {typeof value === 'string' ? renderValue(value, undefined) : value}
      </td>
    </tr>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {renderValue(result.firstName, 'firstName')} {renderValue(result.secondName, 'secondName')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <KeenIcon icon="cross" className="h-6 w-6" />
            </button>
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <KeenIcon icon="user" className="h-5 w-5 mr-2" />
              Basic Information
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ID</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.id || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Data ID</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.dataID || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Source ID</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.sourceID || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Version</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.versionNum || '-'}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">First Name</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderValue(result.firstName, 'firstName')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Second Name</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderValue(result.secondName, 'secondName')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Third Name</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderValue(result.thirdName, 'thirdName')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">UN List Type</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderValue(result.unListType, 'unListType')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Reference Number</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderValue(result.referenceNumber, 'referenceNumber')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Listed On</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderValue(result.listedOn, 'listedOn')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Original Script</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderValue(result.nameOriginalScript, 'nameOriginalScript')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments */}
          {result.comments && result.comments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeenIcon icon="chat" className="h-5 w-5 mr-2" />
                Comments
              </h3>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-700">
                  {renderValue(result.comments[0], 'comments')}
                </p>
              </div>
            </div>
          )}

          {/* Documents */}
          {result.documents && result.documents.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeenIcon icon="document" className="h-5 w-5 mr-2" />
                Documents ({result.documents.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="document" className="h-4 w-4 mr-2" />
                          Type
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="hashtag" className="h-4 w-4 mr-2" />
                          Number
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="flag" className="h-4 w-4 mr-2" />
                          Country
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="calendar" className="h-4 w-4 mr-2" />
                          Issue Date
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="location" className="h-4 w-4 mr-2" />
                          City
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="information" className="h-4 w-4 mr-2" />
                          Note
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.documents.map((doc, index) => (
                      <tr key={index} className={clsx(
                        'hover:bg-gray-50',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      )}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.typeOfDocument || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.countryOfIssue || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.dateOfIssue || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.cityOfIssue || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aliases */}
          {result.aliases && result.aliases.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeenIcon icon="user-group" className="h-5 w-5 mr-2" />
                Aliases ({result.aliases.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="user" className="h-4 w-4 mr-2" />
                          Name
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="star" className="h-4 w-4 mr-2" />
                          Quality
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="information" className="h-4 w-4 mr-2" />
                          Note
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.aliases.map((alias, index) => (
                      <tr key={index} className={clsx(
                        'hover:bg-gray-50',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      )}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {alias.aliasName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alias.quality || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alias.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Addresses */}
          {result.addresses && result.addresses.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeenIcon icon="location" className="h-5 w-5 mr-2" />
                Addresses ({result.addresses.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="location" className="h-4 w-4 mr-2" />
                          Street
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="location" className="h-4 w-4 mr-2" />
                          City
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="location" className="h-4 w-4 mr-2" />
                          State/Province
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="flag" className="h-4 w-4 mr-2" />
                          Country
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="hashtag" className="h-4 w-4 mr-2" />
                          ZIP Code
                        </div>
                      </th>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="information" className="h-4 w-4 mr-2" />
                          Note
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.addresses.map((address, index) => (
                      <tr key={index} className={clsx(
                        'hover:bg-gray-50',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      )}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {address.street || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {address.city || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {address.stateProvince || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {address.country || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {address.zipCode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {address.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Nationalities */}
          {result.nationalities && result.nationalities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeenIcon icon="flag" className="h-5 w-5 mr-2" />
                Nationalities ({result.nationalities.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="flag" className="h-4 w-4 mr-2" />
                          Nationality
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.nationalities.map((nationality, index) => (
                      <tr key={index} className={clsx(
                        'hover:bg-gray-50',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      )}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {nationality.nationalityText || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* List Types */}
          {result.listTypes && result.listTypes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeenIcon icon="list" className="h-5 w-5 mr-2" />
                List Types ({result.listTypes.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="list" className="h-4 w-4 mr-2" />
                          List Type
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.listTypes.map((listType, index) => (
                      <tr key={index} className={clsx(
                        'hover:bg-gray-50',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      )}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {listType.listTypeText || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Designations */}
          {result.designations && result.designations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <KeenIcon icon="medal" className="h-5 w-5 mr-2" />
                Designations ({result.designations.length})
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <KeenIcon icon="medal" className="h-4 w-4 mr-2" />
                          Designation
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.designations.map((designation, index) => (
                      <tr key={index} className={clsx(
                        'hover:bg-gray-50',
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      )}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {designation.designationText || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
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
    fieldsToSearch: ['firstName', 'secondName', 'nameOriginalScript'],
    matchMode: 1,
    logicalOperator: 1,
    sortBy: 'listedOn'
  });
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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

          {searchResults.aggregations?.un_list_types?.length > 0 && (
            <div className="bg-gray-50/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <KeenIcon icon="chart-pie-simple" className="text-primary" />
                <h4 className="font-medium">Results by List Type</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {searchResults.aggregations.un_list_types.map((agg) => (
                  <div 
                    key={agg.key} 
                    className="bg-white rounded-lg p-3 border border-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/20" />
                      <span className="text-[13px] text-gray-700">{agg.key}</span>
                    </div>
                    <span className="text-[13px] font-medium text-primary">
                      {agg.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {searchResults.results.map((result) => (
            <div 
              key={result.id} 
              className="p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div 
                className="font-semibold text-primary cursor-pointer hover:text-primary-dark"
                onClick={() => setSelectedResult(result)}
              >
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

        {selectedResult && (
          <DetailModal
            result={selectedResult}
            highlights={searchResults.highlights?.[selectedResult.id]}
            onClose={() => setSelectedResult(null)}
          />
        )}
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