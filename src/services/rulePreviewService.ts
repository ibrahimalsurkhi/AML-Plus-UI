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
  RiskStatusOptions,
  RiskStatusOperatorOptions,
  isCustomField,
  getCustomFieldId
} from '../pages/rules/enums';
import { FieldType } from './api';
import { templateDataService } from './templateDataService';

// Load data using centralized service
async function ensureDataLoaded() {
  // The templateDataService will handle all the loading and caching
  await templateDataService.loadAllTemplateData();
}

// Helper to get custom value title
function getCustomValueTitle(customValueId: number): string {
  console.log(
    'Debug - getCustomValueTitle called with ID:',
    customValueId,
    'type:',
    typeof customValueId
  );
  
  return templateDataService.getCustomValueTitle(customValueId);
}

// Helper to get custom field name
function getCustomFieldLabel(customFieldId: number): string {
  return templateDataService.getCustomFieldLabel(customFieldId);
}

// Helper to get custom field options labels (synchronous using cache)
function getCustomFieldValueLabels(customFieldId: number, jsonValue: string): string {
  return templateDataService.getCustomFieldValueLabels(customFieldId, jsonValue);
}

// Helper to get label from options
function getLabel(options: { label: string; value: any }[], value: any) {
  const found = options.find((opt) => opt.value === value);
  return found ? found.label : value;
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

  // Ensure template data is loaded
  await ensureDataLoaded();

  const op = group.operator === OperatorId.And ? 'AND' : 'OR';
  
  // Process children with proper async handling
  const childPromises = group.children.map(async (child: any) => {
    if ('condition' in child && child.condition) {
      return buildConditionPreview(child.condition);
    } else if ('operator' in child && 'children' in child) {
      // Recursive handling of nested groups with proper async/await
      const nestedPreview = await getRulePreview(child);
      return nestedPreview ? `(${nestedPreview})` : '';
    }
    return '';
  });
  
  // Wait for all child previews to complete
  const childPreviews = await Promise.all(childPromises);
  
  return childPreviews
    .filter(Boolean)
    .join(` ${op} `);
}

function buildConditionPreview(cond: any): string {
  console.log('🔍 Building preview for condition:', {
    aggregateFieldId: cond.aggregateFieldId,
    customFieldId: cond.customFieldId,
    selectedFieldId: cond.selectedFieldId,
    isAggregated: cond.isAggregated,
    isAggregatedCustomField: cond.isAggregatedCustomField,
    ComparisonOperator: cond.ComparisonOperator,
    aggregateFunction: cond.aggregateFunction,
    customValueId: cond.customValueId,
    jsonValue: cond.jsonValue,
    duration: cond.duration,
    durationType: cond.durationType,
    filterBy: cond.filterBy,
    accountType: cond.accountType
  });

  // Step 1: Determine the field/metric
  const metric = getFieldLabel(cond);
  
  // Step 2: Determine the operator
  const operator = getOperatorLabel(cond, metric);
  
  // Step 3: Handle aggregation function (if applicable)
  const aggregateFunction = getAggregateFunctionLabel(cond);
  
  // Step 4: Determine the value
  const value = getValueLabel(cond);
  
  // Step 5: Handle time-based conditions
  const timeClause = getTimeClause(cond);
  
  // Step 6: Handle aggregation-specific clauses
  const aggregationClauses = getAggregationClauses(cond);

  // Build the preview string
  let preview = buildPreviewString({
    metric,
    operator,
    aggregateFunction,
    value,
    timeClause,
    aggregationClauses,
    isAggregated: cond.isAggregated
  });

  console.log('✅ Generated preview:', preview);
  return preview;
}

function getFieldLabel(cond: any): string {
  // Priority order: selectedFieldId > customFieldId > aggregateFieldId
  
  if (cond.selectedFieldId && isCustomField(cond.selectedFieldId)) {
    // Custom field via selectedFieldId (new approach)
    const customFieldId = getCustomFieldId(cond.selectedFieldId);
    return getCustomFieldLabel(customFieldId) || '[Custom Field]';
  }
  
  if (cond.customFieldId) {
    // Custom field via customFieldId (legacy approach)
    return getCustomFieldLabel(cond.customFieldId) || '[Custom Field]';
  }
  
  if (cond.aggregateFieldId) {
    // Static/system field
    return getLabel(AggregateFieldIdOptions, cond.aggregateFieldId) || '[Field]';
  }
  
  return '[Field]';
}

