import React, { useState, useEffect } from 'react';
import {
  AggregateFieldIdOptions,
  FIELD_DIVIDER,
  CUSTOM_FIELD_PREFIX,
  isCustomField,
  getCustomFieldId,
  createCustomFieldId,
  AggregateFunctionOptions,
  AggregationByOptions,
  FilterByOptions,
  DurationTypeOptions,
  AccountTypeOptions,
  AggregateFieldId,
  TransactionStatusOptions,
  ComparisonOperatorOptions,
  StatusOperatorOptions,
  StatusOperator,
  ComparisonOperator,
  AggregateFunction,
  RuleTypeOptions,
  RiskStatusOptions,
  RiskStatusOperatorOptions
} from './enums';
import {
  customValueService,
  CustomValueOption,
  templateService,
  lookupService,
  FieldType,
  TemplateField,
  FieldOption,
  LookupValue
} from '@/services/api';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Calculator, Layers } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';

export interface Condition {
  title: string;
  isAggregated: boolean;
  isAggregatedCustomField: boolean;
  aggregateFieldId: number | null;
  customFieldId: number | null;
  aggregateFunction: number | null; // now string for comparison operators
  aggregationBy: number | null;
  filterBy: number | null;
  duration: number | null;
  durationType: number | null;
  lastTransactionCount: number | null;
  accountType: number | null;
  jsonValue: string;
  customValueId?: number | null; // ID of selected custom value
  ComparisonOperator?: number; // Changed property name to match backend expectation
  // New properties for custom fields
  selectedFieldId?: string | number | null; // This will store either static field id or custom_<id>
  customFieldType?: number | null; // Store the FieldType of the custom field
  customFieldOptions?: Array<{ id: number; label: string; value?: string }>; // Options for dropdown/radio/checkbox
  customFieldLookupId?: number | null; // Lookup ID for lookup fields
}

interface RuleConditionProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
  conditionIndex: number;
  readOnly?: boolean;
}

