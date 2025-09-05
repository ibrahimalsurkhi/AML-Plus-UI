import React from 'react';
import { OperatorId, OperatorIdOptions, AccountType, FilterBy, AggregateFunction } from './enums';
import RuleCondition, { Condition } from './RuleCondition';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export interface RuleGroupType {
  operator: OperatorId;
  children: Array<
    { condition: Condition } | { operator: OperatorId; children: RuleGroupType['children'] }
  >;
}

interface RuleGroupProps {
  group: RuleGroupType;
  onChange?: (group: RuleGroupType) => void;
  onRemove?: () => void;
  isRoot?: boolean;
  operatorDropdownClassName?: string; // NEW: for custom dropdown style
  readOnly?: boolean;
}

const defaultCondition = (): Condition => ({
  title: '',
  isAggregated: false,
  isAggregatedCustomField: false,
  aggregateFieldId: null,
  customFieldId: null,
  aggregateFunction: AggregateFunction.Sum, // Default to Sum
  aggregationBy: null,
  filterBy: FilterBy.Sender, // Default to By Sender
  duration: null,
  durationType: null,
  lastTransactionCount: null,
  accountType: AccountType.AllAccounts, // Default to All Accounts
  jsonValue: '',
  // New properties for custom fields
  selectedFieldId: null,
  customFieldType: null,
  customFieldOptions: [],
  customFieldLookupId: null
});

const defaultGroup = (): RuleGroupType => ({
  operator: OperatorId.And,
  children: []
});

const RuleGroup: React.FC<RuleGroupProps> = ({
  group,
  onChange,
  onRemove,
  isRoot,
  operatorDropdownClassName,
  readOnly
}) => {
  const handleOperatorChange = (value: string) => {
    if (readOnly || !onChange) return;
    onChange({ ...group, operator: Number(value) });
  };

  const handleChildChange = (idx: number, updated: any) => {
    if (readOnly || !onChange) return;
    const newChildren = group.children.slice();
    // Ensure the title is always up to date for conditions
    if ('condition' in updated) {
      updated.condition = { ...updated.condition, title: `Condition ${idx + 1}` };
    }
    newChildren[idx] = updated;
    onChange({ ...group, children: newChildren });
  };

  const handleRemoveChild = (idx: number) => {
    if (readOnly || !onChange) return;
    const newChildren = group.children.slice();
    newChildren.splice(idx, 1);
    onChange({ ...group, children: newChildren });
  };

  const handleAddCondition = () => {
    if (readOnly || !onChange) return;
    const idx = group.children.length;
    onChange({
      ...group,
      children: [
        ...group.children,
        { condition: { ...defaultCondition(), title: `Condition ${idx + 1}` } }
      ]
    });
  };

  const handleAddGroup = () => {
    if (readOnly || !onChange) return;
    onChange({
      ...group,
      children: [...group.children, { operator: OperatorId.And, children: [] }]
    });
  };

  return (
    <div className="border-2 border-blue-200 rounded-lg p-4 mb-4 bg-blue-50 relative">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-semibold">Group Operator:</span>
        <Select
          value={String(group.operator)}
          onValueChange={handleOperatorChange}
          disabled={readOnly}
        >
          <SelectTrigger
            className={
              operatorDropdownClassName ||
              'h-9 px-4 w-[110px] text-sm border border-input rounded-md bg-white'
            }
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OperatorIdOptions.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={handleAddCondition} type="button">
            + Condition
          </Button>
        )}
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={handleAddGroup} type="button">
            + Group
          </Button>
        )}
        {!isRoot && onRemove && !readOnly && (
          <Button variant="ghost" size="sm" className="ml-2" onClick={onRemove} type="button">
            Remove Group
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {group.children.map((child, idx) => {
          if ('condition' in child && child.condition) {
            return (
              <RuleCondition
                key={idx}
                condition={child.condition}
                onChange={(cond) =>
                  handleChildChange(idx, { condition: { ...cond, title: `Condition ${idx + 1}` } })
                }
                onRemove={() => handleRemoveChild(idx)}
                conditionIndex={idx}
                readOnly={readOnly}
              />
            );
          } else if ('operator' in child && child.children) {
            return (
              <RuleGroup
                key={idx}
                group={child as RuleGroupType}
                onChange={(g) => handleChildChange(idx, { ...g })}
                onRemove={() => handleRemoveChild(idx)}
                readOnly={readOnly}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default RuleGroup;