function getOperatorLabel(cond: any, fieldLabel: string): string {
  // Get the operator value from various possible properties
  const operatorValue = cond.ComparisonOperator ?? 
                       cond.comparisonOperator ?? 
                       cond.operator ?? 
                       cond.logicalOperator;

  console.log('🔧 Operator detection:', {
    operatorValue,
    ComparisonOperator: cond.ComparisonOperator,
    comparisonOperator: cond.comparisonOperator,
    operator: cond.operator,
    logicalOperator: cond.logicalOperator,
    aggregateFunction: cond.aggregateFunction,
    isAggregated: cond.isAggregated
  });

  // Handle custom fields
  if (cond.selectedFieldId && isCustomField(cond.selectedFieldId)) {
    const customFieldId = getCustomFieldId(cond.selectedFieldId);
    const customField = templateDataService.getCustomField(customFieldId);
    
    if (customField && operatorValue !== undefined && operatorValue !== null) {
      return getOperatorForFieldType(customField.fieldType, operatorValue);
    }
  }
  
  if (cond.customFieldId) {
    const customField = templateDataService.getCustomField(cond.customFieldId);
    
    if (customField && operatorValue !== undefined && operatorValue !== null) {
      return getOperatorForFieldType(customField.fieldType, operatorValue);
    }
  }

  // Handle static/system fields
  if (cond.aggregateFieldId && operatorValue !== undefined && operatorValue !== null) {
    return getOperatorForAggregateField(cond.aggregateFieldId, operatorValue);
  }

  // Fallback to aggregateFunction if no explicit operator
  if (cond.aggregateFunction && !cond.isAggregated) {
    return getOperatorForAggregateField(cond.aggregateFieldId, cond.aggregateFunction);
  }

  return '[Operator]';
}

function getOperatorForFieldType(fieldType: number, operatorValue: number): string {
  switch (fieldType) {
    case FieldType.Dropdown:
    case FieldType.Radio:
    case FieldType.Checkbox:
    case FieldType.Lookup:
      // For selection-based fields, use status operators (In/Not In)
      return getLabel(StatusOperatorOptions, operatorValue) || '[Operator]';
    
    case FieldType.Number:
    case FieldType.Date:
      // For numeric/comparable fields, use comparison operators
      return getLabel(ComparisonOperatorOptions, operatorValue) || '[Operator]';
    
    case FieldType.Text:
    case FieldType.TextArea:
      // For text fields, use comparison operators (Contains, Equal, etc.)
      return getLabel(ComparisonOperatorOptions, operatorValue) || '[Operator]';
    
    default:
      return getLabel(ComparisonOperatorOptions, operatorValue) || '[Operator]';
  }
}

function getOperatorForAggregateField(aggregateFieldId: number, operatorValue: number): string {
  switch (aggregateFieldId) {
    case AggregateFieldId.TransactionStatus:
      // Transaction status uses In/Not In operators
      return getLabel(StatusOperatorOptions, operatorValue) || '[Operator]';
    
    case AggregateFieldId.RiskStatus:
      // Risk status uses special operators (AtLeastOne/All)
      return getLabel(RiskStatusOperatorOptions, operatorValue) || '[Operator]';
    
    case AggregateFieldId.Amount:
    case AggregateFieldId.TransactionCount:
    case AggregateFieldId.TransactionTime:
    case AggregateFieldId.CurrencyAmount:
      // Numeric/comparable fields use comparison operators
      return getLabel(ComparisonOperatorOptions, operatorValue) || '[Operator]';
    
    default:
      // Fallback to comparison operators
      return getLabel(ComparisonOperatorOptions, operatorValue) || '[Operator]';
  }
}

function getAggregateFunctionLabel(cond: any): string {
  if (cond.isAggregated && cond.aggregateFunction) {
    return getLabel(AggregateFunctionOptions, cond.aggregateFunction) || '[Aggregate Function]';
  }
  return '';
}

function getValueLabel(cond: any): string {
  console.log('💰 Value detection:', {
    customValueId: cond.customValueId,
    jsonValue: cond.jsonValue,
    aggregateFieldId: cond.aggregateFieldId,
    customFieldId: cond.customFieldId,
    selectedFieldId: cond.selectedFieldId
  });

  // Priority 1: Custom value (for Amount field)
  if (cond.aggregateFieldId === AggregateFieldId.Amount && cond.customValueId) {
    return getCustomValueTitle(cond.customValueId);
  }

  // Priority 2: Custom field values (via selectedFieldId)
  if (cond.selectedFieldId && isCustomField(cond.selectedFieldId) && cond.jsonValue) {
    const customFieldId = getCustomFieldId(cond.selectedFieldId);
    return getCustomFieldValueLabels(customFieldId, cond.jsonValue);
  }

  // Priority 3: Custom field values (via customFieldId)
  if (cond.customFieldId && cond.jsonValue) {
    return getCustomFieldValueLabels(cond.customFieldId, cond.jsonValue);
  }

  // Priority 4: JSON value parsing for system fields
  if (cond.jsonValue) {
    return parseJsonValue(cond.jsonValue, cond.aggregateFieldId);
  }

  return '[Value]';
}

