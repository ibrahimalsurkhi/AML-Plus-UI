import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KeenIcon } from '@/components/keenicons';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
  recordService,
  accountService,
  fieldResponseService,
  lookupService,
  templateService,
  type FieldResponseDetail,
  type FieldResponseCreate,
  FieldType,
  type ScoreCriteriaRange
} from '@/services/api';

// Define field option type
interface FieldOption {
  id?: number;
  fieldId?: number;
  label: string;
  scoreCriteriaId: number;
  displayOrder: number;
  value?: string;
}

// Extend TemplateField type to include options and ranges
interface ExtendedTemplateField {
  id?: number;
  templateId?: number;
  label: string;
  fieldType: FieldType;
  weight: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  minDate?: string | null;
  maxDate?: string | null;
  pattern?: string | null;
  lookupId?: number | null;
  options?: FieldOption[];
  ranges?: ScoreCriteriaRange[];
}

interface AccountSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountSelected: (account: any) => void;
  title: string;
  accountType: 'sender' | 'recipient';
}

const AccountSelectionDialog: React.FC<AccountSelectionDialogProps> = ({
  open,
  onOpenChange,
  onAccountSelected,
  title,
  accountType
}) => {
  const navigate = useNavigate();

  // State for records and accounts
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  // State for unified search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'customer' | 'account' | null>(null);
  const [unifiedSearchLoading, setUnifiedSearchLoading] = useState(false);
  const [filterType, setFilterType] = useState<'customer' | 'account'>('customer');

  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // State for template selection
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // State for account creation
  const [accountData, setAccountData] = useState<any>({});
  const [accountFieldResponses, setAccountFieldResponses] = useState<FieldResponseCreate[]>([]);
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});

  // State for account template fields
  const [accountTemplateFields, setAccountTemplateFields] = useState<ExtendedTemplateField[]>([]);
  const [accountTemplateFieldsLoading, setAccountTemplateFieldsLoading] = useState(false);

  // State for bank countries
  const [bankCountries, setBankCountries] = useState<any[]>([]);
  const [bankCountriesLoading, setBankCountriesLoading] = useState(false);

  // State for account field responses display
  const [expandedAccounts, setExpandedAccounts] = useState<Record<number, boolean>>({});
  const [accountFieldResponsesData, setAccountFieldResponsesData] = useState<
    Record<number, FieldResponseDetail[]>
  >({});
  const [loadingAccountResponses, setLoadingAccountResponses] = useState<Record<number, boolean>>(
    {}
  );

  // Account status enum
  const AccountStatusEnum = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 2 },
    { label: 'Closed', value: 3 },
    { label: 'Suspended', value: 4 }
  ];

  // Fetch records when dialog opens
  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchBankCountries();
      fetchAccountTemplateFields();
    }
  }, [open]);

  // Fetch records when page, search, or template changes
  // Fetch records when template is selected (automatically load all records)
  useEffect(() => {
    if (open && selectedTemplateId) {
      // Reset search state when template changes
      setSearchTerm('');
      setSearchType(null);
      setFilterType('customer');
      setSelectedRecord(null);
      setSelectedAccount(null);
      setAccounts([]);
      setCurrentPage(1);

      // Load records for the new template
      fetchRecords();
    }
  }, [selectedTemplateId, open]);

  // Handle pagination changes
  useEffect(() => {
    if (open && selectedTemplateId && (searchType === 'customer' || !searchType)) {
      fetchRecords();
    }
  }, [currentPage]);

  // Fetch accounts when record is selected or account number is entered
  useEffect(() => {
    if (selectedRecord) {
      // Always load accounts when a record is selected, regardless of search type
      fetchAccountsByRecord();
    } else if (searchTerm.trim() && searchType === 'account') {
      // Account search is handled by handleUnifiedSearch, no need for separate effect
      setAccounts([]);
      setSelectedAccount(null);
    } else {
      setAccounts([]);
      setSelectedAccount(null);
    }
  }, [selectedRecord, searchTerm, searchType]);

  const fetchAccountsByRecord = async () => {
    if (!selectedRecord) return;

    setAccountsLoading(true);
    try {
      const response = await accountService.getAccountsByRecordId({
        recordId: selectedRecord.id,
        pageNumber: 1,
        pageSize: 100
      });
      setAccounts(response.items || response);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch accounts', variant: 'destructive' });
    } finally {
      setAccountsLoading(false);
    }
  };

  // Unified search function using filter type dropdown
  const handleUnifiedSearch = async () => {
    if (!selectedTemplateId) return;

    setUnifiedSearchLoading(true);

    if (filterType === 'account') {
      // Search by account number
      setSearchType('account');
      try {
        const response = await accountService.getAccountsByRecordId({
          number: searchTerm.trim(),
          pageNumber: 1,
          pageSize: 100
        });
        setAccounts(response.items || response);
        setSelectedRecord(null); // Clear any selected record
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to fetch accounts by number',
          variant: 'destructive'
        });
      }
    } else {
      // Search by customer reference ID (or show all if no search term)
      setSearchType('customer');
      setCurrentPage(1); // Reset to first page when searching
      try {
        const res = await recordService.getRecords({
          pageNumber: 1,
          pageSize: pageSize,
          templateId: selectedTemplateId,
          customerRefId: searchTerm.trim() || undefined // Show all if no search term
        });
        setRecords(res.items);
        setTotalPages(res.totalPages);
        setTotalCount(res.totalCount);
        setAccounts([]); // Clear any accounts
        setSelectedRecord(null);
      } catch {
        toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' });
      }
    }

    setUnifiedSearchLoading(false);
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedRecord(null);
      setSelectedAccount(null);
      setAccounts([]);
      setShowCreateAccount(false);
      setAccountData({});
      setAccountFieldResponses([]);
      setAccountErrors({});
      setExpandedAccounts({});
      setAccountFieldResponsesData({});
      setLoadingAccountResponses({});
      setCurrentPage(1);
      setTotalPages(0);
      setTotalCount(0);
      setSelectedTemplateId(null);
      setTemplates([]);
      setSearchTerm('');
      setSearchType(null);
      setFilterType('customer');
    }
  }, [open]);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await templateService.getTemplates({
        pageNumber: 1,
        pageSize: 100,
        templateType: 1 // Only Record templates (type = 1)
      });
      setTemplates(res.items);
      // Auto-select first template if available
      if (res.items.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(res.items[0].id);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch templates', variant: 'destructive' });
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!selectedTemplateId) return;

    setRecordsLoading(true);
    try {
      const res = await recordService.getRecords({
        pageNumber: currentPage,
        pageSize: pageSize,
        templateId: selectedTemplateId,
        customerRefId: searchTerm.trim() || undefined // Only filter if search term is provided
      });
      setRecords(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' });
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchBankCountries = async () => {
    setBankCountriesLoading(true);
    try {
      const values = await lookupService.getLookupValuesByKey('CountryOfBirth', { 
        pageNumber: 1, 
        pageSize: 100 
      });
      setBankCountries(values.items.filter(item => !item.isDeleted));
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to fetch bank countries',
        variant: 'destructive'
      });
    } finally {
      setBankCountriesLoading(false);
    }
  };

  const fetchAccountTemplateFields = async () => {
    setAccountTemplateFieldsLoading(true);
    try {
      const fieldsResponse = await templateService.getTemplateFields('13');
      // Filter out deleted sections and fields
      const filteredSections = fieldsResponse.sections
        .filter(section => !section.isDeleted)
        .map(section => ({
          ...section,
          fields: section.fields.filter(field => !field.isDeleted)
        }));
      const filteredFieldsWithoutSection = fieldsResponse.fieldsWithoutSection.filter(field => !field.isDeleted);
      
      const allFields = [
        ...filteredSections.flatMap((section) => section.fields),
        ...filteredFieldsWithoutSection
      ];

      const fieldsWithOptions = await Promise.all(
        allFields.map(async (field) => {
          const extendedField: ExtendedTemplateField = { ...field };

          if (
            field.fieldType === FieldType.Dropdown ||
            field.fieldType === FieldType.Radio ||
            field.fieldType === FieldType.Checkbox
          ) {
            const options = await templateService.getFieldOptions('13', field.id!);
            extendedField.options = options.map((opt) => ({
              ...opt,
              value: opt.label
            }));
          }

          if (field.fieldType === FieldType.Lookup && field.lookupId) {
            try {
              const lookupValues = await lookupService.getLookupValues(field.lookupId, {
                pageNumber: 1,
                pageSize: 100
              });
              extendedField.options = lookupValues.items.map((lookupValue, index) => ({
                id: lookupValue.id,
                fieldId: field.id!,
                label: lookupValue.value,
                scoreCriteriaId: 0,
                displayOrder: index + 1,
                value: lookupValue.value
              }));
            } catch (error) {
              console.error(`Error fetching lookup values for field ${field.id}:`, error);
              extendedField.options = [];
            }
          }

          if (field.fieldType === FieldType.Number) {
            const ranges = await templateService.getTemplateScoreCriteriaRanges('13', field.id!);
            extendedField.ranges = ranges;
          }

          return extendedField;
        })
      );
      setAccountTemplateFields(fieldsWithOptions);
    } catch (error) {
      console.error('Error fetching account template fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch account template fields. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAccountTemplateFieldsLoading(false);
    }
  };

  const toggleAccountExpansion = async (accountId: number) => {
    const isCurrentlyExpanded = expandedAccounts[accountId];

    setExpandedAccounts((prev) => ({
      ...prev,
      [accountId]: !isCurrentlyExpanded
    }));

    if (!isCurrentlyExpanded && !accountFieldResponsesData[accountId]) {
      setLoadingAccountResponses((prev) => ({ ...prev, [accountId]: true }));

      try {
        const responses = await fieldResponseService.getFieldResponses({ accountId });
        setAccountFieldResponsesData((prev) => ({
          ...prev,
          [accountId]: responses
        }));
      } catch (error) {
        console.error('Error fetching account field responses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load account field responses',
          variant: 'destructive'
        });
      } finally {
        setLoadingAccountResponses((prev) => ({ ...prev, [accountId]: false }));
      }
    }
  };

  const renderFieldResponseValue = (response: FieldResponseDetail) => {
    if (response.valueText) return response.valueText;
    if (response.valueNumber !== null) return response.valueNumber.toString();
    if (response.valueDate) return new Date(response.valueDate).toLocaleDateString();
    if (response.optionValue) return response.optionValue;
    return '-';
  };

  const getRangeBounds = (ranges: ScoreCriteriaRange[] | undefined) => {
    if (!ranges || ranges.length === 0) return { min: undefined, max: undefined };

    const activeRanges = ranges.filter(range => !range.isDeleted);
    if (activeRanges.length === 0) return { min: undefined, max: undefined };

    return activeRanges.reduce(
      (acc, range) => ({
        min: acc.min === undefined ? range.minValue : Math.min(acc.min, range.minValue),
        max: acc.max === undefined ? range.maxValue : Math.max(acc.max, range.maxValue)
      }),
      { min: undefined as number | undefined, max: undefined as number | undefined }
    );
  };

  const renderFieldHelp = (field: ExtendedTemplateField) => {
    if (
      !field.placeholder &&
      !field.minLength &&
      !field.maxLength &&
      !field.minValue &&
      !field.maxValue &&
      !field.minDate &&
      !field.maxDate &&
      !field.ranges
    ) {
      return null;
    }

    const helpTexts = [];
    if (field.placeholder) helpTexts.push(field.placeholder);
    if (field.minLength && field.maxLength) {
      helpTexts.push(`Length: ${field.minLength}-${field.maxLength} characters`);
    } else if (field.minLength) {
      helpTexts.push(`Minimum length: ${field.minLength} characters`);
    } else if (field.maxLength) {
      helpTexts.push(`Maximum length: ${field.maxLength} characters`);
    }

    if (field.fieldType === FieldType.Number && field.ranges) {
      const { min, max } = getRangeBounds(field.ranges);
      if (min !== undefined && max !== undefined) {
        helpTexts.push(`Valid range: ${min} to ${max}`);
      } else if (min !== undefined) {
        helpTexts.push(`Minimum value: ${min}`);
      } else if (max !== undefined) {
        helpTexts.push(`Maximum value: ${max}`);
      }
    } else {
      if (field.minValue !== null && field.maxValue !== null) {
        helpTexts.push(`Range: ${field.minValue}-${field.maxValue}`);
      } else if (field.minValue !== null) {
        helpTexts.push(`Minimum value: ${field.minValue}`);
      } else if (field.maxValue !== null) {
        helpTexts.push(`Maximum value: ${field.maxValue}`);
      }
    }

    if (field.minDate && field.maxDate) {
      helpTexts.push(`Date range: ${field.minDate} to ${field.maxDate}`);
    } else if (field.minDate) {
      helpTexts.push(`Earliest date: ${field.minDate}`);
    } else if (field.maxDate) {
      helpTexts.push(`Latest date: ${field.maxDate}`);
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground ml-1 inline-block" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{helpTexts.join('. ')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderFieldLabel = (field: ExtendedTemplateField, htmlFor: string) => (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      {field.label}
      {field.isRequired && <span className="text-red-500">*</span>}
      {renderFieldHelp(field)}
    </Label>
  );

  const handleAccountFieldChange = (fieldId: number, value: any, fieldType: FieldType) => {
    setAccountFieldResponses((prev) => {
      const existingIndex = prev.findIndex((fr) => fr.fieldId === fieldId);
      let response: FieldResponseCreate = {
        fieldId: fieldId
      };

      switch (fieldType) {
        case FieldType.Text:
        case FieldType.TextArea:
          response.valueText = String(value);
          break;
        case FieldType.Number:
          const numericValue = value !== undefined && value !== '' ? Number(value) : null;
          response.valueNumber = numericValue;

          const field = accountTemplateFields.find((f) => f.id === fieldId);
          const matchingRange = field?.ranges
            ?.filter(range => !range.isDeleted)
            ?.find(
              (range) =>
                numericValue !== null &&
                numericValue >= range.minValue &&
                numericValue <= range.maxValue
            );

          response.templateFieldScoreCriteriaId = matchingRange
            ? parseInt(matchingRange.id.toString())
            : null;
          break;
        case FieldType.Date:
          response.valueDate = value ? new Date(String(value)).toISOString() : null;
          break;
        case FieldType.Dropdown:
        case FieldType.Radio:
        case FieldType.Checkbox:
        case FieldType.Lookup:
          const fieldWithOptions = accountTemplateFields.find((f) => f.id === fieldId);
          let selectedOption;

          if (fieldType === FieldType.Checkbox) {
            selectedOption = fieldWithOptions?.options?.find(
              (opt) => opt.label.toLowerCase() === (value === true ? 'checked' : 'unchecked')
            );
            if (!selectedOption && fieldWithOptions?.options?.[0]) {
              selectedOption = fieldWithOptions.options[0];
            }
          } else {
            selectedOption = fieldWithOptions?.options?.find(
              (opt) => opt.id && opt.id.toString() === value
            );
          }

          response.optionId = selectedOption?.id ? parseInt(selectedOption.id.toString()) : null;
          break;
      }

      if (existingIndex >= 0) {
        const newResponses = [...prev];
        newResponses[existingIndex] = response;
        return newResponses;
      } else {
        return [...prev, response];
      }
    });
  };

  const renderAccountDynamicField = (field: ExtendedTemplateField) => {
    const fieldName = `account_field_${field.id}`;
    const currentResponse = accountFieldResponses.find((fr) => fr.fieldId === field.id);
    const fieldValue = currentResponse
      ? field.fieldType === FieldType.Number
        ? currentResponse.valueNumber
        : field.fieldType === FieldType.Date
          ? currentResponse.valueDate
            ? currentResponse.valueDate.split('T')[0]
            : ''
          : field.fieldType === FieldType.Checkbox
            ? (() => {
                if (!currentResponse.optionId) return false;
                const selectedOption = field.options?.find(
                  (opt) => opt.id?.toString() === currentResponse.optionId?.toString()
                );
                return selectedOption?.label.toLowerCase() === 'checked';
              })()
            : field.fieldType === FieldType.Dropdown ||
                field.fieldType === FieldType.Radio ||
                field.fieldType === FieldType.Lookup
              ? currentResponse.optionId
                ? currentResponse.optionId.toString()
                : ''
              : currentResponse.valueText
      : '';

    const fieldErrorKey = `field_${field.id}`;
    const fieldError = accountErrors[fieldErrorKey];
    const isInvalid = !!fieldError;

    const fieldWrapperClasses = cn(
      'space-y-2',
      field.fieldType === FieldType.Checkbox ? 'flex items-start space-x-2' : '',
      field.fieldType === FieldType.Radio ? 'space-y-3' : ''
    );

    const inputClasses = cn(
      'w-full',
      field.fieldType === FieldType.Checkbox ? 'mt-1' : '',
      isInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''
    );

    switch (field.fieldType) {
      case FieldType.Text:
      case FieldType.TextArea:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            {field.fieldType === FieldType.Text ? (
              <Input
                id={fieldName}
                value={(fieldValue as string) || ''}
                onChange={(e) =>
                  handleAccountFieldChange(field.id!, e.target.value, field.fieldType)
                }
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
              />
            ) : (
              <Textarea
                id={fieldName}
                value={(fieldValue as string) || ''}
                onChange={(e) =>
                  handleAccountFieldChange(field.id!, e.target.value, field.fieldType)
                }
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
                rows={4}
              />
            )}
            {fieldError && <p className="text-sm text-red-500 mt-1">{fieldError}</p>}
          </div>
        );

      case FieldType.Number:
        const { min, max } = getRangeBounds(field.ranges);
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Input
              id={fieldName}
              type="number"
              value={(fieldValue as number) || ''}
              onChange={(e) => handleAccountFieldChange(field.id!, e.target.value, field.fieldType)}
              className={inputClasses}
              placeholder={field.placeholder}
              min={min !== undefined ? min : field.minValue || undefined}
              max={max !== undefined ? max : field.maxValue || undefined}
              step="any"
            />
            {fieldError && <p className="text-sm text-red-500 mt-1">{fieldError}</p>}
          </div>
        );

      case FieldType.Date:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Input
              id={fieldName}
              type="date"
              value={
                typeof fieldValue === 'string' || typeof fieldValue === 'number'
                  ? String(fieldValue)
                  : ''
              }
              onChange={(e) => handleAccountFieldChange(field.id!, e.target.value, field.fieldType)}
              className={inputClasses}
              min={field.minDate || undefined}
              max={field.maxDate || undefined}
            />
            {fieldError && <p className="text-sm text-red-500 mt-1">{fieldError}</p>}
          </div>
        );

      case FieldType.Checkbox:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            <div className="flex items-start space-x-2">
              <Checkbox
                id={fieldName}
                checked={Boolean(fieldValue)}
                onCheckedChange={(checked) => {
                  handleAccountFieldChange(field.id!, checked, field.fieldType);
                }}
                className={cn('mt-1', inputClasses)}
              />
              <div className="space-y-1">
                {renderFieldLabel(field, fieldName)}
                {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
              </div>
            </div>
          </div>
        );

      case FieldType.Dropdown:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Select
              value={(fieldValue as string) || ''}
              onValueChange={(value: string) => {
                handleAccountFieldChange(field.id!, value, field.fieldType);
              }}
            >
              <SelectTrigger className={cn(inputClasses, 'w-full')}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(
                  (option: FieldOption) =>
                    option.id && (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.label}
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case FieldType.Lookup:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Select
              value={(fieldValue as string) || ''}
              onValueChange={(value: string) => {
                handleAccountFieldChange(field.id!, value, field.fieldType);
              }}
            >
              <SelectTrigger className={cn(inputClasses, 'w-full')}>
                <SelectValue placeholder={field.placeholder || 'Select a lookup value'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(
                  (option: FieldOption) =>
                    option.id && (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.label}
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case FieldType.Radio:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <div className="space-y-2">
              {field.options?.map(
                (option: FieldOption) =>
                  option.id && (
                    <div key={option.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${fieldName}_${option.id}`}
                        value={option.id.toString()}
                        checked={fieldValue === option.id.toString()}
                        onChange={(e) => {
                          handleAccountFieldChange(field.id!, e.target.value, field.fieldType);
                        }}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`${fieldName}_${option.id}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  )
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const sortFields = (fields: ExtendedTemplateField[]) => {
    return [...fields].sort((a, b) => {
      if (a.fieldType === FieldType.Checkbox && b.fieldType !== FieldType.Checkbox) {
        return 1;
      }
      if (b.fieldType === FieldType.Checkbox && a.fieldType !== FieldType.Checkbox) {
        return -1;
      }
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  };

  const validateAccountCreation = (accountData: any, fieldResponses: any[]) => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    if (!accountData.name?.trim()) {
      errors.push('Account name is required');
      fieldErrors['name'] = 'Account name is required';
    }
    if (!accountData.number?.trim()) {
      errors.push('Account number is required');
      fieldErrors['number'] = 'Account number is required';
    }
    if (!accountData.bankOfCountryId) {
      errors.push('Bank country is required');
      fieldErrors['bankOfCountryId'] = 'Bank country is required';
    }
    if (!accountData.bankOfCity?.trim()) {
      errors.push('Bank city is required');
      fieldErrors['bankOfCity'] = 'Bank city is required';
    }
    if (!accountData.creationDate) {
      errors.push('Creation date is required');
      fieldErrors['creationDate'] = 'Creation date is required';
    }
    if (!accountData.accountStatus) {
      errors.push('Account status is required');
      fieldErrors['accountStatus'] = 'Account status is required';
    }

    accountTemplateFields.forEach((field) => {
      const fieldKey = `field_${field.id}`;

      if (field.isRequired) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);

        if (!fieldResponse) {
          errors.push(`${field.label} is required`);
          fieldErrors[fieldKey] = `${field.label} is required`;
          return;
        }

        let hasValue = false;
        switch (field.fieldType) {
          case FieldType.Text:
          case FieldType.TextArea:
            hasValue = fieldResponse.valueText && fieldResponse.valueText.trim() !== '';
            break;
          case FieldType.Number:
            hasValue =
              fieldResponse.valueNumber !== null && fieldResponse.valueNumber !== undefined;
            break;
          case FieldType.Date:
            hasValue = fieldResponse.valueDate && fieldResponse.valueDate.trim() !== '';
            break;
          case FieldType.Dropdown:
          case FieldType.Radio:
          case FieldType.Lookup:
            hasValue = fieldResponse.optionId !== null && fieldResponse.optionId !== undefined;
            break;
          case FieldType.Checkbox:
            hasValue = fieldResponse.optionId !== null && fieldResponse.optionId !== undefined;
            break;
        }

        if (!hasValue) {
          errors.push(`${field.label} is required`);
          fieldErrors[fieldKey] = `${field.label} is required`;
        }
      }

      if (field.fieldType === FieldType.Number && field.ranges) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
        if (
          fieldResponse &&
          fieldResponse.valueNumber !== null &&
          fieldResponse.valueNumber !== undefined
        ) {
          const { min, max } = getRangeBounds(field.ranges);
          const value = fieldResponse.valueNumber;

          if (min !== undefined && value < min) {
            const errorMsg = `${field.label} must be at least ${min}`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
          if (max !== undefined && value > max) {
            const errorMsg = `${field.label} must be at most ${max}`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
        }
      }

      if (field.fieldType === FieldType.Text || field.fieldType === FieldType.TextArea) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
        if (fieldResponse && fieldResponse.valueText) {
          const textLength = fieldResponse.valueText.length;

          if (field.minLength && textLength < field.minLength) {
            const errorMsg = `${field.label} must be at least ${field.minLength} characters`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
          if (field.maxLength && textLength > field.maxLength) {
            const errorMsg = `${field.label} must be at most ${field.maxLength} characters`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
        }
      }

      if (field.fieldType === FieldType.Date) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
        if (fieldResponse && fieldResponse.valueDate) {
          const fieldDate = new Date(fieldResponse.valueDate);

          if (field.minDate) {
            const minDate = new Date(field.minDate);
            if (fieldDate < minDate) {
              const errorMsg = `${field.label} must be on or after ${field.minDate}`;
              errors.push(errorMsg);
              fieldErrors[fieldKey] = errorMsg;
            }
          }
          if (field.maxDate) {
            const maxDate = new Date(field.maxDate);
            if (fieldDate > maxDate) {
              const errorMsg = `${field.label} must be on or before ${field.maxDate}`;
              errors.push(errorMsg);
              fieldErrors[fieldKey] = errorMsg;
            }
          }
        }
      }
    });

    setAccountErrors(fieldErrors);
    return errors;
  };

  const handleCreateAccount = async () => {
    setAccountErrors({});

    const validationErrors = validateAccountCreation(accountData, accountFieldResponses);

    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors[0],
        variant: 'destructive'
      });
      return;
    }

    setAccountsLoading(true);
    try {
      const accountDataWithFields = {
        ...accountData,
        recordId: selectedRecord.id,
        templateId: 13,
        fieldResponses: accountFieldResponses
      };
      const res = await accountService.createAccount(accountDataWithFields);
      setAccounts((prev: any[]) => [...prev, { ...accountData, id: res.id }]);
      setShowCreateAccount(false);
      setAccountData({});
      setAccountFieldResponses([]);
      toast({
        title: 'Success',
        description: 'Account created successfully'
      });
      setSelectedAccount({ ...accountData, id: res.id });
    } catch (error: any) {
      console.error('Error creating account:', error);
      console.error('Error response data:', error.response?.data);

      // Handle validation errors from server
      if (error.response?.data?.validationErrors) {
        const validationErrors = error.response.data.validationErrors;
        const errorMessages: string[] = [];

        // Convert validation errors to user-friendly messages
        Object.keys(validationErrors).forEach((field) => {
          const fieldErrors = validationErrors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((errorMsg: string) => {
              errorMessages.push(`${field}: ${errorMsg}`);
            });
          } else {
            errorMessages.push(`${field}: ${fieldErrors}`);
          }
        });

        toast({
          title: 'Validation Error',
          description: errorMessages.join('\n'),
          variant: 'destructive'
        });
      } else {
        // Handle other errors
        toast({
          title: 'Error',
          description: error?.response?.data?.message || error?.response?.data?.details || 'Failed to create account',
          variant: 'destructive'
        });
      }
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleDone = () => {
    if (selectedAccount) {
      onAccountSelected(selectedAccount);
      onOpenChange(false);
    } else {
      toast({
        title: 'Select an account',
        description: 'Please select an account before continuing.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {/* Step 1: Select Record */}
          {!selectedRecord && (
            <>
              {/* Template Selection */}
              <div className="mb-4 p-4 border rounded-lg bg-blue-50">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="templateId" className="text-sm font-medium mb-2 block">
                      Select Template <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedTemplateId ? selectedTemplateId.toString() : ''}
                      onValueChange={(value) => {
                        setSelectedTemplateId(Number(value));
                        setCurrentPage(1);
                        setSearchTerm('');
                        setSearchType(null);
                        setFilterType('customer');
                        setSelectedRecord(null);
                        setSelectedAccount(null);
                        setAccounts([]);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templatesLoading ? (
                          <div className="p-4 text-center">Loading templates...</div>
                        ) : (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name} (v{template.version})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedTemplateId && (
                  <div className="mt-3 text-sm text-blue-600">
                    Template selected: {templates.find((t) => t.id === selectedTemplateId)?.name}
                  </div>
                )}
              </div>

              {/* Unified Search Interface */}
              {selectedTemplateId && (
                <div className="mb-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-green-50">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="searchTerm" className="text-sm font-medium mb-2 block">
                        Filter Records (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={filterType}
                          onValueChange={(value: 'customer' | 'account') => {
                            setFilterType(value);
                            setSearchTerm('');
                            setSearchType(null);
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer ID</SelectItem>
                            <SelectItem value="account">Account Number</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="searchTerm"
                          placeholder={
                            filterType === 'customer'
                              ? 'Enter customer ID...'
                              : 'Enter account number...'
                          }
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUnifiedSearch();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleUnifiedSearch}
                      disabled={unifiedSearchLoading}
                      className="w-full md:w-auto"
                    >
                      {unifiedSearchLoading ? 'Searching...' : 'Filter'}
                    </Button>
                  </div>

                  {/* Search Results Summary */}
                  {searchType && (
                    <div className="mt-3 p-3 rounded bg-white border">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${searchType === 'customer' ? 'bg-blue-500' : 'bg-green-500'}`}
                        ></div>
                        <span className="text-sm font-medium">
                          {searchType === 'customer' ? 'Customer Records' : 'Account Search'}
                        </span>
                        <span className="text-xs text-gray-500">
                          (
                          {searchType === 'customer'
                            ? `${totalCount} customers found`
                            : `${accounts.length} accounts found`}
                          )
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {searchTerm ? `Searching for: "${searchTerm}"` : 'Showing all customers'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Records Table */}
              {selectedTemplateId ? (
                recordsLoading ? (
                  <div className="p-4 text-center">Loading...</div>
                ) : (
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-3 py-2 text-left">Select</th>
                          <th className="border px-3 py-2 text-left">ID</th>
                          <th className="border px-3 py-2 text-left">Name</th>
                          <th className="border px-3 py-2 text-left">Customer Ref ID</th>
                          <th className="border px-3 py-2 text-left">DOB</th>
                          <th className="border px-3 py-2 text-left">Identification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((rec) => (
                          <tr key={rec.id}>
                            <td className="border px-3 py-2">
                              <input
                                type="radio"
                                name="record"
                                checked={selectedRecord?.id === rec.id}
                                onChange={() => setSelectedRecord(rec)}
                              />
                            </td>
                            <td className="border px-3 py-2">{rec.id}</td>
                            <td className="border px-3 py-2">
                              {rec.firstName} {rec.lastName}
                            </td>
                            <td className="border px-3 py-2">{rec.customerReferenceId || '-'}</td>
                            <td className="border px-3 py-2">{rec.dateOfBirth}</td>
                            <td className="border px-3 py-2">{rec.identification}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">Select a Template</div>
                  <div className="text-sm">Please select a template above to view customers</div>
                </div>
              )}

              {/* Pagination Controls */}
              {selectedTemplateId && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || recordsLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || recordsLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Show selected record info and accounts OR account search results */}
          {(selectedRecord || (searchType === 'account' && accounts.length > 0)) && (
            <>
              <div className="mb-4 p-3 rounded border bg-white flex flex-col md:flex-row md:items-center md:gap-8">
                <div>
                  {selectedRecord ? (
                    <>
                      <div className="font-semibold">
                        {selectedRecord.firstName} {selectedRecord.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {selectedRecord.id} | Identification: {selectedRecord.identification}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        DOB: {selectedRecord.dateOfBirth}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold">Account Search Results</div>
                      <div className="text-xs text-muted-foreground">
                        Found {accounts.length} account(s) for: "{searchTerm}"
                      </div>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (selectedRecord) {
                      setSelectedRecord(null);
                    } else {
                      setSearchTerm('');
                      setSearchType(null);
                      setAccounts([]);
                    }
                    setSelectedAccount(null);
                  }}
                >
                  {selectedRecord ? 'Change Customer' : 'New Search'}
                </Button>
              </div>

              <div className="mb-2 font-medium">Select Account</div>
              {accountsLoading ? (
                <div className="p-4 text-center">Loading accounts...</div>
              ) : (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border px-3 py-2 text-left">Select</th>
                        <th className="border px-3 py-2 text-left">Name</th>
                        <th className="border px-3 py-2 text-left">Number</th>
                        <th className="border px-3 py-2 text-left">Bank</th>
                        <th className="border px-3 py-2 text-left">City</th>
                        <th className="border px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc) => (
                        <React.Fragment key={acc.id}>
                          <tr>
                            <td className="border px-3 py-2">
                              <input
                                type="radio"
                                name="account"
                                checked={selectedAccount?.id === acc.id}
                                onChange={() => setSelectedAccount(acc)}
                              />
                            </td>
                            <td className="border px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleAccountExpansion(acc.id)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  {expandedAccounts[acc.id] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                {acc.name}
                              </div>
                            </td>
                            <td className="border px-3 py-2">{acc.number}</td>
                            <td className="border px-3 py-2">{acc.bankOfCountryName}</td>
                            <td className="border px-3 py-2">{acc.bankOfCity}</td>
                            <td className="border px-3 py-2">{acc.accountStatus}</td>
                          </tr>
                          {expandedAccounts[acc.id] && (
                            <tr>
                              <td colSpan={6} className="border px-3 py-2 bg-gray-50">
                                {loadingAccountResponses[acc.id] ? (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    <span className="ml-2 text-sm text-muted-foreground">
                                      Loading field responses...
                                    </span>
                                  </div>
                                ) : accountFieldResponsesData[acc.id] &&
                                  accountFieldResponsesData[acc.id].length > 0 ? (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">
                                      Account Field Responses:
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {accountFieldResponsesData[acc.id].map((response) => (
                                        <div
                                          key={response.id}
                                          className="bg-white p-3 rounded border"
                                        >
                                          <div className="text-sm font-medium text-gray-700">
                                            {response.fieldName}
                                          </div>
                                          <div className="text-sm text-gray-900 mt-1">
                                            {renderFieldResponseValue(response)}
                                          </div>
                                          {response.created && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Created:{' '}
                                              {new Date(response.created).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 py-2">
                                    No field responses found for this account.
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateAccount((v) => !v)}
              >
                {showCreateAccount ? 'Hide' : 'Create New Account'}
              </Button>

              {showCreateAccount && (
                <div className="mt-4 p-4 border rounded bg-muted/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      name="name"
                      placeholder="Name"
                      onChange={(e) =>
                        setAccountData((a: any) => ({
                          ...a,
                          name: e.target.value
                        }))
                      }
                      autoComplete="off"
                    />
                    <Input
                      name="number"
                      placeholder="Account Number"
                      onChange={(e) =>
                        setAccountData((a: any) => ({
                          ...a,
                          number: e.target.value
                        }))
                      }
                      autoComplete="off"
                    />
                    <Select
                      value={String(accountData.bankOfCountryId || '')}
                      onValueChange={(v) =>
                        setAccountData((a: any) => ({
                          ...a,
                          bankOfCountryId: v
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Bank Of Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankCountriesLoading ? (
                          <div className="p-4 text-center">Loading countries...</div>
                        ) : (
                          bankCountries.map((country) => (
                            <SelectItem key={country.id} value={String(country.id)}>
                              {country.value}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      name="bankOfCity"
                      placeholder="Bank Of City"
                      onChange={(e) =>
                        setAccountData((a: any) => ({
                          ...a,
                          bankOfCity: e.target.value
                        }))
                      }
                      autoComplete="off"
                    />
                    <Input
                      name="creationDate"
                      placeholder="Creation Date"
                      type="datetime-local"
                      onChange={(e) =>
                        setAccountData((a: any) => ({
                          ...a,
                          creationDate: e.target.value
                        }))
                      }
                    />
                    <Select
                      value={String(accountData.accountStatus || '')}
                      onValueChange={(v) =>
                        setAccountData((a: any) => ({
                          ...a,
                          accountStatus: Number(v)
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Account Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {AccountStatusEnum.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Template Fields for Account */}
                  {accountTemplateFields.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-md font-medium mb-3 text-muted-foreground">
                        Additional Account Information
                      </h4>
                      {accountTemplateFieldsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading fields...
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sortFields(accountTemplateFields)
                            .filter((field) => field.fieldType !== FieldType.Checkbox)
                            .map((field) => (
                              <div
                                key={field.id}
                                className={cn(
                                  'p-3 rounded border bg-gray-50/50',
                                  field.fieldType === FieldType.TextArea ? 'md:col-span-2' : ''
                                )}
                              >
                                {renderAccountDynamicField(field)}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Checkbox fields for account template */}
                      {accountTemplateFields.some(
                        (field) => field.fieldType === FieldType.Checkbox
                      ) && (
                        <div className="mt-4 pt-3 border-t">
                          <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                            Account Options
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sortFields(accountTemplateFields)
                              .filter((field) => field.fieldType === FieldType.Checkbox)
                              .map((field) => (
                                <div key={field.id} className="p-2 rounded border bg-gray-50/30">
                                  {renderAccountDynamicField(field)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    className="mt-4"
                    onClick={handleCreateAccount}
                    disabled={accountsLoading}
                  >
                    Create Account
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" onClick={handleDone}>
            Done
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/records/new')}>
            Create New Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSelectionDialog;
