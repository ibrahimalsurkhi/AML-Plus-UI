import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { CustomValueFilter } from '@/services/api';
import {
  AggregateFieldIdOptions,
  ComparisonOperatorOptions,
  AggregateFieldId,
  StatusOperatorOptions,
  RiskStatusOperatorOptions,
  TransactionStatusOptions,
  RiskStatusOptions
} from '@/pages/rules/enums';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { KeenIcon } from '@/components';

// MultiSelect component (from RuleCondition.tsx)
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

interface CustomValueFiltersSectionProps {
  filters: CustomValueFilter[];
  onChange: (filters: CustomValueFilter[]) => void;
}

export const CustomValueFiltersSection: React.FC<CustomValueFiltersSectionProps> = ({
  filters,
  onChange
}) => {
  const addFilter = () => {
    const newFilter: CustomValueFilter = {
      aggregateFieldId: 1, // Default to first option
      comparisonOperator: 1, // Default to Equal
      jsonValue: ''
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  const updateFilter = (index: number, field: keyof CustomValueFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    onChange(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Filter Button */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={addFilter}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Filter
        </Button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No filter conditions defined.</p>
          <p className="text-sm">Click "Add Filter" to create your first filter condition.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filters.map((filter, index) => (
            <div key={index} className="border border-gray-200 rounded-lg bg-white">
              {/* Filter Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Filter {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filter Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Field + Operator */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Field <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <Select
                        value={filter.aggregateFieldId.toString()}
                        onValueChange={(value) => {
                          const newFilters = [...filters];
                          newFilters[index] = {
                            ...newFilters[index],
                            aggregateFieldId: Number(value),
                            jsonValue: '', // reset value when field changes
                            comparisonOperator: 1 // reset operator when field changes
                          };
                          onChange(newFilters);
                        }}
                      >
                        <SelectTrigger className="w-full bg-white border-gray-200">
                          <SelectValue placeholder="Select Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {AggregateFieldIdOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Operator dropdown, depends on field */}
                      <Select
                        value={filter.comparisonOperator.toString()}
                        onValueChange={(value) =>
                          updateFilter(index, 'comparisonOperator', Number(value))
                        }
                        disabled={!filter.aggregateFieldId}
                      >
                        <SelectTrigger className="w-full min-w-[160px] bg-white border-gray-200">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.aggregateFieldId === AggregateFieldId.TransactionStatus
                            ? StatusOperatorOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))
                            : filter.aggregateFieldId === AggregateFieldId.RiskStatus
                              ? RiskStatusOperatorOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))
                              : filter.aggregateFieldId === AggregateFieldId.Amount ||
                                  filter.aggregateFieldId === AggregateFieldId.TransactionCount ||
                                  filter.aggregateFieldId === AggregateFieldId.TransactionTime ||
                                  filter.aggregateFieldId === AggregateFieldId.CurrencyAmount
                                ? ComparisonOperatorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))
                                : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Value <span className="text-red-500">*</span>
                    </label>
                    {filter.aggregateFieldId === AggregateFieldId.TransactionStatus ? (
                      <MultiSelect
                        options={TransactionStatusOptions}
                        value={(() => {
                          try {
                            return JSON.parse(filter.jsonValue || '[]').map(String);
                          } catch {
                            return [];
                          }
                        })()}
                        onChange={(selected) => {
                          updateFilter(index, 'jsonValue', JSON.stringify(selected.map(Number)));
                        }}
                        placeholder="Select status(es)"
                      />
                    ) : filter.aggregateFieldId === AggregateFieldId.RiskStatus ? (
                      <Select
                        value={filter.jsonValue || ''}
                        onValueChange={(value) => updateFilter(index, 'jsonValue', value)}
                      >
                        <SelectTrigger className="w-full bg-white border-gray-200">
                          <SelectValue placeholder="Select risk status" />
                        </SelectTrigger>
                        <SelectContent>
                          {RiskStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={filter.jsonValue}
                        onChange={(e) => updateFilter(index, 'jsonValue', e.target.value)}
                        placeholder="Enter value"
                        className="w-full bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Logic Info */}
      {filters.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Filter Logic:</strong> All filters will be applied using AND logic. The custom
            value will only match records that satisfy all specified filter conditions.
          </p>
        </div>
      )}
    </div>
  );
};
