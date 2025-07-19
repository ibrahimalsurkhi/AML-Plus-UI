import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import RuleGroup, { RuleGroupType } from './RuleGroup';
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
  RuleTypeOptions, // <-- import
  FilterByOptions,
} from './enums';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarActions,
} from '@/partials/toolbar';
import { ruleService } from '@/services/api';

const defaultRootGroup: RuleGroupType = {
  operator: OperatorId.And,
  children: [],
};

const initialRule = {
  name: '',
  ruleType: 'simple', // Now a string: 'simple' or 'advanced'
  root: defaultRootGroup,
};

// Helper to get label from options
function getLabel(options: { label: string; value: any }[], value: any) {
  const found = options.find(opt => opt.value === value);
  return found ? found.label : '';
}

function getOperatorLabel(value: any, fieldId: any) {
  // Use status operator label for Transaction Status
  if (fieldId === AggregateFieldId.TransactionStatus) {
    return getLabel(StatusOperatorOptions, value) || '[Operator]';
  }
  // Use comparison operator label for numeric/comparable fields
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

// Helper to generate rule preview text dynamically
function getRulePreview(group: RuleGroupType): string {
  if (!group) return '';
  if (group.children.length === 0) return '';
  const op = group.operator === OperatorId.And ? 'AND' : 'OR';
  return group.children
    .map((child: any) => {
      if ('condition' in child) {
        const cond = child.condition;
        // Step-by-step preview building
        const metric = getLabel(AggregateFieldIdOptions, cond.aggregateFieldId) || '[Metric]';
        const operator = cond.aggregateFunction ? getOperatorLabel(cond.aggregateFunction, cond.aggregateFieldId) : '[Operator]';
        let value = '[Value]';
        if (cond.jsonValue) {
          try {
            const parsed = JSON.parse(cond.jsonValue);
            if (Array.isArray(parsed)) {
              // For Transaction Status, show all selected labels in brackets
              if (cond.aggregateFieldId === AggregateFieldId.TransactionStatus) {
                const labels = parsed
                  .map((v: number) => getLabel(TransactionStatusOptions, v) || v)
                  .join(', ');
                value = labels ? `[${labels}]` : '[Value]';
              } else {
                value = parsed.length > 1 ? `[${parsed.join(', ')}]` : parsed.join(', ');
              }
            } else {
              value = parsed;
            }
          } catch {
            value = cond.jsonValue;
          }
        }
        const duration = cond.duration ? cond.duration : '[Duration]';
        const durationType = cond.durationType ? getDurationTypeLabel(cond.durationType) : '[Duration Type]';
        const transferType = cond.accountType ? getAccountTypeLabel(cond.accountType) : '[Account Type]';
        // Build a natural language preview
        let preview = '';
        preview += metric !== '[Metric]' ? metric : '[Metric]';
        preview += operator !== '[Operator]' ? ` ${operator}` : ' [Operator]';
        preview += value !== '[Value]' ? ` ${value}` : ' [Value]';
        if (cond.filterBy) {
          const filterByLabel = getLabel(FilterByOptions, cond.filterBy);
          preview += filterByLabel ? ` by ${filterByLabel}` : '';
        }
        // Show duration/durationType or lastTransactionCount
        if (cond.duration) {
          preview += ' in last';
          preview += cond.duration ? ` ${cond.duration}` : ' [Duration]';
          preview += cond.durationType ? ` ${getDurationTypeLabel(cond.durationType)}` : ' [Duration Type]';
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

const RuleBuilderPage = () => {
  const [rule, setRule] = useState(initialRule);

  const handleResetRule = () => {
    setRule(initialRule);
  };

  const handleRootGroupChange = (group: RuleGroupType) => {
    setRule(prev => ({ ...prev, root: group }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRule(prev => ({ ...prev, name: e.target.value }));
  };

  const handleRuleTypeChange = (value: string) => {
    setRule(prev => ({ ...prev, ruleType: value }));
  };

  // TODO: Implement save handler to POST rule to backend
  const [saving, setSaving] = useState(false);
  const handleSaveRule = async () => {
    setSaving(true);
    try {
      await ruleService.createRule(rule);
      // Optionally show a toast or reset the form here
    } catch (err) {
      console.error('Failed to save rule:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-primary">Rule Builder</span>
              <span className="text-base text-muted-foreground">Create complex conditional logic with visual grouping and operators</span>
            </div>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline">Export</Button>
            <Button variant="outline">Save</Button>
            <Button variant="default" className="bg-primary text-white">Execute</Button>
          </ToolbarActions>
        </Toolbar>

        {/* Rule Preview */}
        <div>
          <label className="block font-medium mb-2">Rule Preview</label>
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-mono text-gray-800">
            {getRulePreview(rule.root) || '[Metric] [Operator] [Value] in last [Duration] [Duration Type] for [Account Type]'}
          </div>
        </div>

        <Card className="shadow-md border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b rounded-t-lg">
            <div className="flex gap-8 mb-6">
              <div className="flex-1 flex flex-col">
                <label className="block font-semibold mb-2 text-gray-700">Rule Name</label>
                <Input
                  value={rule.name}
                  onChange={handleNameChange}
                  placeholder="Enter rule name"
                  className="h-11 px-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block font-semibold mb-2 text-gray-700">Rule Type</label>
                <Select value={rule.ruleType} onValueChange={handleRuleTypeChange}>
                  <SelectTrigger className="h-11 px-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RuleTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white rounded-b-lg">
            {/* Rule builder UI */}
            <div className="mb-10">
              <RuleGroup
                group={rule.root}
                onChange={handleRootGroupChange}
                isRoot
                operatorDropdownClassName="w-28 h-9 text-sm px-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleResetRule}>Reset Rule</Button>
              <Button variant="outline">Cancel</Button>
              <Button variant="default" className="bg-primary text-white" onClick={handleSaveRule} disabled={!rule.name || saving}>
                {saving ? 'Saving...' : 'Save Rule'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default RuleBuilderPage; 