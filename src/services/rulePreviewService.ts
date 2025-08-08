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
  FilterByOptions
} from '../pages/rules/enums';

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

export function getRulePreview(group: RuleGroupType | any): string {
  if (!group) return '';
  if (!group.children || group.children.length === 0) return '';
  const op = group.operator === OperatorId.And ? 'AND' : 'OR';
  return group.children
    .map((child: any) => {
      if ('condition' in child && child.condition) {
        const cond = child.condition;

        // Debug logging to see what data we're working with
        console.log('Condition data:', {
          aggregateFieldId: cond.aggregateFieldId,
          ComparisonOperator: cond.ComparisonOperator,
          operator: cond.operator,
          logicalOperator: cond.logicalOperator,
          aggregateFunction: cond.aggregateFunction,
          isAggregated: cond.isAggregated,
          jsonValue: cond.jsonValue
        });

        const metric = getLabel(AggregateFieldIdOptions, cond.aggregateFieldId) || '[Metric]';

        // Check multiple possible field names for the operator
        const operatorValue =
          cond.ComparisonOperator ??
          cond.comparisonOperator ?? // <-- add this
          cond.operator ??
          cond.logicalOperator;

        // Use the operator value if available, otherwise fallback to aggregateFunction
        const operator =
          operatorValue !== undefined && operatorValue !== null
            ? getOperatorLabel(cond.aggregateFunction, cond.aggregateFieldId, operatorValue)
            : cond.aggregateFunction && !cond.isAggregated
              ? getOperatorLabel(cond.aggregateFunction, cond.aggregateFieldId)
              : '[Operator]';

        console.log('Operator result:', operator);

        let aggregateFn = '';
        if (cond.isAggregated && cond.aggregateFunction) {
          aggregateFn =
            getLabel(AggregateFunctionOptions, cond.aggregateFunction) || '[Aggregate Function]';
        }

        let value = '[Value]';
        if (cond.jsonValue) {
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

        if (cond.filterBy) {
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

        if (transferType !== '[Account Type]') {
          preview += ` for ${transferType}`;
        } else {
          preview += ' for [Account Type]';
        }

        return preview.trim();
      } else if ('operator' in child && 'children' in child) {
        return `(${getRulePreview(child as RuleGroupType)})`;
      }
      return '';
    })
    .filter(Boolean)
    .join(` ${op} `);
}