// Inline MultiSelect component (from SanctionSearchPage)
type MultiSelectOption = { label: string; value: string | number };
interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}
const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options...'
}) => {
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
      value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]
    );
  };

  const selectedLabels = options
    .filter((option) => value.includes(option.value.toString()))
    .map((option) => option.label)
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
              <div className="px-3 pb-2 text-[13px] text-gray-600">Select status(es)</div>
              <div className="max-h-[240px] overflow-y-auto">
                {options.map((option) => (
                  <div
                    key={option.value}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-[7px]',
                      'cursor-pointer transition-colors',
                      'hover:bg-gray-50',
                      value.includes(option.value.toString()) && 'bg-blue-50/50'
                    )}
                    onClick={() => toggleOption(option.value.toString())}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        toggleOption(option.value.toString());
                      }
                    }}
                  >
                    <div
                      className={clsx(
                        'relative flex items-center justify-center',
                        'w-[18px] h-[18px] rounded transition-colors',
                        value.includes(option.value.toString())
                          ? 'bg-primary border-primary'
                          : 'border-2 border-gray-300 hover:border-primary'
                      )}
                    >
                      {value.includes(option.value.toString()) && (
                        <span className="ki-duotone ki-check absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] leading-none text-white before:content-['\\ea1e'] before:font-ki" />
                      )}
                    </div>
                    <span
                      className={clsx(
                        'flex-1 text-[13px]',
                        value.includes(option.value.toString()) ? 'text-primary' : 'text-gray-700'
                      )}
                    >
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
                  onClick={() => onChange(options.map((o) => o.value.toString()))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onChange(options.map((o) => o.value.toString()));
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

function getLabel(options: { label: string; value: any }[], value: any) {
  const found = options.find((opt) => opt.value === value);
  return found ? found.label : value;
}
function getOperatorLabel(value: any, fieldId: any, operatorProp?: any) {
  // First check for ComparisonOperator (new field from backend)
  if (operatorProp !== undefined && operatorProp !== null) {
    if (fieldId === AggregateFieldId.TransactionStatus) {
      return getLabel(StatusOperatorOptions, operatorProp) || '[Operator]';
    }
    if (fieldId === AggregateFieldId.RiskStatus) {
      return getLabel(RiskStatusOperatorOptions, operatorProp) || '[Operator]';
    }
    if (
      fieldId === AggregateFieldId.Amount ||
      fieldId === AggregateFieldId.TransactionCount ||
      fieldId === AggregateFieldId.TransactionTime ||
      fieldId === AggregateFieldId.CurrencyAmount
    ) {
      return getLabel(ComparisonOperatorOptions, operatorProp) || '[Operator]';
    }
  }

  // Fallback to aggregateFunction for legacy data
  if (fieldId === AggregateFieldId.TransactionStatus) {
    return getLabel(StatusOperatorOptions, value) || '[Operator]';
  }
  if (fieldId === AggregateFieldId.RiskStatus) {
    return getLabel(RiskStatusOperatorOptions, value) || '[Operator]';
  }
  if (
    fieldId === AggregateFieldId.Amount ||
    fieldId === AggregateFieldId.TransactionCount ||
    fieldId === AggregateFieldId.TransactionTime ||
    fieldId === AggregateFieldId.CurrencyAmount
  ) {
    return getLabel(ComparisonOperatorOptions, value) || '[Operator]';
  }
  return getLabel(AggregateFunctionOptions, value) || '[Operator]';
}
function getDurationTypeLabel(value: any) {
  return getLabel(DurationTypeOptions, value) || '[Duration Type]';
}
function getAccountTypeLabel(value: any) {
  return getLabel(AccountTypeOptions, value) || '[Account Type]';
}
function getFilterByLabel(value: any) {
  return getLabel(FilterByOptions, value) || '[Filter By]';
}

const RuleCondition: React.FC<RuleConditionProps> = ({
  condition,
  onChange,
  onRemove,
  conditionIndex,
  readOnly
}) => {
  const navigate = useNavigate();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showAggError, setShowAggError] = useState(false);
  const [customValues, setCustomValues] = useState<CustomValueOption[]>([]);
  const [valueType, setValueType] = useState<'manual' | 'custom'>(() => {
    // Initialize based on existing condition data
    return condition.customValueId ? 'custom' : 'manual';
  }); // Track if user wants manual entry or custom value

  // New state for custom fields with entity types
  const [customFields, setCustomFields] = useState<{
    transaction: TemplateField[]; // Old custom fields from transaction template
    individual: TemplateField[];
    organization: TemplateField[];
  }>({ transaction: [], individual: [], organization: [] });
  const [combinedFieldOptions, setCombinedFieldOptions] = useState<
    Array<{
      label: string;
      value: string | number;
      isDivider?: boolean;
      isEntityHeader?: boolean;
      entityType?: 'transaction' | 'individual' | 'organization';
    }>
  >([]);
  const [customFieldOptions, setCustomFieldOptions] = useState<
    Array<{ id: number; label: string; value?: string }>
  >([]);
  const [customFieldLookupValues, setCustomFieldLookupValues] = useState<LookupValue[]>([]);
  const [loadingCustomFieldOptions, setLoadingCustomFieldOptions] = useState(false);

  // Search functionality for field dropdown
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const fieldDropdownRef = useRef<HTMLDivElement>(null);

  // Template IDs
  const TRANSACTION_TEMPLATE_ID = 15; // Old custom fields
  const INDIVIDUAL_TEMPLATE_ID = 17;
  const ORGANIZATION_TEMPLATE_ID = 18;

  // Load custom values and custom fields when component mounts
  useEffect(() => {
    const loadCustomValues = async () => {
      try {
        const values = await customValueService.getCustomValueOptions();
        setCustomValues(values);
      } catch (error) {
        console.error('Failed to load custom values:', error);
      }
    };

    const loadCustomFields = async () => {
      try {
        // Debug: List all available templates
        try {
          const allTemplates = await templateService.getTemplates({
            pageNumber: 1,
            pageSize: 100,
            templateType: 1 // Record type
          });
          console.log(
            'Available templates:',
            allTemplates.items.map((t) => ({ id: t.id, name: t.name, status: t.status }))
          );
        } catch (error) {
          console.error('Failed to fetch templates list:', error);
        }

        // Fetch custom fields for all template types with individual error handling
        let transactionFieldsResponse, individualFieldsResponse, organizationFieldsResponse;

        try {
          transactionFieldsResponse = await templateService.getTemplateFields(
            TRANSACTION_TEMPLATE_ID.toString()
          );
          console.log('Transaction template loaded successfully');
        } catch (error) {
          console.error('Failed to load transaction template:', error);
          transactionFieldsResponse = { sections: [], fieldsWithoutSection: [] };
        }

        try {
          individualFieldsResponse = await templateService.getTemplateFields(
            INDIVIDUAL_TEMPLATE_ID.toString()
          );
          console.log('Individual template loaded successfully');
        } catch (error) {
          console.error('Failed to load individual template:', error);
          individualFieldsResponse = { sections: [], fieldsWithoutSection: [] };
        }

        // Try to find organization template by trying multiple IDs
        organizationFieldsResponse = { sections: [], fieldsWithoutSection: [] }; // Initialize with default
        let organizationTemplateFound = false;
        try {
          organizationFieldsResponse = await templateService.getTemplateFields(
            ORGANIZATION_TEMPLATE_ID.toString()
          );
        } catch (error) {
          console.error('Failed to load organization template:', error);
          organizationFieldsResponse = { sections: [], fieldsWithoutSection: [] };
        }

        if (!organizationTemplateFound) {
          console.error('No organization template found, using empty response');
        }

        // Process transaction fields (old custom fields)
        const allTransactionFields = [
          ...transactionFieldsResponse.sections.flatMap((section) => section.fields),
          ...transactionFieldsResponse.fieldsWithoutSection
        ];
        const allowedTransactionFields = allTransactionFields.filter(
          (field) =>
            field.fieldType === FieldType.Dropdown ||
            field.fieldType === FieldType.Lookup ||
            field.fieldType === FieldType.Radio ||
            field.fieldType === FieldType.Checkbox ||
            field.fieldType === FieldType.Number
        );

        // Process individual fields
        const allIndividualFields = [
          ...individualFieldsResponse.sections.flatMap((section) => section.fields),
          ...individualFieldsResponse.fieldsWithoutSection
        ];
        const allowedIndividualFields = allIndividualFields.filter(
          (field) =>
            field.fieldType === FieldType.Dropdown ||
            field.fieldType === FieldType.Lookup ||
            field.fieldType === FieldType.Radio ||
            field.fieldType === FieldType.Checkbox ||
            field.fieldType === FieldType.Number
        );

        // Process organization fields
        const allOrganizationFields = [
          ...organizationFieldsResponse.sections.flatMap((section) => section.fields),
          ...organizationFieldsResponse.fieldsWithoutSection
        ];
        const allowedOrganizationFields = allOrganizationFields.filter(
          (field) =>
            field.fieldType === FieldType.Dropdown ||
            field.fieldType === FieldType.Lookup ||
            field.fieldType === FieldType.Radio ||
            field.fieldType === FieldType.Checkbox ||
            field.fieldType === FieldType.Number
        );

        // Debug logging
        console.log('Transaction fields:', allowedTransactionFields.length);
        console.log('Individual fields:', allowedIndividualFields.length);
        console.log('Organization fields:', allowedOrganizationFields.length);
        console.log('Organization fields data:', allowedOrganizationFields);

        setCustomFields({
          transaction: allowedTransactionFields,
          individual: allowedIndividualFields,
          organization: allowedOrganizationFields
        });

        // Create combined field options with static fields + entity type sub-menus
        const combined = [
          // Static hardcoded fields
          ...AggregateFieldIdOptions.map((opt) => ({ label: opt.label, value: opt.value })),

          // Custom fields divider
          { label: '--- Custom Fields ---', value: 'divider', isDivider: true },

          // Old transaction custom fields (show first)
          ...allowedTransactionFields.map((field) => ({
            label: field.label,
            value: createCustomFieldId(field.id!),
            entityType: 'transaction' as const
          })),

          // Individual entity type header (only show if has fields)
          ...(allowedIndividualFields.length > 0
            ? [
                {
                  label: 'Individual',
                  value: 'individual_header',
                  isEntityHeader: true,
                  entityType: 'individual' as const
                }
              ]
            : []),
          ...allowedIndividualFields.map((field) => ({
            label: `  ${field.label}`, // Indent to show it's under Individual
            value: createCustomFieldId(field.id!),
            entityType: 'individual' as const
          })),

          // Organization entity type header (always show for debugging)
          {
            label: 'Organization',
            value: 'organization_header',
            isEntityHeader: true,
            entityType: 'organization' as const
          },
          ...allowedOrganizationFields.map((field) => ({
            label: `  ${field.label}`, // Indent to show it's under Organization
            value: createCustomFieldId(field.id!),
            entityType: 'organization' as const
          })),
          // Debug: Add test organization field
          ...(allowedOrganizationFields.length === 0
            ? [
                {
                  label: '  [No organization fields found]',
                  value: 'debug_org',
                  entityType: 'organization' as const
                }
              ]
            : [])
        ];
        setCombinedFieldOptions(combined);
      } catch (error) {
        console.error('Failed to load custom fields:', error);
      }
    };

    loadCustomValues();
    loadCustomFields();
  }, []);

  // Close field dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fieldDropdownRef.current && !fieldDropdownRef.current.contains(event.target as Node)) {
        setIsFieldDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter field options based on search term
  const filteredFieldOptions = combinedFieldOptions.filter((opt) => {
    if (opt.isDivider || opt.isEntityHeader) return true;
    return opt.label.toLowerCase().includes(fieldSearchTerm.toLowerCase());
  });

  // Sync valueType when condition changes (e.g., when switching between conditions)
  useEffect(() => {
    setValueType(condition.customValueId ? 'custom' : 'manual');
  }, [condition.customValueId]);

  // Load custom field options when a custom field is selected
  useEffect(() => {
    const loadCustomFieldOptions = async () => {
      if (!condition.selectedFieldId || !isCustomField(condition.selectedFieldId)) {
        setCustomFieldOptions([]);
        setCustomFieldLookupValues([]);
        return;
      }

      const customFieldId = getCustomFieldId(condition.selectedFieldId);
      const field = [
        ...customFields.transaction,
        ...customFields.individual,
        ...customFields.organization
      ].find((f) => f.id === customFieldId);

      if (!field) return;

      setLoadingCustomFieldOptions(true);

      try {
        if (
          field.fieldType === FieldType.Dropdown ||
          field.fieldType === FieldType.Radio ||
          field.fieldType === FieldType.Checkbox
        ) {
          // Load field options - determine template ID based on which entity type contains this field
          const templateId = customFields.transaction.some((f) => f.id === customFieldId)
            ? TRANSACTION_TEMPLATE_ID.toString()
            : customFields.individual.some((f) => f.id === customFieldId)
              ? INDIVIDUAL_TEMPLATE_ID.toString()
              : ORGANIZATION_TEMPLATE_ID.toString();

          const options = await templateService.getFieldOptions(templateId, field.id!);
          setCustomFieldOptions(
            options.map((opt) => ({
              id: opt.id!,
              label: opt.label,
              value: opt.label
            }))
          );
        } else if (field.fieldType === FieldType.Lookup && field.lookupId) {
          // Load lookup values - determine template ID based on which entity type contains this field
          const templateId = customFields.transaction.some((f) => f.id === customFieldId)
            ? TRANSACTION_TEMPLATE_ID.toString()
            : customFields.individual.some((f) => f.id === customFieldId)
              ? INDIVIDUAL_TEMPLATE_ID.toString()
              : ORGANIZATION_TEMPLATE_ID.toString();

          const lookupValues = await lookupService.getLookupValues(field.lookupId, {
            pageNumber: 1,
            pageSize: 100
          });
          setCustomFieldLookupValues(lookupValues.items);
        }
      } catch (error) {
        console.error('Failed to load custom field options:', error);
      } finally {
        setLoadingCustomFieldOptions(false);
      }
    };

    loadCustomFieldOptions();
  }, [
    condition.selectedFieldId,
    customFields.transaction,
    customFields.individual,
    customFields.organization,
    TRANSACTION_TEMPLATE_ID,
    INDIVIDUAL_TEMPLATE_ID,
    ORGANIZATION_TEMPLATE_ID
  ]);

  const handleFieldChange = (field: keyof Condition, value: any) => {
    if (readOnly) return;
    // If user enables aggregation and aggregateFunction is not set, default to Sum
    if (field === 'isAggregated' && value && !condition.aggregateFunction) {
      onChange({ ...condition, isAggregated: value, aggregateFunction: AggregateFunction.Sum });
    } else {
      onChange({ ...condition, [field]: value });
    }
  };

  // Helper for Transaction Time date value
  const dateValue = condition.jsonValue ? new Date(condition.jsonValue) : undefined;

  // Aggregate function validation
  const handleAggregateFunctionChange = (v: string) => {
    if (readOnly) return;
    setShowAggError(false);
    handleFieldChange('aggregateFunction', v ? Number(v) : null);
  };

  return (
    <div className="border rounded-xl shadow bg-white mb-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-t-xl border-b">
        <span className="font-semibold text-gray-700">Condition {conditionIndex + 1}</span>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-100"
              onClick={onRemove}
              aria-label="Remove condition"
              type="button"
            >
              <Trash2 className="text-red-500" size={20} />
            </Button>
          </div>
        )}
      </div>
      {/* Main Fields */}
      {readOnly ? (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Field</div>
              <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                {condition.customFieldId
                  ? [
                      ...customFields.transaction,
                      ...customFields.individual,
                      ...customFields.organization
                    ].find((f) => f.id === condition.customFieldId)?.label || '[Custom Field]'
                  : getLabel(AggregateFieldIdOptions, condition.aggregateFieldId)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Operator</div>
              <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                {(() => {
                  // Custom field logic
                  if (condition.customFieldId !== null && condition.customFieldType !== null) {
                    if (
                      condition.customFieldType === FieldType.Dropdown ||
                      condition.customFieldType === FieldType.Radio ||
                      condition.customFieldType === FieldType.Checkbox ||
                      condition.customFieldType === FieldType.Lookup
                    ) {
                      return (
                        getLabel(StatusOperatorOptions, condition.ComparisonOperator) ||
                        '[Operator]'
                      );
                    } else if (condition.customFieldType === FieldType.Number) {
                      return (
                        getLabel(ComparisonOperatorOptions, condition.ComparisonOperator) ||
                        '[Operator]'
                      );
                    }
                    return '[Operator]';
                  }

                  // Static field logic (existing)
                  return getOperatorLabel(
                    condition.aggregateFunction,
                    condition.aggregateFieldId,
                    condition.ComparisonOperator
                  );
                })()}
              </div>
            </div>
            {condition.isAggregated && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Aggregate Function</div>
                <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                  {getLabel(AggregateFunctionOptions, condition.aggregateFunction)}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Value</div>
              <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                {(() => {
                  if (!condition.jsonValue) return '[Value]';

                  // Handle custom fields
                  if (condition.customFieldId !== null && condition.customFieldType !== null) {
                    try {
                      const parsed = JSON.parse(condition.jsonValue);
                      if (Array.isArray(parsed)) {
                        if (
                          condition.customFieldType === FieldType.Dropdown ||
                          condition.customFieldType === FieldType.Radio ||
                          condition.customFieldType === FieldType.Checkbox
                        ) {
                          // Show option labels if available
                          const labels = parsed
                            .map((id: number) => {
                              const option = customFieldOptions.find((opt) => opt.id === id);
                              return option ? option.label : id;
                            })
                            .join(', ');
                          return labels || condition.jsonValue;
                        } else if (condition.customFieldType === FieldType.Lookup) {
                          // Show lookup value labels if available
                          const labels = parsed
                            .map((id: number) => {
                              const value = customFieldLookupValues.find((val) => val.id === id);
                              return value ? value.value : id;
                            })
                            .join(', ');
                          return labels || condition.jsonValue;
                        } else {
                          return parsed.join(', ');
                        }
                      } else {
                        return parsed;
                      }
                    } catch {
                      return condition.jsonValue;
                    }
                  }

                  // Handle static fields (existing logic)
                  try {
                    if (condition.aggregateFieldId === AggregateFieldId.TransactionTime) {
                      const date = new Date(condition.jsonValue);
                      return isNaN(date.getTime())
                        ? condition.jsonValue
                        : format(date, 'yyyy-MM-dd');
                    } else {
                      const parsed = JSON.parse(condition.jsonValue);
                      if (Array.isArray(parsed)) {
                        if (condition.aggregateFieldId === AggregateFieldId.TransactionStatus) {
                          const labels = parsed
                            .map((v: number) => getLabel(TransactionStatusOptions, v) || v)
                            .join(', ');
                          return labels || condition.jsonValue;
                        } else {
                          return parsed.join(', ');
                        }
                      } else {
                        return parsed;
                      }
                    }
                  } catch {
                    return condition.jsonValue;
                  }
                })()}
              </div>
            </div>
            {condition.filterBy && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {condition.customFieldId &&
                  (customFields.individual.some((f) => f.id === condition.customFieldId) ||
                    customFields.organization.some((f) => f.id === condition.customFieldId))
                    ? 'Apply To'
                    : 'Filter By'}
                </div>
                <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                  {condition.customFieldId &&
                  (customFields.individual.some((f) => f.id === condition.customFieldId) ||
                    customFields.organization.some((f) => f.id === condition.customFieldId))
                    ? condition.filterBy === 1
                      ? 'Sender'
                      : condition.filterBy === 2
                        ? 'Receiver'
                        : 'Unknown'
                    : getFilterByLabel(condition.filterBy)}
                </div>
              </div>
            )}
            {condition.duration && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Duration</div>
                <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                  {condition.duration}
                </div>
              </div>
            )}
            {condition.durationType && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Duration Type</div>
                <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                  {getDurationTypeLabel(condition.durationType)}
                </div>
              </div>
            )}
            {condition.lastTransactionCount && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Transaction Count</div>
                <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                  {condition.lastTransactionCount}
                </div>
              </div>
            )}
            {condition.accountType && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Account Type</div>
                <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                  {getAccountTypeLabel(condition.accountType)}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-1 text-gray-700">Field</label>
            {readOnly ? (
              <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                {condition.aggregateFieldId}
              </div>
            ) : (
              <div className="flex gap-2">
                {/* Custom Searchable Field Dropdown */}
                <div className="relative w-full" ref={fieldDropdownRef}>
                  <div
                    className={clsx(
                      'w-full h-[42px] bg-white px-3 cursor-pointer',
                      'flex items-center justify-between text-left',
                      'border border-gray-300 rounded-lg',
                      'transition-all duration-200',
                      'hover:border-primary/50 hover:shadow-sm',
                      'focus:border-primary focus:ring-1 focus:ring-primary focus:ring-opacity-20',
                      isFieldDropdownOpen &&
                        'border-primary ring-1 ring-primary ring-opacity-20 shadow-sm',
                      readOnly && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => !readOnly && setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !readOnly) {
                        setIsFieldDropdownOpen(!isFieldDropdownOpen);
                      }
                    }}
                  >
                    <span className="truncate text-sm text-gray-900 flex-1">
                      {(() => {
                        const selectedValue =
                          condition.selectedFieldId?.toString() ||
                          condition.aggregateFieldId?.toString() ||
                          '';
                        if (!selectedValue) return 'Select Field';

                        const selectedField = combinedFieldOptions.find(
                          (opt) => opt.value.toString() === selectedValue
                        );
                        return selectedField ? selectedField.label : 'Select Field';
                      })()}
                    </span>
                    <div className="flex items-center ml-2">
                      <KeenIcon
                        icon={isFieldDropdownOpen ? 'arrow-up' : 'arrow-down'}
                        className={clsx(
                          'w-4 h-4 transition-transform duration-200',
                          isFieldDropdownOpen ? 'text-primary' : 'text-gray-500'
                        )}
                      />
                    </div>
                  </div>

                  {isFieldDropdownOpen && !readOnly && (
                    <div className="absolute z-50 w-full mt-1 min-w-[400px]">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100">
                          <Input
                            value={fieldSearchTerm}
                            onChange={(e) => setFieldSearchTerm(e.target.value)}
                            placeholder="Search fields..."
                            className="w-full h-8 text-sm"
                            autoFocus
                          />
                        </div>

                        {/* Options List */}
                        <div className="max-h-[300px] overflow-y-auto">
                          {filteredFieldOptions.map((opt, index) => {
                            if (opt.isDivider) {
                              return (
                                <div
                                  key={index}
                                  className="px-3 py-2 text-xs text-gray-500 bg-gray-50 font-medium border-b border-gray-100"
                                >
                                  {opt.label}
                                </div>
                              );
                            }
                            if (opt.isEntityHeader) {
                              return (
                                <div
                                  key={index}
                                  className="px-3 py-2 text-sm text-gray-700 bg-blue-50 font-semibold"
                                >
                                  {opt.label}
                                </div>
                              );
                            }
                            return (
                              <div
                                key={opt.value}
                                className={clsx(
                                  'flex items-center px-3 py-2.5 cursor-pointer transition-colors',
                                  'hover:bg-gray-50 hover:text-gray-900',
                                  (condition.selectedFieldId?.toString() ||
                                    condition.aggregateFieldId?.toString()) === opt.value.toString()
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700'
                                )}
                                onClick={() => {
                                  const v = opt.value.toString();
                                  const isCustom = isCustomField(v);

                                  if (isCustom) {
                                    // Handle custom field selection
                                    const customFieldId = getCustomFieldId(v);
                                    const field = [
                                      ...customFields.transaction,
                                      ...customFields.individual,
                                      ...customFields.organization
                                    ].find((f) => f.id === customFieldId);

                                    onChange({
                                      ...condition,
                                      selectedFieldId: v,
                                      customFieldId: customFieldId,
                                      customFieldType: field?.fieldType || null,
                                      customFieldLookupId: field?.lookupId || null,
                                      isAggregatedCustomField: true, // Set to true for custom fields
                                      aggregateFieldId: null, // clear static field
                                      jsonValue: '',
                                      aggregateFunction: null,
                                      ComparisonOperator: undefined,
                                      isAggregated: false, // Reset aggregation when field changes
                                      // Also reset aggregation-related fields
                                      accountType: null,
                                      filterBy: null,
                                      duration: null,
                                      durationType: null,
                                      lastTransactionCount: null
                                    });
                                  } else {
                                    // Handle static field selection
                                    onChange({
                                      ...condition,
                                      selectedFieldId: v,
                                      aggregateFieldId: v ? Number(v) : null,
                                      customFieldId: null, // clear custom field
                                      customFieldType: null,
                                      customFieldLookupId: null,
                                      isAggregatedCustomField: false, // Set to false for static fields
                                      jsonValue: '',
                                      aggregateFunction: null,
                                      ComparisonOperator: undefined,
                                      isAggregated: false, // Reset aggregation when field changes
                                      // Also reset aggregation-related fields
                                      accountType: null,
                                      filterBy: null,
                                      duration: null,
                                      durationType: null,
                                      lastTransactionCount: null
                                    });
                                  }

                                  setIsFieldDropdownOpen(false);
                                  setFieldSearchTerm('');
                                }}
                              >
                                <span className="text-sm">{opt.label}</span>
                              </div>
                            );
                          })}

                          {filteredFieldOptions.filter(
                            (opt) => !opt.isDivider && !opt.isEntityHeader
                          ).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              No fields found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Operator dropdown, depends on field */}
                <Select
                  value={
                    (condition.ComparisonOperator ?? condition.aggregateFunction)?.toString() ?? ''
                  }
                  onValueChange={(v) => {
                    // Determine if we're dealing with a custom field
                    const isCustom = condition.customFieldId !== null;

                    if (isCustom) {
                      // For custom fields, always use ComparisonOperator
                      onChange({
                        ...condition,
                        ComparisonOperator: v ? Number(v) : undefined,
                        aggregateFunction: null
                      });
                    } else {
                      // For static fields, use existing logic
                      if (
                        condition.aggregateFieldId === AggregateFieldId.Amount ||
                        condition.aggregateFieldId === AggregateFieldId.TransactionCount ||
                        condition.aggregateFieldId === AggregateFieldId.TransactionTime ||
                        condition.aggregateFieldId === AggregateFieldId.CurrencyAmount
                      ) {
                        onChange({
                          ...condition,
                          ComparisonOperator: v ? Number(v) : undefined,
                          aggregateFunction: null
                        });
                      } else if (
                        condition.aggregateFieldId === AggregateFieldId.TransactionStatus
                      ) {
                        onChange({
                          ...condition,
                          ComparisonOperator: v ? Number(v) : undefined,
                          aggregateFunction: null
                        });
                      } else if (condition.aggregateFieldId === AggregateFieldId.RiskStatus) {
                        onChange({
                          ...condition,
                          ComparisonOperator: v ? Number(v) : undefined,
                          aggregateFunction: null
                        });
                      } else {
                        onChange({
                          ...condition,
                          aggregateFunction: v ? Number(v) : null,
                          ComparisonOperator: undefined
                        });
                      }
                    }
                  }}
                  disabled={
                    (!condition.aggregateFieldId && !condition.customFieldId) ||
                    condition.isAggregated ||
                    readOnly
                  }
                >
                  <SelectTrigger className="w-full min-w-[160px]">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Custom field logic
                      if (condition.customFieldId !== null && condition.customFieldType !== null) {
                        if (
                          condition.customFieldType === FieldType.Dropdown ||
                          condition.customFieldType === FieldType.Radio ||
                          condition.customFieldType === FieldType.Checkbox ||
                          condition.customFieldType === FieldType.Lookup
                        ) {
                          // For list-based fields, use In/Not In operators
                          return StatusOperatorOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ));
                        } else if (condition.customFieldType === FieldType.Number) {
                          // For number fields, use comparison operators
                          return ComparisonOperatorOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ));
                        }
                        return null;
                      }

                      // Static field logic (existing)
                      if (condition.aggregateFieldId === AggregateFieldId.TransactionStatus) {
                        return StatusOperatorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ));
                      } else if (condition.aggregateFieldId === AggregateFieldId.RiskStatus) {
                        return RiskStatusOperatorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ));
                      } else if (
                        condition.aggregateFieldId === AggregateFieldId.Amount ||
                        condition.aggregateFieldId === AggregateFieldId.TransactionCount ||
                        condition.aggregateFieldId === AggregateFieldId.TransactionTime ||
                        condition.aggregateFieldId === AggregateFieldId.CurrencyAmount
                      ) {
                        return ComparisonOperatorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ));
                      }
                      return null;
                    })()}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Value</label>
            {readOnly ? (
              <div className="py-2 px-3 bg-gray-50 rounded text-gray-700">
                {condition.jsonValue}
              </div>
            ) : condition.customFieldId !== null ? (
              // Custom field value handling
              (() => {
                if (loadingCustomFieldOptions) {
                  return (
                    <div className="flex items-center justify-center h-10 text-sm text-gray-500">
                      Loading options...
                    </div>
                  );
                }

                if (
                  condition.customFieldType === FieldType.Dropdown ||
                  condition.customFieldType === FieldType.Radio ||
                  condition.customFieldType === FieldType.Checkbox
                ) {
                  // Multi-select for dropdown/radio/checkbox
                  return (
                    <MultiSelect
                      options={customFieldOptions.map((opt) => ({
                        label: opt.label,
                        value: opt.id
                      }))}
                      value={(() => {
                        try {
                          return JSON.parse(condition.jsonValue || '[]').map(String);
                        } catch {
                          return [];
                        }
                      })()}
                      onChange={(selected) => {
                        handleFieldChange('jsonValue', JSON.stringify(selected.map(Number)));
                      }}
                      placeholder="Select option(s)"
                    />
                  );
                } else if (condition.customFieldType === FieldType.Lookup) {
                  // Multi-select for lookup fields
                  return (
                    <MultiSelect
                      options={customFieldLookupValues.map((val) => ({
                        label: val.value,
                        value: val.id
                      }))}
                      value={(() => {
                        try {
                          return JSON.parse(condition.jsonValue || '[]').map(String);
                        } catch {
                          return [];
                        }
                      })()}
                      onChange={(selected) => {
                        handleFieldChange('jsonValue', JSON.stringify(selected.map(Number)));
                      }}
                      placeholder="Select lookup value(s)"
                    />
                  );
                } else if (condition.customFieldType === FieldType.Number) {
                  // Number input (hide custom values option)
                  return (
                    <Input
                      value={condition.jsonValue}
                      onChange={(e) => handleFieldChange('jsonValue', e.target.value)}
                      placeholder="Enter number"
                      className="w-full"
                      type="number"
                      step="any"
                    />
                  );
                }

                return (
                  <Input
                    value={condition.jsonValue}
                    onChange={(e) => handleFieldChange('jsonValue', e.target.value)}
                    placeholder="Value"
                    className="w-full"
                  />
                );
              })()
            ) : condition.aggregateFieldId === AggregateFieldId.TransactionStatus ? (
              <MultiSelect
                options={TransactionStatusOptions}
                value={(() => {
                  try {
                    return JSON.parse(condition.jsonValue || '[]').map(String);
                  } catch {
                    return [];
                  }
                })()}
                onChange={(selected) => {
                  handleFieldChange('jsonValue', JSON.stringify(selected.map(Number)));
                }}
                placeholder="Select status(es)"
              />
            ) : condition.aggregateFieldId === AggregateFieldId.RiskStatus ? (
              <Select
                value={condition.jsonValue || ''}
                onValueChange={(v) => handleFieldChange('jsonValue', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select risk status" />
                </SelectTrigger>
                <SelectContent>
                  {RiskStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : condition.aggregateFieldId === AggregateFieldId.TransactionTime ? (
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Input
                    value={dateValue ? format(dateValue, 'yyyy-MM-dd') : ''}
                    onClick={() => setDatePickerOpen(true)}
                    readOnly
                    placeholder="Select date"
                    className="w-full cursor-pointer"
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-auto bg-white">
                  <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={(date) => {
                      setDatePickerOpen(false);
                      handleFieldChange('jsonValue', date ? date.toISOString() : '');
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : condition.aggregateFieldId === AggregateFieldId.Amount ? (
              <div className="space-y-2">
                {/* Compact Toggle + Input */}
                <div className="flex gap-2">
                  {/* Value Type Toggle - Compact */}
                  <div className="flex bg-gray-100 rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setValueType('manual');
                        // Reset customValueId when switching to manual
                        onChange({
                          ...condition,
                          customValueId: null
                        });
                      }}
                      className={clsx(
                        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                        valueType === 'manual'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Calculator className="w-3 h-3" />
                      Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValueType('custom');
                        // Reset jsonValue when switching to custom
                        onChange({
                          ...condition,
                          jsonValue: ''
                        });
                      }}
                      className={clsx(
                        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                        valueType === 'custom'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Layers className="w-3 h-3" />
                      Custom
                    </button>
                  </div>

                  {/* Value Input - Inline */}
                  {valueType === 'manual' ? (
                    <div className="relative flex-1">
                      <Input
                        value={condition.jsonValue}
                        onChange={(e) => handleFieldChange('jsonValue', e.target.value)}
                        placeholder="0.00"
                        className="pl-6 text-right font-mono h-8 text-sm"
                        type="number"
                        step="0.01"
                      />
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                        $
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-1">
                      <Select
                        value={condition.customValueId?.toString() || ''}
                        onValueChange={(value) => {
                          // Set customValueId and clear jsonValue when custom value is selected
                          onChange({
                            ...condition,
                            customValueId: value ? Number(value) : null,
                            jsonValue: ''
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1 h-8 text-sm">
                          <SelectValue placeholder="Select custom value" />
                        </SelectTrigger>
                        <SelectContent>
                          {customValues.map((customValue) => (
                            <SelectItem key={customValue.id} value={customValue.id.toString()}>
                              {customValue.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Create Button - Icon Only */}
                      <button
                        type="button"
                        onClick={() => navigate('/custom-values/new')}
                        className="flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        title="Create New Custom Value"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Input
                value={condition.jsonValue}
                onChange={(e) => handleFieldChange('jsonValue', e.target.value)}
                placeholder="Value"
                className="w-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Filter By for Individual/Organization custom fields - Show even without aggregation */}
      {!readOnly &&
        (condition.aggregateFieldId === AggregateFieldId.RiskStatus ||
          (condition.customFieldId &&
            (customFields.individual.some((f) => f.id === condition.customFieldId) ||
              customFields.organization.some((f) => f.id === condition.customFieldId)))) && (
          <div className="p-4 border-t bg-orange-50/30 border-orange-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Apply To <span className="text-red-500">*</span>
                </label>
                <Select
                  value={condition.filterBy?.toString() || ''}
                  onValueChange={(v) => handleFieldChange('filterBy', v ? Number(v) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select sender or receiver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Sender</SelectItem>
                    <SelectItem value="2">Receiver</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Specify whether this field applies to the sender or receiver
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Use Aggregation Toggle - Hide for Individual/Organization custom fields */}
      {!readOnly &&
        condition.aggregateFieldId !== AggregateFieldId.TransactionStatus &&
        condition.aggregateFieldId !== AggregateFieldId.RiskStatus &&
        !(
          condition.customFieldId &&
          (customFields.individual.some((f) => f.id === condition.customFieldId) ||
            customFields.organization.some((f) => f.id === condition.customFieldId))
        ) && (
          <div className="p-4 border-t bg-blue-50/30 border-blue-200">
            <div className="flex items-center gap-3">
              <Switch
                checked={!!condition.isAggregated}
                onCheckedChange={(v) => handleFieldChange('isAggregated', v)}
                id="use-aggregation-main"
              />
              <label
                htmlFor="use-aggregation-main"
                className="font-semibold text-gray-800 cursor-pointer"
              >
                Use aggregation
              </label>
              <span
                className="text-gray-500 text-xs"
                title="Enable to use advanced aggregation options like Account Type, Filter By, Duration, etc."
              >
                <KeenIcon icon="info" />
              </span>
              {condition.isAggregated && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Aggregation enabled
                </span>
              )}
            </div>
          </div>
        )}

      {/* Aggregation Fields - Show when aggregation is enabled */}
      {!readOnly && condition.isAggregated && (
        <div className="border-t bg-gray-50/50 border-gray-200">
          <div className="p-4">
            {/* Aggregate Function */}
            {condition.aggregateFieldId !== AggregateFieldId.TransactionStatus &&
              condition.aggregateFieldId !== AggregateFieldId.RiskStatus && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Aggregate Function <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={condition.aggregateFunction?.toString() ?? ''}
                    onValueChange={handleAggregateFunctionChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select aggregate function" />
                    </SelectTrigger>
                    <SelectContent>
                      {AggregateFunctionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showAggError && (
                    <div className="text-xs text-red-500 mt-1">Aggregate function is required.</div>
                  )}
                </div>
              )}

            {/* Account Type and Filter By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Account Type</label>
                <Select
                  value={
                    condition.accountType !== null && condition.accountType !== undefined
                      ? condition.accountType.toString()
                      : ''
                  }
                  onValueChange={(v) => handleFieldChange('accountType', v ? Number(v) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AccountTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Filter By</label>
                <Select
                  value={
                    condition.filterBy !== null && condition.filterBy !== undefined
                      ? condition.filterBy.toString()
                      : ''
                  }
                  onValueChange={(v) => handleFieldChange('filterBy', v ? Number(v) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    {FilterByOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration & Type and Last Transaction Count */}
            <div className="flex gap-4 w-full">
              {/* Duration & Type */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Duration & Type
                </label>
                <div className="flex gap-2 w-full">
                  <Input
                    type="number"
                    value={condition.duration ?? ''}
                    onChange={(e) => {
                      const durationVal = e.target.value ? Number(e.target.value) : null;

                      if (durationVal) {
                        // If Duration is entered, reset Last Transaction Count and auto-set durationType if not set
                        onChange({
                          ...condition,
                          duration: durationVal,
                          durationType: condition.durationType || 1,
                          lastTransactionCount: null
                        });
                      } else {
                        handleFieldChange('duration', durationVal);
                      }
                    }}
                    placeholder="Duration"
                    className="flex-1"
                    min={1}
                  />
                  <Select
                    value={condition.durationType?.toString() ?? ''}
                    onValueChange={(v) => handleFieldChange('durationType', v ? Number(v) : null)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DurationTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Set both duration and type, or use transaction count below.
                </p>
              </div>
              {/* Last Transaction Count */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Last Transaction Count
                </label>
                <Input
                  type="number"
                  value={condition.lastTransactionCount ?? ''}
                  onChange={(e) => {
                    const lastTransactionCountVal = e.target.value ? Number(e.target.value) : null;

                    if (lastTransactionCountVal) {
                      // If Last Transaction Count is entered, reset Duration fields
                      onChange({
                        ...condition,
                        lastTransactionCount: lastTransactionCountVal,
                        duration: null,
                        durationType: null
                      });
                    } else {
                      handleFieldChange('lastTransactionCount', lastTransactionCountVal);
                    }
                  }}
                  placeholder="Count"
                  className="w-full"
                  min={1}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Or specify the number of last transactions to aggregate.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleCondition;
