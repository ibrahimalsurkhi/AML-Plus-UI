import { format } from 'date-fns';
import {
  AggregateFieldIdOptions,
  OperatorId,
  AggregateFunctionOptions,
  DurationTypeOptions,
  AccountTypeOptions,
  ComparisonOperatorOptions,
  StatusOperatorOptions,
  TransactionStatusOptions,
  AggregateFieldId,
  FilterByOptions,
  isCustomField,
  getCustomFieldId
} from '../pages/rules/enums';
import { customValueService, templateService, FieldType } from './api';

// Cache for custom values to avoid multiple API calls
let customValuesCache: { id: number; title: string }[] = [];
let customValuesCacheLoaded = false;

// Cache for custom fields
let customFieldsCache: {
  id: number;
  label: string;
  fieldType: number;
  lookupId?: number;
  templateId?: string;
}[] = [];
let customFieldsCacheLoaded = false;

// Cache for custom field options (dropdown/radio/checkbox)
let customFieldOptionsCache: { [fieldId: number]: { id: number; label: string }[] } = {};

// Cache for lookup values
let lookupValuesCache: { [lookupId: number]: { id: number; value: string }[] } = {};

// Function to reset caches (useful for development/testing)
export function resetRulePreviewCaches() {
  customValuesCacheLoaded = false;
  customFieldsCacheLoaded = false;
  customValuesCache = [];
  customFieldsCache = [];
  customFieldOptionsCache = {};
  lookupValuesCache = {};
  console.log('Rule preview caches reset');
}

// Auto-reset caches on load for development
resetRulePreviewCaches();

// Load custom values once
async function loadCustomValues() {
  if (!customValuesCacheLoaded) {
    try {
      console.log('Debug - Loading custom values...');
      customValuesCache = await customValueService.getCustomValueOptions();
      console.log('Debug - Loaded custom values:', customValuesCache);
      customValuesCacheLoaded = true;
    } catch (error) {
      console.error('Failed to load custom values for preview:', error);
    }
  }
}

// Load custom fields once and pre-load their options
async function loadCustomFields() {
  if (!customFieldsCacheLoaded) {
    try {
      console.log('Debug - Loading custom fields from all templates...');

      // Template IDs to load
      const TRANSACTION_TEMPLATE_ID = '15'; // Old custom fields
      const INDIVIDUAL_TEMPLATE_ID = '17';
      const ORGANIZATION_TEMPLATE_ID = '18';

      const allFields: any[] = [];

      // Load fields from all three templates
      for (const templateId of [
        TRANSACTION_TEMPLATE_ID,
        INDIVIDUAL_TEMPLATE_ID,
        ORGANIZATION_TEMPLATE_ID
      ]) {
        try {
          console.log(`Debug - Loading fields from template ${templateId}...`);
          const fieldsResponse = await templateService.getTemplateFields(templateId);

          // Get all fields from sections and fields without section
          const templateFields = [
            ...fieldsResponse.sections.flatMap((section) => section.fields),
            ...fieldsResponse.fieldsWithoutSection
          ];

          // Add template info to each field for context
          templateFields.forEach((field: any) => {
            field.templateId = templateId;
          });

          allFields.push(...templateFields);
          console.log(`Debug - Loaded ${templateFields.length} fields from template ${templateId}`);
        } catch (error) {
          console.error(`Failed to load fields from template ${templateId}:`, error);
        }
      }

      // Filter fields by allowed types and cache them
      const allowedFields = allFields.filter(
        (field) =>
          field.fieldType === FieldType.Dropdown ||
          field.fieldType === FieldType.Lookup ||
          field.fieldType === FieldType.Radio ||
          field.fieldType === FieldType.Checkbox ||
          field.fieldType === FieldType.Number
      );

      customFieldsCache = allowedFields.map((field) => ({
        id: field.id!,
        label: field.label,
        fieldType: field.fieldType,
        lookupId: field.lookupId || undefined,
        templateId: field.templateId // Store template ID for context
      }));

      // Pre-load field options for dropdown/radio/checkbox fields
      for (const field of allowedFields) {
        try {
          if (
            field.fieldType === FieldType.Dropdown ||
            field.fieldType === FieldType.Radio ||
            field.fieldType === FieldType.Checkbox
          ) {
            const options = await templateService.getFieldOptions(field.templateId, field.id!);
            customFieldOptionsCache[field.id!] = options.map((opt) => ({
              id: opt.id!,
              label: opt.label
            }));
          } else if (field.fieldType === FieldType.Lookup && field.lookupId) {
            const { lookupService } = await import('./api');
            const lookupValues = await lookupService.getLookupValues(field.lookupId, {
              pageNumber: 1,
              pageSize: 100
            });
            lookupValuesCache[field.lookupId] = lookupValues.items.map((val: any) => ({
              id: val.id,
              value: val.value
            }));
          }
        } catch (error) {
          console.error(
            `Failed to load options for field ${field.id} from template ${field.templateId}:`,
            error
          );
        }
      }

      console.log('Debug - Loaded custom fields from all templates:', customFieldsCache);
      console.log('Debug - Loaded field options cache:', customFieldOptionsCache);
      console.log('Debug - Loaded lookup values cache:', lookupValuesCache);
      customFieldsCacheLoaded = true;
    } catch (error) {
      console.error('Failed to load custom fields for preview:', error);
    }
  }
}