function parseJsonValue(jsonValue: string, aggregateFieldId?: number): string {
  console.log('🔍 Parsing JSON value:', { jsonValue, aggregateFieldId });
  
  try {
    // Handle date fields
    if (aggregateFieldId === AggregateFieldId.TransactionTime) {
      const date = new Date(jsonValue);
      return isNaN(date.getTime()) ? jsonValue : format(date, 'yyyy-MM-dd');
    }

    // Try to parse as JSON first
    let parsed: any;
    try {
      parsed = JSON.parse(jsonValue);
    } catch {
      // If JSON parsing fails, try to handle space-separated values
      if (jsonValue.includes(' ')) {
        const values = jsonValue.split(' ').map(v => {
          const num = parseInt(v.trim());
          return isNaN(num) ? v.trim() : num;
        });
        parsed = values;
      } else {
        // Try to parse as a single number
        const num = parseInt(jsonValue);
        parsed = isNaN(num) ? jsonValue : num;
      }
    }
    
    console.log('📊 Parsed value:', parsed);
    
    if (Array.isArray(parsed)) {
      // Handle array values with proper formatting
      if (aggregateFieldId === AggregateFieldId.TransactionStatus) {
        const labels = parsed
          .map((v: number) => getLabel(TransactionStatusOptions, v) || v);
        return labels.length > 1 ? `[${labels.join(', ')}]` : labels[0] || jsonValue;
      }
      
      if (aggregateFieldId === AggregateFieldId.RiskStatus) {
        const labels = parsed
          .map((v: number) => getLabel(RiskStatusOptions, v) || v);
        return labels.length > 1 ? `[${labels.join(', ')}]` : labels[0] || jsonValue;
      }
      
      // For other array values, format as multiple selection
      return parsed.length > 1 ? `[${parsed.join(', ')}]` : String(parsed[0] || jsonValue);
    }
    
    // Handle single values
    if (aggregateFieldId === AggregateFieldId.RiskStatus && typeof parsed === 'number') {
      return getLabel(RiskStatusOptions, parsed) || String(parsed);
    }
    
    if (aggregateFieldId === AggregateFieldId.TransactionStatus && typeof parsed === 'number') {
      return getLabel(TransactionStatusOptions, parsed) || String(parsed);
    }
    
    return String(parsed);
  } catch (error) {
    console.error('❌ Error parsing JSON value:', error);
    // If all parsing fails, return the raw value
    return jsonValue;
  }
}

function getTimeClause(cond: any): string {
  if (cond.duration && cond.durationType) {
    const durationLabel = getDurationTypeLabel(cond.durationType);
    return `in last ${cond.duration} ${durationLabel}`;
  }
  
  if (cond.lastTransactionCount) {
    return `in last ${cond.lastTransactionCount} transactions`;
  }
  
  return '';
}

function getAggregationClauses(cond: any): { filterBy: string; accountType: string } {
  let filterBy = '';
  let accountType = '';
  
  // Apply To (filterBy) should appear for all conditions, not just aggregated ones
  if (cond.filterBy) {
    const filterByLabel = getLabel(FilterByOptions, cond.filterBy);
    filterBy = filterByLabel ? `by ${filterByLabel}` : '';
  }
  
  // Account type only for aggregated conditions
  if (cond.isAggregated) {
    if (cond.accountType) {
      const accountTypeLabel = getLabel(AccountTypeOptions, cond.accountType);
      accountType = accountTypeLabel ? `for ${accountTypeLabel}` : 'for [Account Type]';
    } else {
      accountType = 'for [Account Type]';
    }
  }
  
  return { filterBy, accountType };
}

function buildPreviewString(parts: {
  metric: string;
  operator: string;
  aggregateFunction: string;
  value: string;
  timeClause: string;
  aggregationClauses: { filterBy: string; accountType: string };
  isAggregated: boolean;
}): string {
  const { metric, operator, aggregateFunction, value, timeClause, aggregationClauses, isAggregated } = parts;
  
  let preview = '';
  
  // Base structure: [Field] [Operator] [AggregateFunction] [Value]
  preview += metric;
  
  if (operator !== '[Operator]') {
    preview += ` ${operator}`;
  } else if (!isAggregated) {
    preview += ' [Operator]';
  }
  
  if (aggregateFunction) {
    preview += ` ${aggregateFunction}`;
  } else if (isAggregated) {
    preview += ' [Aggregate Function]';
  }
  
  preview += ` ${value}`;
  
  // Add Apply To (filterBy) for all conditions
  if (aggregationClauses.filterBy) {
    preview += ` ${aggregationClauses.filterBy}`;
  }
  
  // Add time clause
  if (timeClause) {
    preview += ` ${timeClause}`;
  }
  
  // Add account type for aggregated conditions only
  if (isAggregated && aggregationClauses.accountType) {
    preview += ` ${aggregationClauses.accountType}`;
  }
  
  return preview.trim();
}
