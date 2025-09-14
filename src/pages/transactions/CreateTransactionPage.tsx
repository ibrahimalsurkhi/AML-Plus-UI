import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KeenIcon } from '@/components/keenicons';
import {
  transactionTypeService,
  lookupService,
  templateService,
  transactionService,
  FieldType,
  type TemplateField,
  type TransactionPrepareResponse,
  type TransactionTemplate,
  type TransactionTypeOption,
  type CurrencyOption,
  type StatusOption,
  type ProcessingStatusOption,
  type CustomField,
  ScoreCriteriaRange
} from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import {
  recordService,
  accountService,
  fieldResponseService,
  type FieldResponseDetail,
  type FieldResponseCreate
} from '@/services/api';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { AccountSelectionDialog } from '@/components/account-selection';

// Define field option type
interface FieldOption {
  id?: number;
  fieldId?: number;
  label: string;
  scoreCriteriaId: number;
  displayOrder: number;
  value?: string;
}

// Extend TemplateField type to include options and ranges
interface ExtendedTemplateField extends TemplateField {
  options?: FieldOption[];
  ranges?: ScoreCriteriaRange[];
}

const initialForm = {
  transactionTypeId: '',
  transactionCurrencyId: '',
  transactionAmount: '',
  currencyAmount: '',
  transactionID: '',
  transactionTime: '',
  transactionPurpose: '',
  transactionStatus: '',
  senderId: '',
  recipientId: ''
};

