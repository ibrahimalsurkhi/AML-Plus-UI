import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ruleService, Rule } from '@/services/api';
import { Container } from '@/components/container';
import { Loader2, ArrowLeft, FileText, Hash, User } from 'lucide-react';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarActions
} from '@/partials/toolbar';
import RuleGroup from './RuleGroup';
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
  RuleTypeOptions,
  FilterByOptions,
} from './enums';
import { format } from 'date-fns';

function getLabel(options: { label: string; value: any }[], value: any) {
  const found = options.find(opt => opt.value === value);
  return found ? found.label : value;
}
function getOperatorLabel(value: any, fieldId: any, operatorProp?: any) {
  if (operatorProp) {
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
function getRulePreview(group: any): string {
  if (!group) return '';
  if (!group.children || group.children.length === 0) return '';
  const op = group.operator === OperatorId.And ? 'AND' : 'OR';
  return group.children
    .map((child: any) => {
      if ('condition' in child && child.condition) {
        const cond = child.condition;
        const metric = getLabel(AggregateFieldIdOptions, cond.aggregateFieldId) || '[Metric]';
        const operator = cond.operator
          ? getOperatorLabel(cond.aggregateFunction, cond.aggregateFieldId, cond.operator)
          : cond.aggregateFunction && !cond.isAggregated
          ? getOperatorLabel(cond.aggregateFunction, cond.aggregateFieldId)
          : '[Operator]';
        let aggregateFn = '';
        if (cond.isAggregated && cond.aggregateFunction) {
          aggregateFn = getLabel(AggregateFunctionOptions, cond.aggregateFunction) || '[Aggregate Function]';
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
                  value = labels ? `[${labels}]` : '[Value]';
                } else {
                  value = parsed.length > 1 ? `[${parsed.join(', ')}]` : parsed.join(', ');
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
        const durationType = cond.durationType ? getDurationTypeLabel(cond.durationType) : '[Duration Type]';
        const transferType = cond.accountType ? getAccountTypeLabel(cond.accountType) : '[Account Type]';
        let preview = '';
        preview += metric !== '[Metric]' ? metric : '[Metric]';
        preview += operator !== '[Operator]' ? ` ${operator}` : (cond.isAggregated ? '' : ' [Operator]');
        preview += aggregateFn ? ` ${aggregateFn}` : (cond.isAggregated ? ' [Aggregate Function]' : '');
        preview += value !== '[Value]' ? ` ${value}` : ' [Value]';
        if (cond.filterBy) {
          const filterByLabel = getLabel(FilterByOptions, cond.filterBy);
          preview += filterByLabel ? ` by ${filterByLabel}` : '';
        }
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
        return `(${getRulePreview(child as any)})`;
      }
      return '';
    })
    .filter(Boolean)
    .join(` ${op} `);
}

const RuleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rule, setRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRule = async () => {
      setLoading(true);
      try {
        if (!id) throw new Error('Invalid rule ID');
        const found = await ruleService.getRuleById(Number(id));
        setRule(found || null);
      } catch (error) {
        setRule(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRule();
  }, [id]);

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </Container>
    );
  }

  if (!rule) {
    return (
      <Container>
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">Rule Not Found</h2>
          <p className="text-muted-foreground mb-4">The rule you are looking for does not exist.</p>
          <Button onClick={() => navigate('/rules')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rules
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <div className="flex flex-col gap-1">
            <ToolbarHeading>Rule Details</ToolbarHeading>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <Hash className="w-4 h-4 text-primary" />
                <span>ID: {rule.id}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <FileText className="w-4 h-4 text-primary" />
                <span>Name: {rule.name}</span>
              </div>
            </div>
          </div>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate('/rules')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rules
            </Button>
          </ToolbarActions>
        </Toolbar>
        <Card>
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Rule Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Basic information about the rule.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  ID
                </div>
                <div className="text-base font-medium">{rule.id}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Name
                </div>
                <div className="text-base font-medium">{rule.name}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Rule Type
                </div>
                <div className="text-base font-medium">{getLabel(RuleTypeOptions, rule.ruleType)}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Active
                </div>
                <div className="text-base font-medium">{rule.isActive ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Rule Preview */}
        <div>
          <label className="block font-medium mb-2">Rule Preview</label>
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-mono text-gray-800">
            {getRulePreview(rule.root) || '[Metric] [Operator] [Value] in last [Duration] [Duration Type] for [Account Type]'}
          </div>
        </div>
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Rule Logic
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Visual representation of the rule logic.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {rule.root ? (
              <RuleGroup group={rule.root} isRoot readOnly />
            ) : (
              <div className="text-muted-foreground">No rule logic defined.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default RuleDetailPage; 