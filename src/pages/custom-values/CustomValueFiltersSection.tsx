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
  ComparisonOperatorOptions
} from '@/pages/rules/enums';

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
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
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
                  <h4 className="text-sm font-medium text-gray-700">
                    Filter {index + 1}
                  </h4>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Field */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Field <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={filter.aggregateFieldId.toString()}
                      onValueChange={(value) =>
                        updateFilter(index, 'aggregateFieldId', Number(value))
                      }
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200">
                        <SelectValue placeholder="Transaction Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {AggregateFieldIdOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Operator <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={filter.comparisonOperator.toString()}
                      onValueChange={(value) =>
                        updateFilter(index, 'comparisonOperator', Number(value))
                      }
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200">
                        <SelectValue placeholder="Equal to" />
                      </SelectTrigger>
                      <SelectContent>
                        {ComparisonOperatorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Value <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={filter.jsonValue}
                      onChange={(e) => updateFilter(index, 'jsonValue', e.target.value)}
                      placeholder="Enter value or JSON"
                      className="w-full bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Helper text */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    For complex values, use JSON format: {"{"}"key": "value"{"}"}.
                    For simple values, enter directly.
                  </p>
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
            <strong>Filter Logic:</strong> All filters will be applied using AND logic. 
            The custom value will only match records that satisfy all specified filter conditions.
          </p>
        </div>
      )}
    </div>
  );
};