const CreateTransactionPage = () => {
  const navigate = useNavigate();
  const [transactionTypes, setTransactionTypes] = useState<TransactionTypeOption[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [processingStatusOptions, setProcessingStatusOptions] = useState<ProcessingStatusOption[]>(
    []
  );
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [transactionTemplates, setTransactionTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<any>({});
  const [showSender, setShowSender] = useState(false);
  const [showRecipient, setShowRecipient] = useState(false);
  const [senderAccount, setSenderAccount] = useState<any>({});
  const [recipientAccount, setRecipientAccount] = useState<any>({});
  const [creatingSender, setCreatingSender] = useState(false);
  const [creatingRecipient, setCreatingRecipient] = useState(false);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  // Dialog state
  const [senderDialogOpen, setSenderDialogOpen] = useState(false);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [selectedSenderAccount, setSelectedSenderAccount] = useState<any>(null);
  const [selectedRecipientAccount, setSelectedRecipientAccount] = useState<any>(null);
  // Currencies state
  const [currencies, setCurrencies] = useState<any[]>([]);
  // Template fields state
  const [templateFields, setTemplateFields] = useState<ExtendedTemplateField[]>([]);
  const [fieldResponses, setFieldResponses] = useState<FieldResponseCreate[]>([]);

  useEffect(() => {
    const prepareTransaction = async () => {
      try {
        setLoading(true);
        const prepareData = await transactionService.prepareTransaction();

        // Set all the data from the prepare API
        setTransactionTypes(prepareData.transactionTypes);
        setCurrencyOptions(prepareData.currencyOptions);
        setStatusOptions(prepareData.statusOptions);
        setProcessingStatusOptions(prepareData.processingStatusOptions);
        setCustomFields(prepareData.customFields);
        setTransactionTemplates(prepareData.transactionTemplates);

        // Convert customFields to templateFields format for backward compatibility
        const templateFieldsFromCustomFields = prepareData.customFields.map((customField) => ({
          id: customField.id,
          templateId: customField.templateId,
          label: customField.label,
          fieldType: customField.fieldType,
          weight: 0, // Default weight
          isRequired: customField.isRequired,
          displayOrder: customField.displayOrder,
          placeholder: customField.placeholder,
          minLength: customField.minLength,
          maxLength: customField.maxLength,
          minValue: customField.minValue,
          maxValue: customField.maxValue,
          minDate: customField.minDate,
          maxDate: customField.maxDate,
          pattern: customField.pattern,
          lookupId: customField.lookupId,
          options: customField.lookupOptions.map((option) => ({
            id: option.id,
            fieldId: customField.id,
            label: option.value,
            scoreCriteriaId: 0,
            displayOrder: option.displayOrder,
            value: option.value
          }))
        }));
        setTemplateFields(templateFieldsFromCustomFields);

        // Set currencies from currency options for backward compatibility
        setCurrencies(
          prepareData.currencyOptions.map((currency) => ({
            id: currency.id,
            lookupId: 2, // Assuming currency lookup ID
            value: currency.value,
            scoreCriteriaId: 0
          }))
        );
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to prepare transaction data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    prepareTransaction();
  }, []);

  // Template fields are now loaded from the prepare API as customFields

  // Currencies are now loaded from the prepare API

  // Handler functions for account selection
  const handleSenderAccountSelected = (account: any) => {
    setSelectedSenderAccount(account);
    setForm((f) => ({ ...f, senderId: String(account.id) }));
  };

  const handleRecipientAccountSelected = (account: any) => {
    setSelectedRecipientAccount(account);
    setForm((f) => ({ ...f, recipientId: String(account.id) }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!form.transactionTypeId) newErrors.transactionTypeId = 'Transaction type is required';
    if (!form.transactionCurrencyId) newErrors.transactionCurrencyId = 'Currency is required';
    if (!form.transactionAmount) newErrors.transactionAmount = 'Amount is required';
    if (!form.currencyAmount) newErrors.currencyAmount = 'Currency amount is required';
    if (!form.transactionID) newErrors.transactionID = 'Transaction ID is required';
    if (!form.transactionTime) newErrors.transactionTime = 'Time is required';
    if (!form.transactionPurpose) newErrors.transactionPurpose = 'Purpose is required';
    if (!form.transactionStatus) newErrors.transactionStatus = 'Status is required';

    // Check if transaction time is in the future
    if (form.transactionTime) {
      const transactionDate = new Date(form.transactionTime);
      const now = new Date();
      if (transactionDate > now) {
        newErrors.transactionTime = 'Transaction time cannot be in the future';
      }
    }

    // Debug logging
    console.log(
      'Validation - showSender:',
      showSender,
      'form.senderId:',
      form.senderId,
      'selectedSenderAccount:',
      selectedSenderAccount
    );
    console.log(
      'Validation - showRecipient:',
      showRecipient,
      'form.recipientId:',
      form.recipientId,
      'selectedRecipientAccount:',
      selectedRecipientAccount
    );
    console.log('Form data for validation:', form);

    if (showSender && !form.senderId && !selectedSenderAccount) {
      newErrors.senderId = 'Sender account is required';
    }
    if (showRecipient && !form.recipientId && !selectedRecipientAccount) {
      newErrors.recipientId = 'Recipient account is required';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear errors when accounts are selected
  useEffect(() => {
    if (selectedSenderAccount && errors.senderId) {
      setErrors((err: any) => ({ ...err, senderId: undefined }));
    }
    if (selectedRecipientAccount && errors.recipientId) {
      setErrors((err: any) => ({ ...err, recipientId: undefined }));
    }
  }, [selectedSenderAccount, selectedRecipientAccount, errors.senderId, errors.recipientId]);

  const handleTypeChange = (id: string) => {
    setForm((f) => ({ ...f, transactionTypeId: id }));
    const type = transactionTypes.find((t) => t.id.toString() === id);
    setShowSender(type?.isSenderRequired ?? false);
    setShowRecipient(type?.isRecipientRequired ?? false);
    setStep(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err: any) => ({ ...err, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Current form state:', form);
    console.log('Field responses (custom fields):', fieldResponses);
    console.log('Selected sender account:', selectedSenderAccount);
    console.log('Selected recipient account:', selectedRecipientAccount);
    console.log('Sender account object:', senderAccount);
    console.log('Recipient account object:', recipientAccount);
    console.log('Recipient dialog open state:', recipientDialogOpen);

    if (!validate()) {
      console.log('Validation failed, returning early');
      return;
    }
    console.log('Validation passed, proceeding with transaction creation');
    setLoading(true);
    try {
      let senderId = selectedSenderAccount?.id
        ? String(selectedSenderAccount.id)
        : form.senderId || undefined;
      let recipientId = selectedRecipientAccount?.id
        ? String(selectedRecipientAccount.id)
        : form.recipientId || undefined;

      console.log(
        'Using senderId:',
        senderId,
        'from selectedSenderAccount:',
        selectedSenderAccount?.id
      );
      console.log(
        'Using recipientId:',
        recipientId,
        'from selectedRecipientAccount:',
        selectedRecipientAccount?.id
      );

      // Create sender account if required and not already created
      if (showSender && !senderId) {
        console.log('Creating sender account...');
        console.log('Sender account data:', senderAccount);
        try {
          const res = await accountService.createAccount(senderAccount);
          console.log('Sender account created successfully:', res);
          senderId = String(res.id);
        } catch (error: any) {
          console.error('Error creating sender account:', error);
          console.error('Sender account error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw error;
        }
      }
      // Create recipient account if required and not already created
      if (showRecipient && !recipientId) {
        console.log('Creating recipient account...');
        console.log('Recipient account data:', recipientAccount);
        try {
          const res = await accountService.createAccount(recipientAccount);
          console.log('Recipient account created successfully:', res);
          recipientId = String(res.id);
        } catch (error: any) {
          console.error('Error creating recipient account:', error);
          console.error('Recipient account error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          throw error;
        }
      }

      // Create the transaction
      const transactionData = {
        transactionTypeId: Number(form.transactionTypeId),
        transactionCurrencyId: Number(form.transactionCurrencyId),
        transactionAmount: Number(form.transactionAmount),
        currencyAmount: Number(form.currencyAmount),
        transactionID: form.transactionID,
        transactionTime: form.transactionTime,
        transactionPurpose: form.transactionPurpose,
        transactionStatus: Number(form.transactionStatus),
        senderId: senderId ? Number(senderId) : undefined,
        recipientId: recipientId ? Number(recipientId) : undefined
      };

      console.log('About to create transaction with data:', transactionData);
      console.log('Transaction service:', transactionService);

      let createdTransaction: number;
      try {
        // Create transaction with field responses included
        const transactionDataWithFields = {
          transactionTypeId: Number(form.transactionTypeId),
          transactionCurrencyId: Number(form.transactionCurrencyId),
          transactionAmount: Number(form.transactionAmount),
          currencyAmount: Number(form.currencyAmount),
          transactionID: form.transactionID,
          transactionTime: form.transactionTime,
          transactionPurpose: form.transactionPurpose,
          transactionStatus: Number(form.transactionStatus),
          senderId: senderId ? Number(senderId) : undefined,
          recipientId: recipientId ? Number(recipientId) : undefined,
          fieldResponses: fieldResponses
        };

        console.log(
          'Creating transaction with field responses included:',
          transactionDataWithFields
        );
        createdTransaction = await transactionService.createTransaction(transactionDataWithFields);
        console.log('Transaction creation response:', createdTransaction);
      } catch (error: any) {
        console.error('Error creating transaction:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        throw error; // Re-throw to be caught by the outer try-catch
      }

      // Get the transaction ID and check processing status
      // Handle both object response and direct ID response
      let transactionId: number;

      // API returned just the ID number
      transactionId = createdTransaction;

      console.log('Extracted transaction ID:', transactionId);

      // Validate that we have a valid transaction ID
      if (!transactionId || transactionId <= 0) {
        console.error('Invalid transaction ID received:', transactionId);
        setSuccess(true);
        toast({ title: 'Success', description: 'Transaction created successfully!' });
        return;
      }

      setSuccess(true);
      toast({
        title: 'Success',
        description: `Transaction #${transactionId} created successfully!`
      });

      // Check processing status after a short delay
      setTimeout(async () => {
        try {
          console.log('Checking processing status for transaction ID:', transactionId);
          const statusResponse =
            await transactionService.getTransactionProcessingStatus(transactionId);

          if (statusResponse.hasRuleMatches && statusResponse.matchedRulesCount > 0) {
            const matchedRules = statusResponse.ruleMatches.filter((rule) => rule.isMatched);
            const ruleNames = matchedRules.map((rule) => rule.ruleName).join(', ');

            toast({
              title: '⚠️ Rule Matches Detected',
              description: `${statusResponse.matchedRulesCount} rule(s) matched: ${ruleNames}`,
              variant: 'destructive'
            });
          } else {
            toast({
              title: '✅ Processing Complete',
              description: `Transaction #${transactionId} processed successfully with no rule matches.`
            });
          }

          // Redirect after status check is completed (success or error)
          setTimeout(() => {
            navigate('/transactions');
          }, 2000);
        } catch (error) {
          console.error('Error checking processing status:', error);
          toast({
            title: 'Processing Status Error',
            description: 'Unable to check transaction processing status',
            variant: 'destructive'
          });

          // Redirect even if status check fails
          setTimeout(() => {
            navigate('/transactions');
          }, 2000);
        }
      }, 2000); // Check status after 2 seconds
    } catch (error: any) {
      console.error('Error creating transaction:', error);

      // Handle validation errors from server
      if (error.response?.data?.validationErrors) {
        const validationErrors = error.response.data.validationErrors;
        const errorMessages: string[] = [];

        // Convert validation errors to user-friendly messages
        Object.keys(validationErrors).forEach((field) => {
          const fieldErrors = validationErrors[field];
          fieldErrors.forEach((errorMsg: string) => {
            errorMessages.push(`${field}: ${errorMsg}`);
          });
        });

        toast({
          title: 'Validation Error',
          description: errorMessages.join('\n'),
          variant: 'destructive'
        });
      } else {
        // Handle other errors
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create transaction',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    if (!showSender && !showRecipient) return null;
    const steps = [
      showSender && 'Sender Account',
      showRecipient && 'Recipient Account',
      'Transaction Details'
    ].filter(Boolean);
    return (
      <div className="flex items-center gap-2 mb-6">
        {steps.map((label, idx) => (
          <React.Fragment key={label as string}>
            <div
              className={`flex items-center gap-1 ${step === idx + 1 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <KeenIcon
                icon={step === idx + 1 ? 'check-circle' : 'circle'}
                style="solid"
                className="text-lg"
              />
              <span className="text-xs font-medium">{label}</span>
            </div>
            {idx < steps.length - 1 && (
              <span className="w-6 h-0.5 bg-muted-foreground/30 rounded-full" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Add AccountStatus enum for dropdown (integer values)
  const AccountStatusEnum = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 2 },
    { label: 'Closed', value: 3 },
    { label: 'Suspended', value: 4 }
  ];
  // Add TransactionStatus enum for dropdown
  const TransactionStatusEnum = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 2 },
    { label: 'Blocked', value: 3 },
    { label: 'Suspended', value: 4 }
  ];

  // Add helper function to get min and max values from ranges
  const getRangeBounds = (ranges: ScoreCriteriaRange[] | undefined) => {
    if (!ranges || ranges.length === 0) return { min: undefined, max: undefined };

    return ranges.reduce(
      (acc, range) => ({
        min: acc.min === undefined ? range.minValue : Math.min(acc.min, range.minValue),
        max: acc.max === undefined ? range.maxValue : Math.max(acc.max, range.maxValue)
      }),
      { min: undefined as number | undefined, max: undefined as number | undefined }
    );
  };

  // Helper function to render field help text
  const renderFieldHelp = (field: ExtendedTemplateField) => {
    if (
      !field.placeholder &&
      !field.minLength &&
      !field.maxLength &&
      !field.minValue &&
      !field.maxValue &&
      !field.minDate &&
      !field.maxDate &&
      !field.ranges
    ) {
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

  // Handle field value changes
  const handleFieldChange = (fieldId: number, value: any, fieldType: FieldType) => {
    setFieldResponses((prev) => {
      const existingIndex = prev.findIndex((fr) => fr.fieldId === fieldId);
      let response: FieldResponseCreate = {
        fieldId: fieldId
      };

      switch (fieldType) {
        case FieldType.Text:
        case FieldType.TextArea:
          response.valueText = String(value);
          break;
        case FieldType.Number:
          const numericValue = value !== undefined && value !== '' ? Number(value) : null;
          response.valueNumber = numericValue;

          // Find the matching range based on the value
          const field = templateFields.find((f) => f.id === fieldId);
          const matchingRange = field?.ranges?.find(
            (range) =>
              numericValue !== null &&
              numericValue >= range.minValue &&
              numericValue <= range.maxValue
          );

          // Set the range ID for number fields
          response.templateFieldScoreCriteriaId = matchingRange
            ? parseInt(matchingRange.id.toString())
            : null;
          break;
        case FieldType.Date:
          response.valueDate = value ? new Date(String(value)).toISOString() : null;
          break;
        case FieldType.Dropdown:
        case FieldType.Radio:
        case FieldType.Checkbox:
        case FieldType.Lookup:
          // For all option-based fields, find the selected option
          const fieldWithOptions = templateFields.find((f) => f.id === fieldId);
          let selectedOption;

          if (fieldType === FieldType.Checkbox) {
            // For checkbox fields, find the appropriate "Checked" or "Unchecked" option
            selectedOption = fieldWithOptions?.options?.find(
              (opt) => opt.label.toLowerCase() === (value === true ? 'checked' : 'unchecked')
            );
            // Fallback to first option if "Checked"/"Unchecked" not found
            if (!selectedOption && fieldWithOptions?.options?.[0]) {
              selectedOption = fieldWithOptions.options[0];
            }
          } else {
            // For dropdown, radio, and lookup, find by option ID
            selectedOption = fieldWithOptions?.options?.find(
              (opt) => opt.id && opt.id.toString() === value
            );
          }

          // Set the option ID for option-based fields
          response.optionId = selectedOption?.id ? parseInt(selectedOption.id.toString()) : null;
          break;
      }

      if (existingIndex >= 0) {
        const newResponses = [...prev];
        newResponses[existingIndex] = response;
        return newResponses;
      } else {
        return [...prev, response];
      }
    });
  };

  // Render dynamic form field based on field type
  const renderDynamicField = (field: ExtendedTemplateField) => {
    const fieldName = `field_${field.id}`;
    const currentResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
    const fieldValue = currentResponse
      ? field.fieldType === FieldType.Number
        ? currentResponse.valueNumber
        : field.fieldType === FieldType.Date
          ? currentResponse.valueDate
            ? currentResponse.valueDate.split('T')[0]
            : ''
          : field.fieldType === FieldType.Checkbox
            ? (() => {
                if (!currentResponse.optionId) return false;
                const selectedOption = field.options?.find(
                  (opt) => opt.id?.toString() === currentResponse.optionId?.toString()
                );
                return selectedOption?.label.toLowerCase() === 'checked';
              })()
            : field.fieldType === FieldType.Dropdown ||
                field.fieldType === FieldType.Radio ||
                field.fieldType === FieldType.Lookup
              ? currentResponse.optionId
                ? currentResponse.optionId.toString()
                : ''
              : currentResponse.valueText
      : '';

    const fieldWrapperClasses = cn(
      'space-y-2',
      field.fieldType === FieldType.Checkbox ? 'flex items-start space-x-2' : '',
      field.fieldType === FieldType.Radio ? 'space-y-3' : ''
    );

    const inputClasses = cn('w-full', field.fieldType === FieldType.Checkbox ? 'mt-1' : '');

    switch (field.fieldType) {
      case FieldType.Text:
      case FieldType.TextArea:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            {field.fieldType === FieldType.Text ? (
              <Input
                id={fieldName}
                value={(fieldValue as string) || ''}
                onChange={(e) => handleFieldChange(field.id!, e.target.value, field.fieldType)}
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
              />
            ) : (
              <Textarea
                id={fieldName}
                value={(fieldValue as string) || ''}
                onChange={(e) => handleFieldChange(field.id!, e.target.value, field.fieldType)}
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
                rows={4}
              />
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
              type="number"
              value={(fieldValue as number) || ''}
              onChange={(e) => handleFieldChange(field.id!, e.target.value, field.fieldType)}
              className={inputClasses}
              placeholder={field.placeholder}
              min={min !== undefined ? min : field.minValue || undefined}
              max={max !== undefined ? max : field.maxValue || undefined}
              step="any"
            />
          </div>
        );

      case FieldType.Date:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Input
              id={fieldName}
              type="date"
              value={
                typeof fieldValue === 'string' || typeof fieldValue === 'number'
                  ? String(fieldValue)
                  : ''
              }
              onChange={(e) => handleFieldChange(field.id!, e.target.value, field.fieldType)}
              className={inputClasses}
              min={field.minDate || undefined}
              max={field.maxDate || undefined}
            />
          </div>
        );

      case FieldType.Checkbox:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            <div className="flex items-start space-x-2">
              <Checkbox
                id={fieldName}
                checked={Boolean(fieldValue)}
                onCheckedChange={(checked) => {
                  handleFieldChange(field.id!, checked, field.fieldType);
                }}
                className={cn('mt-1', inputClasses)}
              />
              <div className="space-y-1">{renderFieldLabel(field, fieldName)}</div>
            </div>
          </div>
        );

      case FieldType.Dropdown:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Select
              value={(fieldValue as string) || ''}
              onValueChange={(value: string) => {
                handleFieldChange(field.id!, value, field.fieldType);
              }}
            >
              <SelectTrigger className={cn(inputClasses, 'w-full')}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(
                  (option: FieldOption) =>
                    option.id && (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.label}
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case FieldType.Lookup:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <Select
              value={(fieldValue as string) || ''}
              onValueChange={(value: string) => {
                handleFieldChange(field.id!, value, field.fieldType);
              }}
            >
              <SelectTrigger className={cn(inputClasses, 'w-full')}>
                <SelectValue placeholder={field.placeholder || 'Select a lookup value'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(
                  (option: FieldOption) =>
                    option.id && (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.label}
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
        );

      case FieldType.Radio:
        return (
          <div key={field.id} className={fieldWrapperClasses}>
            {renderFieldLabel(field, fieldName)}
            <div className="space-y-2">
              {field.options?.map(
                (option: FieldOption) =>
                  option.id && (
                    <div key={option.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${fieldName}_${option.id}`}
                        value={option.id.toString()}
                        checked={fieldValue === option.id.toString()}
                        onChange={(e) => {
                          handleFieldChange(field.id!, e.target.value, field.fieldType);
                        }}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`${fieldName}_${option.id}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  )
              )}
            </div>
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
      <Toolbar>
        <ToolbarHeading>Create Transaction</ToolbarHeading>
      </Toolbar>
      <div className="mb-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <KeenIcon icon="info" style="duotone" className="text-primary text-2xl" />
            <h2 className="text-xl font-semibold">Transaction Information</h2>
          </div>
          <p className="text-gray-600">
            Fill out the form below to create a new transaction. Transactions help you track and
            manage your financial activities efficiently.
          </p>
          <ul className="list-disc pl-6 text-gray-500 text-sm">
            <li>Choose the correct transaction type and fill all required fields.</li>
            <li>Sender/Recipient accounts can be created inline if required.</li>
            <li>After creation, you will be redirected to the dashboard.</li>
          </ul>
        </div>
      </div>
      <Card className="mt-8 shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <KeenIcon icon="sort" style="duotone" className="text-primary" />
            Create Transaction
          </CardTitle>
          <CardDescription>
            Fill in the details to create a new transaction. Required fields are marked with{' '}
            <span className="text-primary">*</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          {success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <KeenIcon icon="like" style="duotone" className="text-success text-4xl mb-2" />
              <div className="text-lg font-semibold text-success mb-1">Transaction Created!</div>
              <div className="text-muted-foreground mb-4">You will be redirected shortly.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="transactionTypeId">
                    Transaction Type <span className="text-primary">*</span>
                  </Label>
                  <Select value={form.transactionTypeId} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Transaction Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.transactionTypeId && (
                    <div className="text-xs text-destructive mt-1">{errors.transactionTypeId}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="transactionCurrencyId">
                    Currency ID <span className="text-primary">*</span>
                  </Label>
                  <Select
                    value={form.transactionCurrencyId}
                    onValueChange={(v) => setForm((f) => ({ ...f, transactionCurrencyId: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={String(currency.id)}>
                          {currency.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.transactionCurrencyId && (
                    <div className="text-xs text-destructive mt-1">
                      {errors.transactionCurrencyId}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="transactionAmount">
                    Transaction Amount <span className="text-primary">*</span>
                  </Label>
                  <Input
                    name="transactionAmount"
                    value={form.transactionAmount}
                    onChange={handleInputChange}
                    required={true}
                    type="number"
                    min="0"
                    autoComplete="off"
                  />
                  {errors.transactionAmount && (
                    <div className="text-xs text-destructive mt-1">{errors.transactionAmount}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="currencyAmount">
                    Currency Amount <span className="text-primary">*</span>
                  </Label>
                  <Input
                    name="currencyAmount"
                    value={form.currencyAmount}
                    onChange={handleInputChange}
                    required={true}
                    type="number"
                    min="0"
                    autoComplete="off"
                  />
                  {errors.currencyAmount && (
                    <div className="text-xs text-destructive mt-1">{errors.currencyAmount}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="transactionID">
                    Transaction ID <span className="text-primary">*</span>
                  </Label>
                  <Input
                    name="transactionID"
                    value={form.transactionID}
                    onChange={handleInputChange}
                    required={true}
                    autoComplete="off"
                  />
                  {errors.transactionID && (
                    <div className="text-xs text-destructive mt-1">{errors.transactionID}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="transactionTime">
                    Transaction Time <span className="text-primary">*</span>
                  </Label>
                  <Input
                    name="transactionTime"
                    value={form.transactionTime}
                    onChange={handleInputChange}
                    required={true}
                    type="datetime-local"
                    max={new Date().toISOString().slice(0, 16)}
                  />
                  {errors.transactionTime && (
                    <div className="text-xs text-destructive mt-1">{errors.transactionTime}</div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="transactionPurpose">
                    Purpose <span className="text-primary">*</span>
                  </Label>
                  <Textarea
                    name="transactionPurpose"
                    value={form.transactionPurpose}
                    onChange={handleInputChange}
                    required={true}
                    rows={2}
                    placeholder="Describe the purpose of this transaction..."
                  />
                  {errors.transactionPurpose && (
                    <div className="text-xs text-destructive mt-1">{errors.transactionPurpose}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="transactionStatus">
                    Status <span className="text-primary">*</span>
                  </Label>
                  <Select
                    value={form.transactionStatus}
                    onValueChange={(v) => setForm((f) => ({ ...f, transactionStatus: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {TransactionStatusEnum.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.transactionStatus && (
                    <div className="text-xs text-destructive mt-1">{errors.transactionStatus}</div>
                  )}
                </div>
              </div>
              {(showSender || showRecipient) && <hr className="my-6 border-muted-foreground/20" />}
              {showSender && (
                <div className="border p-4 rounded-lg bg-muted/30 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <KeenIcon icon="user" style="duotone" className="text-primary" />
                    <span className="font-semibold">Sender Account</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <KeenIcon
                            icon="information-2"
                            style="outline"
                            className="text-muted-foreground cursor-pointer"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          Fill in sender account details. The account will be created automatically.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {/* Sender selection button and dialog */}
                  {!selectedSenderAccount ? (
                    <>
                      <Button type="button" onClick={() => setSenderDialogOpen(true)}>
                        Select or Create Customer
                      </Button>
                      <AccountSelectionDialog
                        open={senderDialogOpen}
                        onOpenChange={setSenderDialogOpen}
                        onAccountSelected={handleSenderAccountSelected}
                        title="Select Customer & Account"
                        accountType="sender"
                      />
                    </>
                  ) : (
                    <div className="p-2 bg-white rounded border mb-2">
                      <div className="font-medium">
                        Selected Account: {selectedSenderAccount?.name} (
                        {selectedSenderAccount?.number})
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSenderAccount(null);
                          setForm((f) => ({ ...f, senderId: '' }));
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                  {errors.senderId && (
                    <div className="text-xs text-destructive mt-1">{errors.senderId}</div>
                  )}
                </div>
              )}
              {showRecipient && (
                <div className="border p-4 rounded-lg bg-muted/30 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <KeenIcon icon="user" style="duotone" className="text-primary" />
                    <span className="font-semibold">Recipient Account</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <KeenIcon
                            icon="information-2"
                            style="outline"
                            className="text-muted-foreground cursor-pointer"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          Fill in recipient account details. The account will be created
                          automatically.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {/* Recipient selection button and dialog */}
                  {!selectedRecipientAccount ? (
                    <>
                      <Button type="button" onClick={() => setRecipientDialogOpen(true)}>
                        Select or Create Customer
                      </Button>
                      <AccountSelectionDialog
                        open={recipientDialogOpen}
                        onOpenChange={setRecipientDialogOpen}
                        onAccountSelected={handleRecipientAccountSelected}
                        title="Select Customer & Account"
                        accountType="recipient"
                      />
                    </>
                  ) : (
                    <div className="p-2 bg-white rounded border mb-2">
                      <div className="font-medium">
                        Selected Account: {selectedRecipientAccount?.name} (
                        {selectedRecipientAccount?.number})
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedRecipientAccount(null);
                          setForm((f) => ({ ...f, recipientId: '' }));
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                  {errors.recipientId && (
                    <div className="text-xs text-destructive mt-1">{errors.recipientId}</div>
                  )}
                </div>
              )}

              {/* Template Fields Section */}
              {templateFields.length > 0 && (
                <div className="mt-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <KeenIcon icon="document" style="duotone" className="text-primary" />
                      Template Fields
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Additional information based on template requirements. Required fields are
                      marked with <span className="text-primary">*</span>.
                    </p>
                  </div>

                  {templateFields.length > 0 ? (
                    <div className="space-y-6">
                      {/* Regular Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sortFields(templateFields)
                          .filter((field) => field.fieldType !== FieldType.Checkbox)
                          .map((field) => (
                            <div
                              key={field.id}
                              className={cn(
                                'p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors',
                                field.fieldType === FieldType.TextArea ? 'md:col-span-2' : ''
                              )}
                            >
                              {renderDynamicField(field)}
                            </div>
                          ))}
                      </div>

                      {/* Checkbox Fields Section */}
                      {templateFields.some((field) => field.fieldType === FieldType.Checkbox) && (
                        <div className="mt-8 pt-6 border-t">
                          <h4 className="text-lg font-medium mb-4">Additional Options</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sortFields(templateFields)
                              .filter((field) => field.fieldType === FieldType.Checkbox)
                              .map((field) => (
                                <div
                                  key={field.id}
                                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                                >
                                  {renderDynamicField(field)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No additional fields required for this transaction.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading && (
                    <KeenIcon icon="loading" style="duotone" className="animate-spin mr-2" />
                  )}
                  Create Transaction
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateTransactionPage;
