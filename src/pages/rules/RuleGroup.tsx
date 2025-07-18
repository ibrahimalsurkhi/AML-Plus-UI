import React from 'react';
import { OperatorId, OperatorIdOptions } from './enums';
import RuleCondition, { Condition } from './RuleCondition';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface RuleGroupType {
  operator: OperatorId;
  children: Array<
    | { condition: Condition }
    | { operator: OperatorId; children: RuleGroupType['children'] }
  >;
}

interface RuleGroupProps {
  group: RuleGroupType;
  onChange: (group: RuleGroupType) => void;
  onRemove?: () => void;
  isRoot?: boolean;
  operatorDropdownClassName?: string; // NEW: for custom dropdown style
}

const defaultCondition = (): Condition => ({
  title: '',
  isAggregated: false,
  isAggregatedCustomField: false,
  aggregateFieldId: null,
  customFieldId: null,
  aggregateFunction: null,
  aggregationBy: null,
  filterBy: null,
  duration: null,
  durationType: null,
  lastTransactionCount: null,
  accountType: null,
  jsonValue: '',
});

const defaultGroup = (): RuleGroupType => ({
  operator: OperatorId.And,
  children: [],
});

const RuleGroup: React.FC<RuleGroupProps> = ({
  group,
  onChange,
  onRemove,
  isRoot,
  operatorDropdownClassName,
}) => {
  const handleOperatorChange = (value: string) => {
    onChange({ ...group, operator: Number(value) });
  };

  const handleChildChange = (idx: number, updated: any) => {
    const newChildren = group.children.slice();
    newChildren[idx] = updated;
    onChange({ ...group, children: newChildren });
  };

  const handleRemoveChild = (idx: number) => {
    const newChildren = group.children.slice();
    newChildren.splice(idx, 1);
    onChange({ ...group, children: newChildren });
  };

  const handleAddCondition = () => {
    onChange({ ...group, children: [...group.children, { condition: defaultCondition() }] });
  };

  const handleAddGroup = () => {
    onChange({ ...group, children: [...group.children, { operator: OperatorId.And, children: [] }] });
  };

  return (
    <div className="border-2 border-blue-200 rounded-lg p-4 mb-4 bg-blue-50 relative">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-semibold">Group Operator:</span>
        <Select
          value={String(group.operator)}
          onValueChange={handleOperatorChange}
        >
          <SelectTrigger className={operatorDropdownClassName || 'h-9 px-4 w-[110px] text-sm border border-input rounded-md bg-white'}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OperatorIdOptions.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleAddCondition} type="button">
          + Condition
        </Button>
        <Button variant="outline" size="sm" onClick={handleAddGroup} type="button">
          + Group
        </Button>
        {(!isRoot && onRemove) && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={onRemove}
            type="button"
          >
            Remove Group
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {group.children.map((child, idx) => {
          if ('condition' in child) {
            return (
              <RuleCondition
                key={idx}
                condition={child.condition}
                onChange={cond => handleChildChange(idx, { condition: cond })}
                onRemove={() => handleRemoveChild(idx)}
              />
            );
          } else if ('operator' in child && 'children' in child) {
            return (
              <RuleGroup
                key={idx}
                group={child as RuleGroupType}
                onChange={g => handleChildChange(idx, { ...g })}
                onRemove={() => handleRemoveChild(idx)}
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