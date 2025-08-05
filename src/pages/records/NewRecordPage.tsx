import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarActions
} from '@/partials/toolbar';
import { Input } from '@/components/ui/input';
import { recordService, templateService, type TemplateField, FieldType, ScoreCriteriaRange, TemplateType } from '@/services/api';
import type { Record as ApiRecord } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { lookupService } from '@/services/api';
import { uniqueID } from '@/lib/helpers';

// Define the base form values type
interface BaseFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  identification: string;
  templateId: number;
  countryOfBirthLookupValueId: number | null;
  nationalityLookupValueId: number | null;
  customerReferenceId: string;
  [key: string]: string | number | boolean | null | undefined; // Allow dynamic field values
}

// Define field option type
interface FieldOption {
  id?: number;
  fieldId?: number;
  label: string;
  scoreCriteriaId: number;
  displayOrder: number;
  value?: string; // Make value optional since it's added by us
}

// Extend TemplateField type to include options and ranges
interface ExtendedTemplateField extends TemplateField {
  options?: FieldOption[];
  ranges?: ScoreCriteriaRange[];
}

// Create base validation schema for required fields
const baseValidationSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  middleName: Yup.string(),
  lastName: Yup.string().required('Last name is required'),
  dateOfBirth: Yup.string().required('Date of birth is required'),
  identification: Yup.string().required('Identification is required'),
  templateId: Yup.number().required('Template is required'),
  countryOfBirthLookupValueId: Yup.number().nullable(),
  nationalityLookupValueId: Yup.number().nullable(),
  customerReferenceId: Yup.string()
}) as Yup.ObjectSchema<BaseFormValues>;

// Add helper function to get min and max values from ranges
const getRangeBounds = (ranges: ScoreCriteriaRange[] | undefined) => {
  if (!ranges || ranges.length === 0) return { min: undefined, max: undefined };
  
  return ranges.reduce((acc, range) => ({
    min: acc.min === undefined ? range.minValue : Math.min(acc.min, range.minValue),
    max: acc.max === undefined ? range.maxValue : Math.max(acc.max, range.maxValue)
  }), { min: undefined as number | undefined, max: undefined as number | undefined });
};

const NewRecordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdParam = searchParams.get('templateId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; tenantId: number }>>([]);
  const [templateFields, setTemplateFields] = useState<ExtendedTemplateField[]>([]);
  const [validationSchema, setValidationSchema] = useState<Yup.ObjectSchema<BaseFormValues>>(baseValidationSchema);
  const [countryOfBirthOptions, setCountryOfBirthOptions] = useState<Array<{ id: number; value: string }>>([]);
  const [nationalityOptions, setNationalityOptions] = useState<Array<{ id: number; value: string }>>([]);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await templateService.getTemplates({
          pageNumber: 1,
          pageSize: 100,
          templateType: TemplateType.Record
        });
        setTemplates(data.items
          .filter(template => template.status === 1) // Only Active templates
          .map(template => ({ 
            id: template.id, 
            name: template.name,
            tenantId: template.tenantId
          })));
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch templates. Please try again.',
          variant: 'destructive'
        });
      }
    };

    fetchTemplates();
  }, []);

  // Fetch lookup values for country of birth and nationality
  useEffect(() => {
    const fetchLookupValues = async () => {
      try {
        // Fetch country of birth lookup values (lookupId = 4)
        const countryOfBirthData = await lookupService.getLookupValues(4, { pageNumber: 1, pageSize: 100 });
        setCountryOfBirthOptions(countryOfBirthData.items.map(item => ({ id: item.id, value: item.value })));

        // Fetch nationality lookup values (lookupId = 7)
        const nationalityData = await lookupService.getLookupValues(7, { pageNumber: 1, pageSize: 100 });
        setNationalityOptions(nationalityData.items.map(item => ({ id: item.id, value: item.value })));
      } catch (error) {
        console.error('Error fetching lookup values:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch lookup values. Please try again.',
          variant: 'destructive'
        });
      }
    };

    fetchLookupValues();
  }, []);

  // Fetch template fields when template is selected
  const fetchTemplateFields = async (templateId: number) => {
    try {
      const fieldsResponse = await templateService.getTemplateFields(templateId.toString());
      // Get all fields from sections and fields without section
      const allFields = [
        ...fieldsResponse.sections.flatMap(section => section.fields),
        ...fieldsResponse.fieldsWithoutSection
      ];
      
      // Fetch options and ranges for fields that need them
      const fieldsWithOptions = await Promise.all(
        allFields.map(async (field) => {
          const extendedField: ExtendedTemplateField = { ...field };
          
          // Fetch options for option-based fields
          if (
            field.fieldType === FieldType.Dropdown ||
            field.fieldType === FieldType.Radio ||
            field.fieldType === FieldType.Checkbox
          ) {
            const options = await templateService.getFieldOptions(templateId.toString(), field.id!);
            // Ensure all required fields are present and add value
            extendedField.options = options.map(opt => ({
              ...opt,
              value: opt.label // Add value property while preserving all required fields
            }));
          }
          
          // Fetch lookup values for Lookup fields
          if (field.fieldType === FieldType.Lookup && field.lookupId) {
            try {
              const lookupValues = await lookupService.getLookupValues(field.lookupId, { pageNumber: 1, pageSize: 100 });
              // Convert lookup values to field options format
              extendedField.options = lookupValues.items.map((lookupValue, index) => ({
                id: lookupValue.id,
                fieldId: field.id!,
                label: lookupValue.value,
                scoreCriteriaId: 0, // Default score criteria
                displayOrder: index + 1,
                value: lookupValue.value
              }));
            } catch (error) {
              console.error(`Error fetching lookup values for field ${field.id}:`, error);
              extendedField.options = [];
            }
          }
          
          // Fetch ranges for number fields
          if (field.fieldType === FieldType.Number) {
            const ranges = await templateService.getTemplateScoreCriteriaRanges(templateId.toString(), field.id!);
            extendedField.ranges = ranges;
          }
          
          return extendedField;
        })
      );
      setTemplateFields(fieldsWithOptions);

      // Update the validation schema when template fields change
      if (fieldsWithOptions.length > 0) {
        const dynamicSchema = fieldsWithOptions.reduce<Yup.ObjectSchema<BaseFormValues>>((schema, field) => {
          const fieldName = `field_${field.id}`;
          let fieldSchema: Yup.Schema<any>;

          switch (field.fieldType) {
            case FieldType.Text:
            case FieldType.TextArea:
            case FieldType.Dropdown:
            case FieldType.Radio:
            case FieldType.Lookup:
              fieldSchema = Yup.string();
              break;
            case FieldType.Number:
              // Get the overall min and max from ranges
              const { min, max } = getRangeBounds(field.ranges);
              fieldSchema = Yup.number()
                .nullable()
                .transform((value) => (isNaN(value) ? null : value))
                .test('range', 'Value must be within the valid range', function(value) {
                  if (value === null || value === undefined) return true; // Skip validation if no value
                  if (min !== undefined && value < min) {
                    return this.createError({
                      message: `Value must be at least ${min}`
                    });
                  }
                  if (max !== undefined && value > max) {
                    return this.createError({
                      message: `Value must be at most ${max}`
                    });
                  }
                  return true;
                });
              break;
            case FieldType.Date:
              fieldSchema = Yup.string().nullable();
              break;
            case FieldType.Checkbox:
              fieldSchema = Yup.boolean();
              break;
            default:
              fieldSchema = Yup.string();
          }

          if (field.isRequired) {
            fieldSchema = fieldSchema.required(`${field.label} is required`);
          }

          return schema.shape({ [fieldName]: fieldSchema });
        }, baseValidationSchema);

        setValidationSchema(dynamicSchema);
      } else {
        setValidationSchema(baseValidationSchema);
      }
    } catch (error) {
      console.error('Error fetching template fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch template fields. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formik = useFormik<BaseFormValues>({
    initialValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      identification: '',
      templateId: templateIdParam ? parseInt(templateIdParam) : (templates.length > 0 ? templates[0].id : 0),
      countryOfBirthLookupValueId: null,
      nationalityLookupValueId: null,
      customerReferenceId: '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      
      try {
        // Find the selected template to get its name and tenantId
        const selectedTemplate = templates.find(t => t.id === values.templateId);
        
        if (!selectedTemplate) {
          throw new Error('Template not found');
        }

        // Format field responses based on field types
        const fieldResponses = templateFields.map(field => {
          const value = values[`field_${field.id}`];
          let response: any = {
            id: 0,
            fieldId: field.id
          };

          switch (field.fieldType) {
            case FieldType.Text:
            case FieldType.TextArea:
              response.valueText = String(value);
              response.valueNumber = null;
              response.valueDate = null;
              break;
            case FieldType.Number:
              // For number fields, we need to find the matching range option
              const numericValue = value !== undefined && value !== '' ? Number(value) : null;
              response.valueNumber = numericValue;
              
              // Find the matching range based on the value
              const matchingRange = field.ranges?.find(range => 
                numericValue !== null && 
                numericValue >= range.minValue && 
                numericValue <= range.maxValue
              );

              // Set the range ID in valueText if a matching range is found
              response.templateFieldScoreCriteriaId = matchingRange ? matchingRange.id.toString() : null;
              response.valueDate = null;
              response.valueText = null;
              break;
            case FieldType.Date:
              response.valueText = null;
              response.valueNumber = null;
              response.valueDate = value ? new Date(String(value)).toISOString() : null;
              break;
            case FieldType.Dropdown:
            case FieldType.Radio:
            case FieldType.Checkbox:
            case FieldType.Lookup:
              // For all option-based fields, find the selected option
              let selectedOption;
              
              if (field.fieldType === FieldType.Checkbox) {
                // For checkbox fields, find the appropriate "Checked" or "Unchecked" option
                selectedOption = field.options?.find(opt => 
                  opt.label.toLowerCase() === (value === true ? "checked" : "unchecked")
                );
                // Fallback to first option if "Checked"/"Unchecked" not found
                if (!selectedOption && field.options?.[0]) {
                  selectedOption = field.options[0];
                }
              } else {
                // For dropdown, radio, and lookup, find by option ID
                selectedOption = field.options?.find(opt => opt.id && opt.id.toString() === value);
              }

              // Set the option ID in valueText if an option is found and has an ID
              response.optionId = selectedOption?.id ? selectedOption.id.toString() : null;
              response.valueNumber = null;
              response.valueDate = null;
              break;
          }

          return response;
        });

        // Format date string to ISO format
        const dateOfBirth = values.dateOfBirth ? new Date(String(values.dateOfBirth)).toISOString() : '';

        // Create the record with all required fields
        const recordData = {
          firstName: values.firstName,
          middleName: values.middleName || null,
          lastName: values.lastName,
          dateOfBirth,
          identification: values.identification,
          tenantId: selectedTemplate.tenantId,
          userId: '', // Placeholder, update as needed
          country: values.countryOfBirthLookupValueId || 0,
          nationality: values.nationalityLookupValueId || 0,
          fieldResponses,
          score: 0, // Default score
          scoreBGColor: '#ffffff', // Default background color
          uuid: uniqueID(), // Generate unique ID
          customerReferenceId: values.customerReferenceId || ''
        };

        const response = await recordService.createRecord(values.templateId, recordData) as any;
        
        if (response?.exceedsMediumThreshold) {
          toast({
            title: 'Case Created',
            description: 'This record exceeds the medium threshold. A case has been created.',
            variant: 'destructive',
          });
        }
        
        toast({
          title: 'Success',
          description: 'Record created successfully',
        });
        
        navigate('/records');
      } catch (error) {
        console.error('Error creating record:', error);
        toast({
          title: 'Error',
          description: 'Failed to create record. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Update form values when template changes
  useEffect(() => {
    if (formik.values.templateId) {
      fetchTemplateFields(formik.values.templateId);
      
      // Reset dynamic field values
      const newValues: BaseFormValues = {
        ...formik.values,
        ...templateFields.reduce((acc, field) => {
          const key = `field_${field.id}`;
          // Do not overwrite static fields like dateOfBirth
          if (key === 'dateOfBirth') return acc;
          return {
            ...acc,
            [key]: field.fieldType === FieldType.Checkbox ? false : ''
          };
        }, {})
      };
      formik.setValues(newValues);
    }
  }, [formik.values.templateId]);

  // Helper function to render field help text
  const renderFieldHelp = (field: ExtendedTemplateField) => {
    if (!field.placeholder && !field.minLength && !field.maxLength && !field.minValue && !field.maxValue && !field.minDate && !field.maxDate && !field.ranges) {
      return null;
    }

    const helpTexts = [];
    if (field.placeholder) helpTexts.push(field.placeholder);
    if (field.minLength && field.maxLength) {
      helpTexts.push(`Length: ${field.minLength}-${field.maxLength} characters`);
    } else if (field.minLength) {
      helpTexts.push(`Minimum length: ${field.minLength} characters`);
    } else if (field.maxLength) {
      helpTexts.push(`Maximum length: ${field.maxLength} characters`);
    }
    
    // For number fields with ranges, show the overall range
    if (field.fieldType === FieldType.Number && field.ranges) {
      const { min, max } = getRangeBounds(field.ranges);
      if (min !== undefined && max !== undefined) {
        helpTexts.push(`Valid range: ${min} to ${max}`);
      } else if (min !== undefined) {
        helpTexts.push(`Minimum value: ${min}`);
      } else if (max !== undefined) {
        helpTexts.push(`Maximum value: ${max}`);
      }
    } else {
      // For other number fields, show the field's own min/max
      if (field.minValue !== null && field.maxValue !== null) {
        helpTexts.push(`Range: ${field.minValue}-${field.maxValue}`);
      } else if (field.minValue !== null) {
        helpTexts.push(`Minimum value: ${field.minValue}`);
      } else if (field.maxValue !== null) {
        helpTexts.push(`Maximum value: ${field.maxValue}`);
      }
    }
    
    if (field.minDate && field.maxDate) {
      helpTexts.push(`Date range: ${field.minDate} to ${field.maxDate}`);
    } else if (field.minDate) {
      helpTexts.push(`Earliest date: ${field.minDate}`);
    } else if (field.maxDate) {
      helpTexts.push(`Latest date: ${field.maxDate}`);
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground ml-1 inline-block" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{helpTexts.join('. ')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Helper function to render field label with required indicator and help
  const renderFieldLabel = (field: ExtendedTemplateField, htmlFor: string) => (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      {field.label}
      {field.isRequired && <span className="text-red-500">*</span>}
      {renderFieldHelp(field)}
    </Label>
  );

  // Render dynamic form field based on field type
  const renderDynamicField = (field: ExtendedTemplateField) => {
    const fieldName = `field_${field.id}`;
    const fieldValue = formik.values[fieldName];
    const fieldError = formik.touched[fieldName] && formik.errors[fieldName];
    const isInvalid = fieldError ? true : false;

    const fieldWrapperClasses = cn(
      "space-y-2",
      field.fieldType === FieldType.Checkbox ? "flex items-start space-x-2" : "",
      field.fieldType === FieldType.Radio ? "space-y-3" : ""
    );

    const inputClasses = cn(
      "w-full",
      isInvalid ? "border-red-500 focus-visible:ring-red-500" : "",
      field.fieldType === FieldType.Checkbox ? "mt-1" : ""
    );

    switch (field.fieldType) {
      case FieldType.Text:
      case FieldType.TextArea:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            {field.fieldType === FieldType.Text ? (
              <Input
                id={fieldName}
                name={fieldName}
                value={fieldValue as string || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
              />
            ) : (
              <Textarea
                id={fieldName}
                name={fieldName}
                value={fieldValue as string || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
                rows={4}
              />
            )}
            {fieldError && (
              <p className="text-sm text-red-500 mt-1">{fieldError as string}</p>
            )}
          </div>
        );

      case FieldType.Number:
        const { min, max } = getRangeBounds(field.ranges);
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Input
              id={fieldName}
              name={fieldName}
              type="number"
              value={fieldValue as number || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={inputClasses}
              placeholder={field.placeholder}
              min={min !== undefined ? min : field.minValue || undefined}
              max={max !== undefined ? max : field.maxValue || undefined}
              step="any"
            />
            {fieldError && (
              <p className="text-sm text-red-500 mt-1">{fieldError as string}</p>
            )}
          </div>
        );

      case FieldType.Date:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Input
              id={fieldName}
              name={fieldName}
              type="date"
              value={typeof fieldValue === 'string' || typeof fieldValue === 'number' ? String(fieldValue) : ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={inputClasses}
              min={field.minDate || undefined}
              max={field.maxDate || undefined}
            />
            {fieldError && (
              <p className="text-sm text-red-500 mt-1">{fieldError as string}</p>
            )}
          </div>
        );

      case FieldType.Checkbox:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            <div className="flex items-start space-x-2">
              <Checkbox
                id={fieldName}
                name={fieldName}
                checked={Boolean(fieldValue)} // Convert to boolean for checkbox
                onCheckedChange={(checked) => {
                  formik.setFieldValue(fieldName, checked); // Store as boolean in form
                }}
                className={cn("mt-1", isInvalid ? "border-red-500" : "")}
              />
              <div className="space-y-1">
                {renderFieldLabel(field, fieldName)}
                {fieldError && (
                  <p className="text-sm text-red-500">{fieldError as string}</p>
                )}
              </div>
            </div>
          </div>
        );

      case FieldType.Dropdown:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Select
              name={fieldName}
              value={fieldValue as string || ''}
              onValueChange={(value: string) => {
                formik.setFieldValue(fieldName, value);
              }}
            >
              <SelectTrigger className={cn(inputClasses, "w-full")}>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: FieldOption) => (
                  option.id && (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.label}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-sm text-red-500 mt-1">{fieldError as string}</p>
            )}
          </div>
        );

      case FieldType.Radio:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <div className="space-y-2">
              {field.options?.map((option: FieldOption) => (
                option.id && (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${fieldName}_${option.id}`}
                      name={fieldName}
                      value={option.id.toString()}
                      checked={fieldValue === option.id.toString()}
                      onChange={(e) => {
                        formik.setFieldValue(fieldName, e.target.value);
                      }}
                      className={cn(
                        "h-4 w-4 border-gray-300 text-primary focus:ring-primary",
                        isInvalid ? "border-red-500" : ""
                      )}
                    />
                    <Label 
                      htmlFor={`${fieldName}_${option.id}`}
                      className="text-sm font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                )
              ))}
            </div>
            {fieldError && (
              <p className="text-sm text-red-500 mt-1">{fieldError as string}</p>
            )}
          </div>
        );

      case FieldType.Lookup:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Select
              name={fieldName}
              value={fieldValue as string || ''}
              onValueChange={(value: string) => {
                formik.setFieldValue(fieldName, value);
              }}
            >
              <SelectTrigger className={cn(inputClasses, "w-full")}>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: FieldOption) => (
                  option.id && (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.label}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-sm text-red-500 mt-1">{fieldError as string}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function to sort fields - checkboxes last
  const sortFields = (fields: ExtendedTemplateField[]) => {
    return [...fields].sort((a, b) => {
      // If a is checkbox and b is not, move a to end
      if (a.fieldType === FieldType.Checkbox && b.fieldType !== FieldType.Checkbox) {
        return 1;
      }
      // If b is checkbox and a is not, move b to end
      if (b.fieldType === FieldType.Checkbox && a.fieldType !== FieldType.Checkbox) {
        return -1;
      }
      // Otherwise maintain original order
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <ToolbarHeading>Create New Record</ToolbarHeading>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate('/records')}
            >
              Cancel
            </Button>
          </ToolbarActions>
        </Toolbar>

        {/* Template Selection Card */}
        <Card className="shadow-md border-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b rounded-t-lg">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span role="img" aria-label="template">📄</span> Select a Template
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose an <span className="font-semibold text-primary">Active</span> template to start creating a record.
            </p>
          </CardHeader>
          <CardContent className="p-8 flex flex-col gap-4">
            {templates.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-lg font-medium mb-2">No active templates available</p>
                <p className="text-sm">Please activate a template before creating a record.</p>
              </div>
            ) : (
              <Select
                onValueChange={(value) => {
                  formik.setFieldValue('templateId', parseInt(value));
                }}
                value={formik.values.templateId ? formik.values.templateId.toString() : ''}
              >
                <SelectTrigger className="w-full h-14 text-lg border-2 border-primary/40 focus:border-primary rounded-lg shadow-sm">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id.toString()}
                      className="text-base"
                    >
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Show the rest of the form only if a template is selected */}
        {formik.values.templateId && templates.length > 0 && (
          <form onSubmit={formik.handleSubmit} className="space-y-6 animate-fade-in">
            {/* Personal Information Card */}
            <Card>
              <CardHeader className="bg-gray-50/50 border-b">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the basic information about the record holder.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="flex items-center">
                      First Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.firstName && formik.errors.firstName ? 'border-red-500' : ''}
                    />
                    {formik.touched.firstName && formik.errors.firstName ? (
                      <div className="text-red-500 text-sm mt-1">{formik.errors.firstName as string}</div>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="middleName">
                      Middle Name
                    </Label>
                    <Input
                      id="middleName"
                      name="middleName"
                      value={formik.values.middleName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="flex items-center">
                      Last Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.lastName && formik.errors.lastName ? 'border-red-500' : ''}
                    />
                    {formik.touched.lastName && formik.errors.lastName ? (
                      <div className="text-red-500 text-sm mt-1">{formik.errors.lastName as string}</div>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="identification" className="flex items-center">
                      Identification <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="identification"
                      name="identification"
                      value={formik.values.identification}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.identification && formik.errors.identification ? 'border-red-500' : ''}
                    />
                    {formik.touched.identification && formik.errors.identification ? (
                      <div className="text-red-500 text-sm mt-1">{formik.errors.identification as string}</div>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth" className="flex items-center">
                      Date of Birth <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formik.values.dateOfBirth}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.dateOfBirth && formik.errors.dateOfBirth ? 'border-red-500' : ''}
                    />
                    {formik.touched.dateOfBirth && formik.errors.dateOfBirth ? (
                      <div className="text-red-500 text-sm mt-1">{formik.errors.dateOfBirth as string}</div>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="countryOfBirthLookupValueId">
                      Country of Birth
                    </Label>
                    <Select
                      name="countryOfBirthLookupValueId"
                      value={formik.values.countryOfBirthLookupValueId?.toString() || ''}
                      onValueChange={(value: string) => {
                        formik.setFieldValue('countryOfBirthLookupValueId', value ? parseInt(value) : null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select country of birth" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOfBirthOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nationalityLookupValueId">
                      Nationality
                    </Label>
                    <Select
                      name="nationalityLookupValueId"
                      value={formik.values.nationalityLookupValueId?.toString() || ''}
                      onValueChange={(value: string) => {
                        formik.setFieldValue('nationalityLookupValueId', value ? parseInt(value) : null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalityOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id.toString()}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="customerReferenceId">
                      Customer Reference ID
                    </Label>
                    <Input
                      id="customerReferenceId"
                      name="customerReferenceId"
                      value={formik.values.customerReferenceId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Fields Card */}
            {templateFields.length > 0 && (
              <Card>
                <CardHeader className="bg-gray-50/50 border-b">
                  <h2 className="text-xl font-semibold">Template Fields</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in the required information based on the selected template.
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Regular Fields */}
                    {sortFields(templateFields)
                      .filter(field => field.fieldType !== FieldType.Checkbox)
                      .map((field) => (
                        <div key={field.id} className={cn(
                          "p-4 rounded-lg border",
                          field.fieldType === FieldType.TextArea ? "md:col-span-2" : ""
                        )}>
                          {renderDynamicField(field)}
                        </div>
                      ))}
                  </div>

                  {/* Checkbox Fields Section */}
                  {templateFields.some(field => field.fieldType === FieldType.Checkbox) && (
                    <div className="mt-8 pt-6 border-t">
                      <h3 className="text-lg font-medium mb-4">Additional Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sortFields(templateFields)
                          .filter(field => field.fieldType === FieldType.Checkbox)
                          .map((field) => (
                            <div key={field.id} className="p-4 rounded-lg border">
                              {renderDynamicField(field)}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/records')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading || templates.length === 0}
              >
                {isLoading ? 'Creating...' : 'Create Record'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Container>
  );
};

export default NewRecordPage; 