// Helper to get custom value title
function getCustomValueTitle(customValueId: number): string {
  console.log(
    'Debug - getCustomValueTitle called with ID:',
    customValueId,
    'type:',
    typeof customValueId
  );
  console.log('Debug - customValuesCache:', customValuesCache);
  console.log('Debug - customValuesCacheLoaded:', customValuesCacheLoaded);

  // Try both exact match and loose match in case of type mismatch
  const customValue = customValuesCache.find(
    (cv) => cv.id === customValueId || cv.id == customValueId
  );
  console.log('Debug - found customValue:', customValue);

  return customValue ? `"${customValue.title}"` : `Custom Value #${customValueId}`;
}

// Helper to get custom field name
function getCustomFieldLabel(customFieldId: number): string {
  const customField = customFieldsCache.find((cf) => cf.id === customFieldId);
  return customField ? customField.label : `Custom Field #${customFieldId}`;
}

// Helper to get custom field options labels (synchronous using cache)
function getCustomFieldValueLabels(customFieldId: number, jsonValue: string): string {
  try {
    const customField = customFieldsCache.find((cf) => cf.id === customFieldId);
    if (!customField) return jsonValue;

    const parsedValues = JSON.parse(jsonValue);
    if (!Array.isArray(parsedValues)) return jsonValue;

    if (
      customField.fieldType === FieldType.Dropdown ||
      customField.fieldType === FieldType.Radio ||
      customField.fieldType === FieldType.Checkbox
    ) {
      // Use cached field options
      const options = customFieldOptionsCache[customField.id] || [];
      const labels = parsedValues
        .map((id: number) => {
          const option = options.find((opt) => opt.id === id);
          return option ? option.label : id.toString();
        })
        .join(', ');
      return labels || jsonValue;
    } else if (customField.fieldType === FieldType.Lookup && customField.lookupId) {
      // Use cached lookup values
      const lookupValues = lookupValuesCache[customField.lookupId] || [];
      const labels = parsedValues
        .map((id: number) => {
          const value = lookupValues.find((val) => val.id === id);
          return value ? value.value : id.toString();
        })
        .join(', ');
      return labels || jsonValue;
    }

    return parsedValues.join(', ');
  } catch (error) {
    console.error('Error getting custom field value labels:', error);
    return jsonValue;
  }
}

// Helper to get label from options
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

export interface RuleGroupType {
  operator: OperatorId;
  children: Array<
    { condition: any } | { operator: OperatorId; children: RuleGroupType['children'] }
  >;
}

