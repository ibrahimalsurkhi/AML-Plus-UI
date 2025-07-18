import React, { useState } from 'react';
import {
  AggregateFieldIdOptions,
  AggregateFunctionOptions,
  AggregationByOptions,
  FilterByOptions,
  DurationTypeOptions,
  AccountTypeOptions,
  AggregateFieldId,
  TransactionStatusOptions,
  ComparisonOperatorOptions,
  StatusOperatorOptions, // <-- import
} from './enums';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Trash2 } from 'lucide-react';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { KeenIcon } from '@/components';

export interface Condition {
  title: string;
  isAggregated: boolean;
  isAggregatedCustomField: boolean;
  aggregateFieldId: number | null;
  customFieldId: number | null;
  aggregateFunction: string | null; // now string for comparison operators
  aggregationBy: number | null;
  filterBy: number | null;
  duration: number | null;
  durationType: number | null;
  lastTransactionCount: number | null;
  accountType: number | null;
  jsonValue: string;
}

interface RuleConditionProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}

// Inline MultiSelect component (from SanctionSearchPage)
type MultiSelectOption = { label: string; value: string | number };
interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}
const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder = 'Select options...' }) => {
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
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
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
              <div className="px-3 pb-2 text-[13px] text-gray-600">
                Select status(es)
              </div>
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
                    <div className={clsx(
                      'relative flex items-center justify-center',
                      'w-[18px] h-[18px] rounded transition-colors',
                      value.includes(option.value.toString())
                        ? 'bg-primary border-primary'
                        : 'border-2 border-gray-300 hover:border-primary'
                    )}>
                      {value.includes(option.value.toString()) && (
                        <span className="ki-duotone ki-check absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] leading-none text-white before:content-['\\ea1e'] before:font-ki" />
                      )}
                    </div>
                    <span className={clsx(
                      'flex-1 text-[13px]',
                      value.includes(option.value.toString()) ? 'text-primary' : 'text-gray-700'
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

const RuleCondition: React.FC<RuleConditionProps> = ({ condition, onChange, onRemove }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFieldChange = (field: keyof Condition, value: any) => {
    onChange({ ...condition, [field]: value });
  };

  return (
    <div className="border rounded-xl shadow bg-white mb-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-t-xl border-b">
        <span className="font-semibold text-gray-700">Condition 1</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-200"
            onClick={() => setShowAdvanced(v => !v)}
            aria-label="Show advanced settings"
            type="button"
          >
            <Settings className={showAdvanced ? 'text-blue-600' : 'text-gray-500'} size={20} />
          </Button>
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
      </div>
      {/* Main Fields */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Field</label>
          <div className="flex gap-2">
            <Select
              value={condition.aggregateFieldId?.toString() || ''}
              onValueChange={v => {
                onChange({
                  ...condition,
                  aggregateFieldId: v ? Number(v) : null,
                  jsonValue: '',
                  aggregateFunction: null, // reset operator when field changes
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Field" />
              </SelectTrigger>
              <SelectContent>
                {AggregateFieldIdOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Operator dropdown, depends on field */}
            <Select
              value={condition.aggregateFunction ?? ''}
              onValueChange={v => onChange({ ...condition, aggregateFunction: v || null })}
              disabled={!condition.aggregateFieldId}
            >
              <SelectTrigger className="w-full min-w-[160px]">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                {condition.aggregateFieldId === AggregateFieldId.TransactionStatus
                  ? StatusOperatorOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))
                  : (condition.aggregateFieldId === AggregateFieldId.Amount ||
                     condition.aggregateFieldId === AggregateFieldId.TransactionCount ||
                     condition.aggregateFieldId === AggregateFieldId.TransactionTime ||
                     condition.aggregateFieldId === AggregateFieldId.CurrencyAmount
                    )
                    ? ComparisonOperatorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))
                    : null
                }
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Value</label>
          {condition.aggregateFieldId === AggregateFieldId.TransactionStatus ? (
            <MultiSelect
              options={TransactionStatusOptions}
              value={(() => {
                try {
                  return JSON.parse(condition.jsonValue || '[]').map(String);
                } catch {
                  return [];
                }
              })()}
              onChange={selected => {
                handleFieldChange('jsonValue', JSON.stringify(selected.map(Number)));
              }}
              placeholder="Select status(es)"
            />
          ) : (
            <Input
              value={condition.jsonValue}
              onChange={e => handleFieldChange('jsonValue', e.target.value)}
              placeholder="Value"
              className="w-full"
            />
          )}
        </div>
      </div>
      {/* Advanced Fields (collapsible) */}
      <div
        className={`transition-all duration-300 overflow-hidden ${showAdvanced ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} bg-gray-50 border-t rounded-b-xl`}
      >
        <div className="p-0">
          <div className="border rounded-lg bg-gray-50 p-6 mt-4">
            <div className="flex items-center mb-6 gap-2">
              <Switch
                checked={!!condition.isAggregated}
                onCheckedChange={v => handleFieldChange('isAggregated', v)}
                id="use-aggregation"
              />
              <label htmlFor="use-aggregation" className="font-semibold text-gray-800">
                Use aggregation
              </label>
              <span className="text-gray-400 text-xs ml-2" title="Enable to use advanced aggregation options.">
                <KeenIcon icon="info" />
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Account Type</label>
                <Select
                  value={condition.accountType !== null && condition.accountType !== undefined ? condition.accountType.toString() : ''}
                  onValueChange={v => handleFieldChange('accountType', v ? Number(v) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AccountTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Filter By</label>
                <Select
                  value={condition.filterBy !== null && condition.filterBy !== undefined ? condition.filterBy.toString() : ''}
                  onValueChange={v => handleFieldChange('filterBy', v ? Number(v) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    {FilterByOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Only show Duration & Type and Last Transaction Count if Use aggregation is enabled */}
              {condition.isAggregated && (
                <div className="md:col-span-2 flex gap-6">
                  {/* Duration & Type */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Duration & Type</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={condition.duration ?? ''}
                        onChange={e => {
                          const durationVal = e.target.value ? Number(e.target.value) : null;
                          if (durationVal && !condition.durationType) handleFieldChange('durationType', 1);
                          if (!durationVal) handleFieldChange('durationType', null);
                          handleFieldChange('duration', durationVal);
                        }}
                        placeholder="Duration"
                        className="w-24"
                        min={1}
                        disabled={!!condition.lastTransactionCount}
                      />
                      <Select
                        value={condition.durationType !== null && condition.durationType !== undefined ? condition.durationType.toString() : ''}
                        onValueChange={v => handleFieldChange('durationType', v ? Number(v) : null)}
                        disabled={!!condition.lastTransactionCount}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DurationTypeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Set both duration and type, or use transaction count below.</p>
                  </div>
                  {/* Last Transaction Count */}
                  {!condition.duration && (
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Last Transaction Count</label>
                      <Input
                        type="number"
                        value={condition.lastTransactionCount ?? ''}
                        onChange={e => handleFieldChange('lastTransactionCount', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Count"
                        className="w-full"
                        min={1}
                      />
                      <p className="text-xs text-gray-400 mt-1">Or specify the number of last transactions to aggregate.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleCondition; 