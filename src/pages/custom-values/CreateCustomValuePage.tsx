import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { customValueService, CustomValueFilter, CreateCustomValueRequest } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { CustomValueFiltersSection } from './CustomValueFiltersSection';
import {
  AggregateFieldIdOptions,
  AggregateFunctionOptions,
  AggregationByOptions,
  FilterByOptions,
  DurationTypeOptions,
  AccountTypeOptions,
  ComparisonOperatorOptions,
  AggregateCustomValueFieldIdOptions
} from '@/pages/rules/enums';
import { Settings, Database, Filter, Clock, FilterIcon } from 'lucide-react';

const initialCustomValue: CreateCustomValueRequest = {
  title: '',
  isAggregated: true,
  isAggregatedCustomField: false,
  aggregateFieldId: null,
  customFieldId: null,
  aggregateFunction: null,
  aggregationBy: null,
  filterBy: null,
  comparisonOperator: null,
  duration: null,
  durationType: null,
  lastTransactionCount: null,
  accountType: null,
  filters: []
};

const CreateCustomValuePage = () => {
  const [customValue, setCustomValue] = useState<CreateCustomValueRequest>(initialCustomValue);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleFieldChange = (field: keyof CreateCustomValueRequest, value: any) => {
    setCustomValue((prev) => ({ ...prev, [field]: value }));
  };

  const handleFiltersChange = (filters: CustomValueFilter[]) => {
    setCustomValue((prev) => ({ ...prev, filters }));
  };

  const handleSaveCustomValue = async () => {
    setSaving(true);
    try {
      await customValueService.createCustomValue(customValue);
      navigate('/custom-values'); // Redirect to custom values list page
    } catch (err) {
      console.error('Failed to save custom value:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetCustomValue = () => {
    setCustomValue(initialCustomValue);
  };

  return (
    <Container>
      <div className="space-y-8">
        {/* Toolbar */}
        <Toolbar>
          <ToolbarHeading>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-primary">Create Custom Value</span>
              <span className="text-base text-muted-foreground">
                Define custom aggregated values with multiple filter conditions
              </span>
            </div>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={() => navigate('/custom-values')}>
              Back to List
            </Button>
            <Button
              variant="default"
              className="bg-primary text-white"
              onClick={handleSaveCustomValue}
              disabled={!customValue.title || saving}
            >
              {saving ? 'Saving...' : 'Save Custom Value'}
            </Button>
          </ToolbarActions>
        </Toolbar>

        {/* Query Configuration Section */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <Settings className="text-blue-600 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Query Configuration</h2>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={customValue.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Enter custom value title"
                  className="w-full bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aggregation Settings Section */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-purple-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <Database className="text-purple-600 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Aggregation Settings</h2>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Is Aggregated Toggle */}
              {/*<div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border">
                <Switch
                  checked={customValue.isAggregated}
                  onCheckedChange={(checked) => handleFieldChange('isAggregated', checked)}
                  id="is-aggregated"
                />
                <label htmlFor="is-aggregated" className="text-sm font-medium text-gray-700">
                  Is Aggregated
                </label>
                <span className="text-xs text-gray-500 ml-2">
                  Enable data aggregation
                </span>
              </div>

              {/* Use Custom Field Toggle */}
              {/*<div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border">
                <Switch
                  checked={customValue.isAggregatedCustomField}
                  onCheckedChange={(checked) => handleFieldChange('isAggregatedCustomField', checked)}
                  id="use-custom-field"
                />
                <label htmlFor="use-custom-field" className="text-sm font-medium text-gray-700">
                  Use Custom Field
                </label>
                <span className="text-xs text-gray-500 ml-2">
                  Apply custom field logic
                </span>
              </div>*/}

              {/* Field */}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Field
                </label>
                <Select
                  value={customValue.aggregateFieldId?.toString() || ''}
                  onValueChange={(value) => handleFieldChange('aggregateFieldId', Number(value))}
                >
                  <SelectTrigger className="w-full bg-white border-gray-200">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {AggregateCustomValueFieldIdOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              {/* Grid for other aggregation settings */}
              {customValue.isAggregated && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Aggregate Function */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Aggregate Function
                    </label>
                    <Select
                      value={customValue.aggregateFunction?.toString() || ''}
                      onValueChange={(value) => handleFieldChange('aggregateFunction', Number(value))}
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200">
                        <SelectValue placeholder="Select function" />
                      </SelectTrigger>
                      <SelectContent>
                        {AggregateFunctionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aggregation By */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Aggregation By
                    </label>
                    <Select
                      value={customValue.aggregationBy?.toString() || ''}
                      onValueChange={(value) => handleFieldChange('aggregationBy', Number(value))}
                    >
                      <SelectTrigger className="w-full bg-white border-gray-200">
                        <SelectValue placeholder="Select aggregation" />
                      </SelectTrigger>
                      <SelectContent>
                        {AggregationByOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Account Type
                  </label>
                  <Select
                    value={customValue.accountType?.toString() || ''}
                    onValueChange={(value) => handleFieldChange('accountType', Number(value))}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-200">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AccountTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Filter & Comparison Settings Section */}

        {/* Time Range Settings Section */}
        {customValue.isAggregated && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-blue-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-600 w-5 h-5" />
                <h2 className="text-lg font-semibold text-gray-900">Time Range Settings</h2>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-6 w-full">
                {/* Duration & Type */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Duration & Type
                  </label>
                  <div className="flex gap-3 w-full">
                    <Input
                      type="number"
                      value={customValue.duration ?? ''}
                      onChange={(e) => {
                        const durationVal = e.target.value ? Number(e.target.value) : null;
                        
                        if (durationVal) {
                          // If Duration is entered, reset Last Transaction Count and auto-set durationType if not set
                          setCustomValue(prev => ({
                            ...prev,
                            duration: durationVal,
                            durationType: prev.durationType || 1,
                            lastTransactionCount: null
                          }));
                        } else {
                          // If Duration is cleared, also clear durationType
                          setCustomValue(prev => ({
                            ...prev,
                            duration: null,
                            durationType: null
                          }));
                        }
                      }}
                      placeholder="Duration"
                      className="w-1/2 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      min={1}
                      disabled={!!customValue.lastTransactionCount}
                    />
                    <Select
                      value={
                        customValue.durationType !== null && customValue.durationType !== undefined
                          ? customValue.durationType.toString()
                          : ''
                      }
                      onValueChange={(value) =>
                        handleFieldChange('durationType', value ? Number(value) : null)
                      }
                      disabled={!!customValue.lastTransactionCount}
                    >
                      <SelectTrigger className="w-1/2 bg-white border-gray-200">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DurationTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Set both duration and type, or use transaction count below.
                  </p>
                </div>

                {/* Last Transaction Count */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Last Transaction Count
                  </label>
                  <Input
                    type="number"
                    value={customValue.lastTransactionCount ?? ''}
                    onChange={(e) => {
                      const lastTransactionCountVal = e.target.value ? Number(e.target.value) : null;
                      
                      // If Last Transaction Count is entered, reset Duration & Type
                      if (lastTransactionCountVal) {
                        setCustomValue(prev => ({
                          ...prev,
                          lastTransactionCount: lastTransactionCountVal,
                          duration: null,
                          durationType: null
                        }));
                      } else {
                        handleFieldChange('lastTransactionCount', lastTransactionCountVal);
                      }
                    }}
                    placeholder="Count"
                    className="w-full bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    min={1}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Or specify the number of last transactions to aggregate.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Conditions Section */}
        {customValue.isAggregated && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-green-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <FilterIcon className="text-green-600 w-5 h-5" />
                <h2 className="text-lg font-semibold text-gray-900">Filter Conditions</h2>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CustomValueFiltersSection
                filters={customValue.filters}
                onChange={handleFiltersChange}
              />
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={handleResetCustomValue}>
            Reset Form
          </Button>
          <Button variant="outline" onClick={() => navigate('/custom-values')}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-primary text-white px-6"
            onClick={handleSaveCustomValue}
            disabled={!customValue.title || saving}
          >
            {saving ? 'Saving...' : 'Save Custom Value'}
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default CreateCustomValuePage;