export async function getRulePreview(group: RuleGroupType | any): Promise<string> {
  if (!group) return '';
  if (!group.children || group.children.length === 0) return '';

  // Load custom values and fields if not already loaded
  await loadCustomValues();
  await loadCustomFields();

  const op = group.operator === OperatorId.And ? 'AND' : 'OR';
  return group.children
    .map((child: any) => {
      if ('condition' in child && child.condition) {
        const cond = child.condition;

        // Debug logging to see what data we're working with
        console.log('Condition data:', {
          aggregateFieldId: cond.aggregateFieldId,
          customFieldId: cond.customFieldId,
          selectedFieldId: cond.selectedFieldId,
          isAggregatedCustomField: cond.isAggregatedCustomField,
          ComparisonOperator: cond.ComparisonOperator,
          operator: cond.operator,
          logicalOperator: cond.logicalOperator,
          aggregateFunction: cond.aggregateFunction,
          isAggregated: cond.isAggregated,
          jsonValue: cond.jsonValue
        });

        // Determine the field name - custom field or static field
        let metric = '[Metric]';
        if (cond.customFieldId) {
          metric = getCustomFieldLabel(cond.customFieldId);
        } else if (cond.selectedFieldId && isCustomField(cond.selectedFieldId)) {
          const customFieldId = getCustomFieldId(cond.selectedFieldId);
          metric = getCustomFieldLabel(customFieldId);
        } else if (cond.aggregateFieldId) {
          metric = getLabel(AggregateFieldIdOptions, cond.aggregateFieldId) || '[Metric]';
        }

        // Check multiple possible field names for the operator
        const operatorValue =
          cond.ComparisonOperator ??
          cond.comparisonOperator ?? // <-- add this
          cond.operator ??
          cond.logicalOperator;

        // Use the operator value if available, otherwise fallback to aggregateFunction
        let operator = '[Operator]';
        if (cond.customFieldId || (cond.selectedFieldId && isCustomField(cond.selectedFieldId))) {
          // For custom fields, use ComparisonOperator
          if (operatorValue !== undefined && operatorValue !== null) {
            const customField = customFieldsCache.find(
              (cf) =>
                cf.id === cond.customFieldId ||
                cf.id ===
                  (cond.selectedFieldId && isCustomField(cond.selectedFieldId)
                    ? getCustomFieldId(cond.selectedFieldId)
                    : null)
            );

            if (customField) {
              if (
                customField.fieldType === FieldType.Dropdown ||
                customField.fieldType === FieldType.Radio ||
                customField.fieldType === FieldType.Checkbox ||
                customField.fieldType === FieldType.Lookup
              ) {
                operator = getLabel(StatusOperatorOptions, operatorValue) || '[Operator]';
              } else if (customField.fieldType === FieldType.Number) {
                operator = getLabel(ComparisonOperatorOptions, operatorValue) || '[Operator]';
              }
            }
          }
        } else {
          // For static fields, use existing logic
          operator =
            operatorValue !== undefined && operatorValue !== null
              ? getOperatorLabel(cond.aggregateFunction, cond.aggregateFieldId, operatorValue)
              : cond.aggregateFunction && !cond.isAggregated
                ? getOperatorLabel(cond.aggregateFunction, cond.aggregateFieldId)
                : '[Operator]';
        }

        console.log('Operator result:', operator);

        let aggregateFn = '';
        if (cond.isAggregated && cond.aggregateFunction) {
          aggregateFn =
            getLabel(AggregateFunctionOptions, cond.aggregateFunction) || '[Aggregate Function]';
        }

        let value = '[Value]';

        // Check if custom value is selected for Amount field
        console.log('Debug - Checking condition:', {
          aggregateFieldId: cond.aggregateFieldId,
          isAmount: cond.aggregateFieldId === AggregateFieldId.Amount,
          customValueId: cond.customValueId,
          hasCustomValueId: !!cond.customValueId,
          customFieldId: cond.customFieldId,
          selectedFieldId: cond.selectedFieldId
        });

        if (cond.aggregateFieldId === AggregateFieldId.Amount && cond.customValueId) {
          console.log('Debug - Getting custom value title for ID:', cond.customValueId);
          value = getCustomValueTitle(cond.customValueId);
          console.log('Debug - Got custom value title:', value);
        } else if (cond.customFieldId && cond.jsonValue) {
          // Handle custom field values using pre-loaded cache
          console.log(
            'Debug - Resolving custom field values for customFieldId:',
            cond.customFieldId
          );
          value = getCustomFieldValueLabels(cond.customFieldId, cond.jsonValue);
          console.log('Debug - Resolved value:', value);
        } else if (cond.selectedFieldId && isCustomField(cond.selectedFieldId) && cond.jsonValue) {
          // Handle custom field values using selectedFieldId with pre-loaded cache
          console.log(
            'Debug - Resolving custom field values for selectedFieldId:',
            cond.selectedFieldId
          );
          const customFieldId = getCustomFieldId(cond.selectedFieldId);
          value = getCustomFieldValueLabels(customFieldId, cond.jsonValue);
          console.log('Debug - Resolved value:', value);
        } else if (cond.jsonValue) {
          try {
            if (cond.aggregateFieldId === AggregateFieldId.TransactionTime) {
              const date = new Date(cond.jsonValue);
              value = isNaN(date.getTime()) ? '[Value]' : format(date, 'yyyy-MM-dd');
            } else {
              const parsed = JSON.parse(cond.jsonValue);
              if (Array.isArray(parsed)) {
                if (cond.aggregateFieldId === AggregateFieldId.TransactionStatus) {
                  const labels = parsed
                    .map((v: number) => getLabel(TransactionStatusOptions, v) || v)
                    .join(', ');
                  value = labels ? labels : '[Value]';
                } else {
                  value = parsed.length > 1 ? parsed.join(', ') : parsed.join(', ');
                }
              } else {
                value = parsed;
              }
            }
          } catch {
            value = cond.jsonValue;
          }
        }

        const duration = cond.duration ? cond.duration : '[Duration]';
        const durationType = cond.durationType
          ? getDurationTypeLabel(cond.durationType)
          : '[Duration Type]';
        const transferType = cond.accountType
          ? getAccountTypeLabel(cond.accountType)
          : '[Account Type]';

        let preview = '';
        preview += metric !== '[Metric]' ? metric : '[Metric]';
        preview +=
          operator !== '[Operator]' ? ` ${operator}` : cond.isAggregated ? '' : ' [Operator]';
        preview += aggregateFn
          ? ` ${aggregateFn}`
          : cond.isAggregated
            ? ' [Aggregate Function]'
            : '';
        preview += value !== '[Value]' ? ` ${value}` : ' [Value]';

        // Only show Filter By if aggregation is enabled
        if (cond.isAggregated && cond.filterBy) {
          const filterByLabel = getLabel(FilterByOptions, cond.filterBy);
          preview += filterByLabel ? ` by ${filterByLabel}` : '';
        }

        if (cond.duration) {
          preview += ' in last';
          preview += cond.duration ? ` ${cond.duration}` : ' [Duration]';
          preview += cond.durationType
            ? ` ${getDurationTypeLabel(cond.durationType)}`
            : ' [Duration Type]';
        } else if (cond.lastTransactionCount) {
          preview += ` in last [${cond.lastTransactionCount}] transactions`;
        }

        // Only show Account Type if aggregation is enabled
        if (cond.isAggregated) {
          if (transferType !== '[Account Type]') {
            preview += ` for ${transferType}`;
          } else {
            preview += ' for [Account Type]';
          }
        }

        return preview.trim();
      } else if ('operator' in child && 'children' in child) {
        // For nested groups, we'll need to handle this recursively
        // For now, let's return a placeholder
        return `(${child.operator === OperatorId.And ? 'AND' : 'OR'} Group)`;
      }
      return '';
    })
    .filter(Boolean)
    .join(` ${op} `);
}
