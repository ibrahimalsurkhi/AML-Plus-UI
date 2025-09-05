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
  FieldType,
  type TemplateField,
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
import { recordService, accountService, transactionService, fieldResponseService, type FieldResponseDetail, type FieldResponseCreate } from '@/services/api';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

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
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
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
  // New state for sender dialog
  const [senderDialogOpen, setSenderDialogOpen] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedSenderRecord, setSelectedSenderRecord] = useState<any>(null);
  const [selectedSenderAccount, setSelectedSenderAccount] = useState<any>(null);
  const [senderAccounts, setSenderAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  // Recipient dialog state
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [recipientRecords, setRecipientRecords] = useState<any[]>([]);
  const [recipientRecordsLoading, setRecipientRecordsLoading] = useState(false);
  const [selectedRecipientRecord, setSelectedRecipientRecord] = useState<any>(null);
  const [selectedRecipientAccount, setSelectedRecipientAccount] = useState<any>(null);
  const [recipientAccounts, setRecipientAccounts] = useState<any[]>([]);
  const [recipientAccountsLoading, setRecipientAccountsLoading] = useState(false);
  const [showCreateRecipientAccount, setShowCreateRecipientAccount] = useState(false);
  // Bank countries state
  const [bankCountries, setBankCountries] = useState<any[]>([]);
  const [bankCountriesLoading, setBankCountriesLoading] = useState(false);
  // Currencies state
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  // Template fields state
  const [templateFields, setTemplateFields] = useState<ExtendedTemplateField[]>([]);
  const [templateFieldsLoading, setTemplateFieldsLoading] = useState(false);
  const [fieldResponses, setFieldResponses] = useState<FieldResponseCreate[]>([]);
  // Account template fields state
  const [accountTemplateFields, setAccountTemplateFields] = useState<ExtendedTemplateField[]>([]);
  const [accountTemplateFieldsLoading, setAccountTemplateFieldsLoading] = useState(false);
  const [senderAccountFieldResponses, setSenderAccountFieldResponses] = useState<FieldResponseCreate[]>([]);
  const [recipientAccountFieldResponses, setRecipientAccountFieldResponses] = useState<FieldResponseCreate[]>([]);
  const [senderAccountErrors, setSenderAccountErrors] = useState<Record<string, string>>({});
  const [recipientAccountErrors, setRecipientAccountErrors] = useState<Record<string, string>>({});
  // Account field responses display state
  const [expandedAccounts, setExpandedAccounts] = useState<Record<number, boolean>>({});
  const [accountFieldResponses, setAccountFieldResponses] = useState<Record<number, FieldResponseDetail[]>>({});
  const [loadingAccountResponses, setLoadingAccountResponses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await transactionTypeService.getTransactionTypes({ page: 1, pageSize: 100 });
        setTransactionTypes(res.items);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to fetch transaction types',
          variant: 'destructive'
        });
      }
    };
    fetchTypes();
  }, []);

  // Fetch template fields for template ID 15
  useEffect(() => {
    const fetchTemplateFields = async () => {
      setTemplateFieldsLoading(true);
      try {
        const fieldsResponse = await templateService.getTemplateFields('15');
        // Get all fields from sections and fields without section
        const allFields = [
          ...fieldsResponse.sections.flatMap((section) => section.fields),
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
              const options = await templateService.getFieldOptions('15', field.id!);
              // Ensure all required fields are present and add value
              extendedField.options = options.map((opt) => ({
                ...opt,
                value: opt.label // Add value property while preserving all required fields
              }));
            }

            // Fetch lookup values for Lookup fields
            if (field.fieldType === FieldType.Lookup && field.lookupId) {
              try {
                const lookupValues = await lookupService.getLookupValues(field.lookupId, {
                  pageNumber: 1,
                  pageSize: 100
                });
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
              const ranges = await templateService.getTemplateScoreCriteriaRanges('15', field.id!);
              extendedField.ranges = ranges;
            }

            return extendedField;
          })
        );
        setTemplateFields(fieldsWithOptions);
      } catch (error) {
        console.error('Error fetching template fields:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch template fields. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setTemplateFieldsLoading(false);
      }
    };

    fetchTemplateFields();
  }, []);

  // Fetch account template fields for template ID 13
  useEffect(() => {
    const fetchAccountTemplateFields = async () => {
      setAccountTemplateFieldsLoading(true);
      try {
        const fieldsResponse = await templateService.getTemplateFields('13');
        // Get all fields from sections and fields without section
        const allFields = [
          ...fieldsResponse.sections.flatMap((section) => section.fields),
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
              const options = await templateService.getFieldOptions('13', field.id!);
              extendedField.options = options.map((opt) => ({
                ...opt,
                value: opt.label
              }));
            }

            // Fetch lookup values for Lookup fields
            if (field.fieldType === FieldType.Lookup && field.lookupId) {
              try {
                const lookupValues = await lookupService.getLookupValues(field.lookupId, {
                  pageNumber: 1,
                  pageSize: 100
                });
                extendedField.options = lookupValues.items.map((lookupValue, index) => ({
                  id: lookupValue.id,
                  fieldId: field.id!,
                  label: lookupValue.value,
                  scoreCriteriaId: 0,
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
              const ranges = await templateService.getTemplateScoreCriteriaRanges('13', field.id!);
              extendedField.ranges = ranges;
            }

            return extendedField;
          })
        );
        setAccountTemplateFields(fieldsWithOptions);
      } catch (error) {
        console.error('Error fetching account template fields:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch account template fields. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setAccountTemplateFieldsLoading(false);
      }
    };

    fetchAccountTemplateFields();
  }, []);

  // Fetch bank countries from lookup service
  useEffect(() => {
    const fetchBankCountries = async () => {
      setBankCountriesLoading(true);
      try {
        const lookup = await lookupService.getLookupById(4);
        const values = await lookupService.getLookupValues(4, { pageNumber: 1, pageSize: 100 });
        setBankCountries(values.items);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to fetch bank countries',
          variant: 'destructive'
        });
      } finally {
        setBankCountriesLoading(false);
      }
    };
    fetchBankCountries();
  }, []);

  // Fetch currencies from lookup service
  useEffect(() => {
    const fetchCurrencies = async () => {
      setCurrenciesLoading(true);
      try {
        const lookup = await lookupService.getLookupById(2);
        const values = await lookupService.getLookupValues(2, { pageNumber: 1, pageSize: 100 });
        setCurrencies(values.items);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to fetch currencies',
          variant: 'destructive'
        });
      } finally {
        setCurrenciesLoading(false);
      }
    };
    fetchCurrencies();
  }, []);

  // Fetch records for dialog
  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const res = await recordService.getRecords({ pageNumber: 1, pageSize: 10 });
      setRecords(res.items);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' });
    } finally {
      setRecordsLoading(false);
    }
  };

  // Fetch accounts for selected record
  useEffect(() => {
    if (selectedSenderRecord) {
      setAccountsLoading(true);
      accountService
        .getAccountsByRecordId(selectedSenderRecord.id)
        .then((accounts) => setSenderAccounts(accounts))
        .catch(() =>
          toast({ title: 'Error', description: 'Failed to fetch accounts', variant: 'destructive' })
        )
        .finally(() => setAccountsLoading(false));
    } else {
      setSenderAccounts([]);
      setSelectedSenderAccount(null);
    }
  }, [selectedSenderRecord]);

  // Fetch recipient records for dialog
  const fetchRecipientRecords = async () => {
    console.log('Fetching recipient records...');
    setRecipientRecordsLoading(true);
    try {
      const res = await recordService.getRecords({ pageNumber: 1, pageSize: 10 });
      console.log('Recipient records fetched:', res.items);
      setRecipientRecords(res.items);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' });
    } finally {
      setRecipientRecordsLoading(false);
    }
  };

  // Fetch accounts for selected recipient record
  useEffect(() => {
    if (selectedRecipientRecord) {
      console.log('Selected recipient record:', selectedRecipientRecord);
      setRecipientAccountsLoading(true);
      accountService
        .getAccountsByRecordId(selectedRecipientRecord.id)
        .then((accounts) => {
          console.log('Recipient accounts loaded:', accounts);
          setRecipientAccounts(accounts);
        })
        .catch(() =>
          toast({ title: 'Error', description: 'Failed to fetch accounts', variant: 'destructive' })
        )
        .finally(() => setRecipientAccountsLoading(false));
    } else {
      console.log('No recipient record selected, clearing accounts');
      setRecipientAccounts([]);
      setSelectedRecipientAccount(null);
    }
  }, [selectedRecipientRecord]);

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

  // Update form state when accounts are selected
  useEffect(() => {
    if (selectedSenderAccount) {
      setForm((f) => ({ ...f, senderId: selectedSenderAccount.id }));
    }
    if (selectedRecipientAccount) {
      setForm((f) => ({ ...f, recipientId: selectedRecipientAccount.id }));
    }
  }, [selectedSenderAccount, selectedRecipientAccount]);

  const handleTypeChange = (id: string) => {
    setForm((f) => ({ ...f, transactionTypeId: id }));
    const type = transactionTypes.find((t) => t.id.toString() === id);
    setShowSender(type?.isSenderRequired);
    setShowRecipient(type?.isRecipientRequired);
    setStep(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err: any) => ({ ...err, [name]: undefined }));
  };

  const handleCreateAccount = async (type: 'sender' | 'recipient') => {
    if (type === 'sender') {
      setCreatingSender(true);
      try {
        const res = await accountService.createAccount(senderAccount);
        setForm((f) => ({ ...f, senderId: String(res.id) }));
        toast({ title: 'Success', description: 'Sender account created' });
        setStep(2);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to create sender account',
          variant: 'destructive'
        });
      } finally {
        setCreatingSender(false);
      }
    } else {
      setCreatingRecipient(true);
      try {
        const res = await accountService.createAccount(recipientAccount);
        setForm((f) => ({ ...f, recipientId: String(res.id) }));
        toast({ title: 'Success', description: 'Recipient account created' });
        setStep(3);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to create recipient account',
          variant: 'destructive'
        });
      } finally {
        setCreatingRecipient(false);
      }
    }
  };

  const handleAccountInput = (
    type: 'sender' | 'recipient',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (type === 'sender') {
      setSenderAccount((a: Record<string, any>) => ({ ...a, [name]: value }));
    } else {
      setRecipientAccount((a: Record<string, any>) => ({ ...a, [name]: value }));
    }
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
    console.log('Recipient accounts list:', recipientAccounts);

    if (!validate()) {
      console.log('Validation failed, returning early');
      return;
    }
    console.log('Validation passed, proceeding with transaction creation');
    setLoading(true);
    try {
      let senderId =
        form.senderId || (selectedSenderAccount?.id ? String(selectedSenderAccount.id) : undefined);
      let recipientId =
        form.recipientId ||
        (selectedRecipientAccount?.id ? String(selectedRecipientAccount.id) : undefined);

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

        console.log('Creating transaction with field responses included:', transactionDataWithFields);
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
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to create transaction',
        variant: 'destructive'
      });
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

  // Handle account field value changes
  const handleAccountFieldChange = (fieldId: number, value: any, fieldType: FieldType, accountType: 'sender' | 'recipient') => {
    const setFieldResponses = accountType === 'sender' ? setSenderAccountFieldResponses : setRecipientAccountFieldResponses;
    
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
          const field = accountTemplateFields.find((f) => f.id === fieldId);
          const matchingRange = field?.ranges?.find(
            (range) =>
              numericValue !== null &&
              numericValue >= range.minValue &&
              numericValue <= range.maxValue
          );

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
          const fieldWithOptions = accountTemplateFields.find((f) => f.id === fieldId);
          let selectedOption;

          if (fieldType === FieldType.Checkbox) {
            selectedOption = fieldWithOptions?.options?.find(
              (opt) => opt.label.toLowerCase() === (value === true ? 'checked' : 'unchecked')
            );
            if (!selectedOption && fieldWithOptions?.options?.[0]) {
              selectedOption = fieldWithOptions.options[0];
            }
          } else {
            selectedOption = fieldWithOptions?.options?.find(
              (opt) => opt.id && opt.id.toString() === value
            );
          }

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

  // Render account dynamic form field based on field type
  const renderAccountDynamicField = (field: ExtendedTemplateField, accountType: 'sender' | 'recipient') => {
    const fieldName = `account_field_${field.id}`;
    const fieldResponses = accountType === 'sender' ? senderAccountFieldResponses : recipientAccountFieldResponses;
    const currentResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
    const fieldValue = currentResponse
      ? field.fieldType === FieldType.Number
        ? currentResponse.valueNumber
        : field.fieldType === FieldType.Date
          ? currentResponse.valueDate
          : field.fieldType === FieldType.Checkbox
            ? currentResponse.optionId === currentResponse.optionId
            : field.fieldType === FieldType.Dropdown ||
                field.fieldType === FieldType.Radio ||
                field.fieldType === FieldType.Lookup
              ? currentResponse.optionId
              : currentResponse.valueText
      : '';

    const fieldErrors = accountType === 'sender' ? senderAccountErrors : recipientAccountErrors;
    const fieldErrorKey = `field_${field.id}`;
    const fieldError = fieldErrors[fieldErrorKey];
    const isInvalid = !!fieldError;

    const fieldWrapperClasses = cn(
      'space-y-2',
      field.fieldType === FieldType.Checkbox ? 'flex items-start space-x-2' : '',
      field.fieldType === FieldType.Radio ? 'space-y-3' : ''
    );

    const inputClasses = cn(
      'w-full', 
      field.fieldType === FieldType.Checkbox ? 'mt-1' : '',
      isInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''
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
                value={(fieldValue as string) || ''}
                onChange={(e) => handleAccountFieldChange(field.id!, e.target.value, field.fieldType, accountType)}
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
              />
            ) : (
              <Textarea
                id={fieldName}
                value={(fieldValue as string) || ''}
                onChange={(e) => handleAccountFieldChange(field.id!, e.target.value, field.fieldType, accountType)}
                className={inputClasses}
                placeholder={field.placeholder}
                minLength={field.minLength || undefined}
                maxLength={field.maxLength || undefined}
                rows={4}
              />
            )}
            {fieldError && <p className="text-sm text-red-500 mt-1">{fieldError}</p>}
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
              onChange={(e) => handleAccountFieldChange(field.id!, e.target.value, field.fieldType, accountType)}
              className={inputClasses}
              placeholder={field.placeholder}
              min={min !== undefined ? min : field.minValue || undefined}
              max={max !== undefined ? max : field.maxValue || undefined}
              step="any"
            />
            {fieldError && <p className="text-sm text-red-500 mt-1">{fieldError}</p>}
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
              onChange={(e) => handleAccountFieldChange(field.id!, e.target.value, field.fieldType, accountType)}
              className={inputClasses}
              min={field.minDate || undefined}
              max={field.maxDate || undefined}
            />
            {fieldError && <p className="text-sm text-red-500 mt-1">{fieldError}</p>}
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
                  handleAccountFieldChange(field.id!, checked, field.fieldType, accountType);
                }}
                className={cn('mt-1', inputClasses)}
              />
              <div className="space-y-1">
                {renderFieldLabel(field, fieldName)}
                {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
              </div>
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
                handleAccountFieldChange(field.id!, value, field.fieldType, accountType);
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
                handleAccountFieldChange(field.id!, value, field.fieldType, accountType);
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
                          handleAccountFieldChange(field.id!, e.target.value, field.fieldType, accountType);
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

  // Render dynamic form field based on field type
  const renderDynamicField = (field: ExtendedTemplateField) => {
    const fieldName = `field_${field.id}`;
    const currentResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
    const fieldValue = currentResponse
      ? field.fieldType === FieldType.Number
        ? currentResponse.valueNumber
        : field.fieldType === FieldType.Date
          ? currentResponse.valueDate
          : field.fieldType === FieldType.Checkbox
            ? currentResponse.optionId === currentResponse.optionId
            : field.fieldType === FieldType.Dropdown ||
                field.fieldType === FieldType.Radio ||
                field.fieldType === FieldType.Lookup
              ? currentResponse.optionId
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

  // Validate account creation
  const validateAccountCreation = (accountData: any, fieldResponses: any[], accountType: 'sender' | 'recipient') => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    // Validate static fields
    if (!accountData.name?.trim()) {
      errors.push('Account name is required');
      fieldErrors['name'] = 'Account name is required';
    }
    if (!accountData.number?.trim()) {
      errors.push('Account number is required');
      fieldErrors['number'] = 'Account number is required';
    }
    if (!accountData.bankOfCountryId) {
      errors.push('Bank country is required');
      fieldErrors['bankOfCountryId'] = 'Bank country is required';
    }
    if (!accountData.bankOfCity?.trim()) {
      errors.push('Bank city is required');
      fieldErrors['bankOfCity'] = 'Bank city is required';
    }
    if (!accountData.creationDate) {
      errors.push('Creation date is required');
      fieldErrors['creationDate'] = 'Creation date is required';
    }
    if (!accountData.accountStatus) {
      errors.push('Account status is required');
      fieldErrors['accountStatus'] = 'Account status is required';
    }

    // Validate dynamic template fields
    accountTemplateFields.forEach((field) => {
      const fieldKey = `field_${field.id}`;
      
      if (field.isRequired) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
        
        if (!fieldResponse) {
          errors.push(`${field.label} is required`);
          fieldErrors[fieldKey] = `${field.label} is required`;
          return;
        }

        // Check if the field has a value based on its type
        let hasValue = false;
        switch (field.fieldType) {
          case FieldType.Text:
          case FieldType.TextArea:
            hasValue = fieldResponse.valueText && fieldResponse.valueText.trim() !== '';
            break;
          case FieldType.Number:
            hasValue = fieldResponse.valueNumber !== null && fieldResponse.valueNumber !== undefined;
            break;
          case FieldType.Date:
            hasValue = fieldResponse.valueDate && fieldResponse.valueDate.trim() !== '';
            break;
          case FieldType.Dropdown:
          case FieldType.Radio:
          case FieldType.Lookup:
            hasValue = fieldResponse.optionId && fieldResponse.optionId.trim() !== '';
            break;
          case FieldType.Checkbox:
            // Checkbox is considered valid if it has an optionId (checked or unchecked)
            hasValue = fieldResponse.optionId && fieldResponse.optionId.trim() !== '';
            break;
        }

        if (!hasValue) {
          errors.push(`${field.label} is required`);
          fieldErrors[fieldKey] = `${field.label} is required`;
        }
      }

      // Validate number field ranges
      if (field.fieldType === FieldType.Number && field.ranges) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
        if (fieldResponse && fieldResponse.valueNumber !== null && fieldResponse.valueNumber !== undefined) {
          const { min, max } = getRangeBounds(field.ranges);
          const value = fieldResponse.valueNumber;
          
          if (min !== undefined && value < min) {
            const errorMsg = `${field.label} must be at least ${min}`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
          if (max !== undefined && value > max) {
            const errorMsg = `${field.label} must be at most ${max}`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
        }
      }

      // Validate text field length constraints
      if ((field.fieldType === FieldType.Text || field.fieldType === FieldType.TextArea)) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
        if (fieldResponse && fieldResponse.valueText) {
          const textLength = fieldResponse.valueText.length;
          
          if (field.minLength && textLength < field.minLength) {
            const errorMsg = `${field.label} must be at least ${field.minLength} characters`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
          if (field.maxLength && textLength > field.maxLength) {
            const errorMsg = `${field.label} must be at most ${field.maxLength} characters`;
            errors.push(errorMsg);
            fieldErrors[fieldKey] = errorMsg;
          }
        }
      }

      // Validate date field constraints
      if (field.fieldType === FieldType.Date) {
        const fieldResponse = fieldResponses.find((fr) => fr.fieldId === field.id);
        if (fieldResponse && fieldResponse.valueDate) {
          const fieldDate = new Date(fieldResponse.valueDate);
          
          if (field.minDate) {
            const minDate = new Date(field.minDate);
            if (fieldDate < minDate) {
              const errorMsg = `${field.label} must be on or after ${field.minDate}`;
              errors.push(errorMsg);
              fieldErrors[fieldKey] = errorMsg;
            }
          }
          if (field.maxDate) {
            const maxDate = new Date(field.maxDate);
            if (fieldDate > maxDate) {
              const errorMsg = `${field.label} must be on or before ${field.maxDate}`;
              errors.push(errorMsg);
              fieldErrors[fieldKey] = errorMsg;
            }
          }
        }
      }
    });

    // Update error state
    if (accountType === 'sender') {
      setSenderAccountErrors(fieldErrors);
    } else {
      setRecipientAccountErrors(fieldErrors);
    }

    return errors;
  };

  // Function to toggle account expansion and fetch field responses
  const toggleAccountExpansion = async (accountId: number) => {
    const isCurrentlyExpanded = expandedAccounts[accountId];
    
    // Toggle expansion state
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !isCurrentlyExpanded
    }));

    // If expanding and we don't have data yet, fetch it
    if (!isCurrentlyExpanded && !accountFieldResponses[accountId]) {
      setLoadingAccountResponses(prev => ({ ...prev, [accountId]: true }));
      
      try {
        const responses = await fieldResponseService.getFieldResponses({ accountId });
        setAccountFieldResponses(prev => ({
          ...prev,
          [accountId]: responses
        }));
      } catch (error) {
        console.error('Error fetching account field responses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load account field responses',
          variant: 'destructive'
        });
      } finally {
        setLoadingAccountResponses(prev => ({ ...prev, [accountId]: false }));
      }
    }
  };

  // Function to render field response value
  const renderFieldResponseValue = (response: FieldResponseDetail) => {
    if (response.valueText) return response.valueText;
    if (response.valueNumber !== null) return response.valueNumber.toString();
    if (response.valueDate) return new Date(response.valueDate).toLocaleDateString();
    if (response.optionValue) return response.optionValue;
    return '-';
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
                      {currenciesLoading ? (
                        <div className="p-4 text-center">Loading currencies...</div>
                      ) : (
                        currencies.map((currency) => (
                          <SelectItem key={currency.id} value={String(currency.id)}>
                            {currency.value}
                          </SelectItem>
                        ))
                      )}
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
                      <Button
                        type="button"
                        onClick={() => {
                          // Reset sender modal state
                          setSelectedSenderRecord(null);
                          setSelectedSenderAccount(null);
                          setSenderAccounts([]);
                          setShowCreateAccount(false);
                          setSenderAccount({});
                          setSenderAccountFieldResponses([]);
                          setSenderAccountErrors({});
                          // Reset expansion state
                          setExpandedAccounts({});
                          setAccountFieldResponses({});
                          setLoadingAccountResponses({});
                          
                          setSenderDialogOpen(true);
                          fetchRecords();
                        }}
                      >
                        Select or Create Customer
                      </Button>
                      <Dialog 
                        open={senderDialogOpen} 
                        onOpenChange={(open) => {
                          setSenderDialogOpen(open);
                          if (!open) {
                            // Reset state when modal is closed
                            setSelectedSenderRecord(null);
                            setSelectedSenderAccount(null);
                            setSenderAccounts([]);
                            setShowCreateAccount(false);
                            setSenderAccount({});
                            setSenderAccountFieldResponses([]);
                            setSenderAccountErrors({});
                            // Reset expansion state
                            setExpandedAccounts({});
                            setAccountFieldResponses({});
                            setLoadingAccountResponses({});
                          }
                        }}
                      >
                        <DialogContent className="max-w-4xl w-full">
                          <DialogHeader>
                            <DialogTitle>Select Customer & Account</DialogTitle>
                          </DialogHeader>
                          <DialogBody>
                            {/* Step 1: Select Record */}
                            {!selectedSenderRecord &&
                              (recordsLoading ? (
                                <div className="p-4 text-center">Loading...</div>
                              ) : (
                                <div className="overflow-x-auto mb-6">
                                  <table className="min-w-full border text-sm">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="border px-3 py-2 text-left">Select</th>
                                        <th className="border px-3 py-2 text-left">ID</th>
                                        <th className="border px-3 py-2 text-left">Name</th>
                                        <th className="border px-3 py-2 text-left">DOB</th>
                                        <th className="border px-3 py-2 text-left">
                                          Identification
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {records.map((rec) => (
                                        <tr key={rec.id}>
                                          <td className="border px-3 py-2">
                                            <input
                                              type="radio"
                                              name="senderRecord"
                                              checked={selectedSenderRecord?.id === rec.id}
                                              onChange={() => setSelectedSenderRecord(rec)}
                                            />
                                          </td>
                                          <td className="border px-3 py-2">{rec.id}</td>
                                          <td className="border px-3 py-2">
                                            {rec.firstName} {rec.lastName}
                                          </td>
                                          <td className="border px-3 py-2">{rec.dateOfBirth}</td>
                                          <td className="border px-3 py-2">{rec.identification}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            {/* Step 2: Show selected record info and accounts */}
                            {selectedSenderRecord && (
                              <>
                                <div className="mb-4 p-3 rounded border bg-white flex flex-col md:flex-row md:items-center md:gap-8">
                                  <div>
                                    <div className="font-semibold">
                                      {selectedSenderRecord.firstName}{' '}
                                      {selectedSenderRecord.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {selectedSenderRecord.id} | Identification:{' '}
                                      {selectedSenderRecord.identification}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      DOB: {selectedSenderRecord.dateOfBirth}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedSenderRecord(null)}
                                  >
                                    Change Customer
                                  </Button>
                                </div>
                                <div className="mb-2 font-medium">Select Account</div>
                                {accountsLoading ? (
                                  <div className="p-4 text-center">Loading accounts...</div>
                                ) : (
                                  <div className="overflow-x-auto mb-4">
                                    <table className="min-w-full border text-sm">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border px-3 py-2 text-left">Select</th>
                                          <th className="border px-3 py-2 text-left">Name</th>
                                          <th className="border px-3 py-2 text-left">Number</th>
                                          <th className="border px-3 py-2 text-left">Bank</th>
                                          <th className="border px-3 py-2 text-left">City</th>
                                          <th className="border px-3 py-2 text-left">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {senderAccounts.map((acc) => (
                                          <React.Fragment key={acc.id}>
                                            <tr>
                                              <td className="border px-3 py-2">
                                                <input
                                                  type="radio"
                                                  name="senderAccount"
                                                  checked={selectedSenderAccount?.id === acc.id}
                                                  onChange={() => {
                                                    console.log('Selecting sender account:', acc);
                                                    setSelectedSenderAccount(acc);
                                                  }}
                                                />
                                              </td>
                                              <td className="border px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleAccountExpansion(acc.id)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                  >
                                                    {expandedAccounts[acc.id] ? (
                                                      <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                      <ChevronRight className="h-4 w-4" />
                                                    )}
                                                  </button>
                                                  {acc.name}
                                                </div>
                                              </td>
                                              <td className="border px-3 py-2">{acc.number}</td>
                                              <td className="border px-3 py-2">
                                                {acc.bankOfCountryName}
                                              </td>
                                              <td className="border px-3 py-2">{acc.bankOfCity}</td>
                                              <td className="border px-3 py-2">
                                                {acc.accountStatus}
                                              </td>
                                            </tr>
                                            {expandedAccounts[acc.id] && (
                                              <tr>
                                                <td colSpan={6} className="border px-3 py-2 bg-gray-50">
                                                  {loadingAccountResponses[acc.id] ? (
                                                    <div className="flex items-center justify-center py-4">
                                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                      <span className="ml-2 text-sm text-muted-foreground">Loading field responses...</span>
                                                    </div>
                                                  ) : accountFieldResponses[acc.id] && accountFieldResponses[acc.id].length > 0 ? (
                                                    <div className="space-y-2">
                                                      <h4 className="font-medium text-sm">Account Field Responses:</h4>
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {accountFieldResponses[acc.id].map((response) => (
                                                          <div key={response.id} className="bg-white p-3 rounded border">
                                                            <div className="text-sm font-medium text-gray-700">
                                                              {response.fieldName}
                                                            </div>
                                                            <div className="text-sm text-gray-900 mt-1">
                                                              {renderFieldResponseValue(response)}
                                                            </div>
                                                            {response.created && (
                                                              <div className="text-xs text-gray-500 mt-1">
                                                                Created: {new Date(response.created).toLocaleDateString()}
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="text-sm text-gray-500 py-2">
                                                      No field responses found for this account.
                                                    </div>
                                                  )}
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCreateAccount((v) => !v)}
                                >
                                  {showCreateAccount ? 'Hide' : 'Create New Account'}
                                </Button>
                                {showCreateAccount && (
                                  <div className="mt-4 p-4 border rounded bg-muted/10">
                                    {/* Inline account creation form (reuse your previous form fields) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <Input
                                        name="name"
                                        placeholder="Name"
                                        onChange={(e) =>
                                          setSenderAccount((a: any) => ({
                                            ...a,
                                            name: e.target.value
                                          }))
                                        }
                                        autoComplete="off"
                                      />
                                      <Input
                                        name="number"
                                        placeholder="Account Number"
                                        onChange={(e) =>
                                          setSenderAccount((a: any) => ({
                                            ...a,
                                            number: e.target.value
                                          }))
                                        }
                                        autoComplete="off"
                                      />
                                      <Select
                                        value={String(senderAccount.bankOfCountryId || '')}
                                        onValueChange={(v) =>
                                          setSenderAccount((a: any) => ({
                                            ...a,
                                            bankOfCountryId: v
                                          }))
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Bank Of Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {bankCountriesLoading ? (
                                            <div className="p-4 text-center">
                                              Loading countries...
                                            </div>
                                          ) : (
                                            bankCountries.map((country) => (
                                              <SelectItem
                                                key={country.id}
                                                value={String(country.id)}
                                              >
                                                {country.value}
                                              </SelectItem>
                                            ))
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        name="bankOfCity"
                                        placeholder="Bank Of City"
                                        onChange={(e) =>
                                          setSenderAccount((a: any) => ({
                                            ...a,
                                            bankOfCity: e.target.value
                                          }))
                                        }
                                        autoComplete="off"
                                      />
                                      <Input
                                        name="creationDate"
                                        placeholder="Creation Date"
                                        type="datetime-local"
                                        onChange={(e) =>
                                          setSenderAccount((a: any) => ({
                                            ...a,
                                            creationDate: e.target.value
                                          }))
                                        }
                                      />
                                      <Select
                                        value={String(senderAccount.accountStatus || '')}
                                        onValueChange={(v) =>
                                          setSenderAccount((a: any) => ({
                                            ...a,
                                            accountStatus: Number(v)
                                          }))
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Account Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {AccountStatusEnum.map((opt) => (
                                            <SelectItem key={opt.value} value={String(opt.value)}>
                                              {opt.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Dynamic Template Fields for Account */}
                                    {accountTemplateFields.length > 0 && (
                                      <div className="mt-6 pt-4 border-t">
                                        <h4 className="text-md font-medium mb-3 text-muted-foreground">
                                          Additional Account Information
                                        </h4>
                                        {accountTemplateFieldsLoading ? (
                                          <div className="flex items-center justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            <span className="ml-2 text-sm text-muted-foreground">Loading fields...</span>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sortFields(accountTemplateFields)
                                              .filter((field) => field.fieldType !== FieldType.Checkbox)
                                              .map((field) => (
                                                <div
                                                  key={field.id}
                                                  className={cn(
                                                    'p-3 rounded border bg-gray-50/50',
                                                    field.fieldType === FieldType.TextArea ? 'md:col-span-2' : ''
                                                  )}
                                                >
                                                  {renderAccountDynamicField(field, 'sender')}
                                                </div>
                                              ))}
                                          </div>
                                        )}

                                        {/* Checkbox fields for account template */}
                                        {accountTemplateFields.some((field) => field.fieldType === FieldType.Checkbox) && (
                                          <div className="mt-4 pt-3 border-t">
                                            <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                                              Account Options
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {sortFields(accountTemplateFields)
                                                .filter((field) => field.fieldType === FieldType.Checkbox)
                                                .map((field) => (
                                                  <div key={field.id} className="p-2 rounded border bg-gray-50/30">
                                                    {renderAccountDynamicField(field, 'sender')}
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <Button
                                      type="button"
                                      size="sm"
                                      className="mt-4"
                                      onClick={async () => {
                                        // Clear previous errors
                                        setSenderAccountErrors({});
                                        
                                        // Validate before creating account
                                        const validationErrors = validateAccountCreation(
                                          senderAccount,
                                          senderAccountFieldResponses,
                                          'sender'
                                        );

                                        if (validationErrors.length > 0) {
                                          toast({
                                            title: 'Validation Error',
                                            description: validationErrors[0], // Show first error
                                            variant: 'destructive'
                                          });
                                          return;
                                        }

                                        setAccountsLoading(true);
                                        try {
                                          const accountData = {
                                            ...senderAccount,
                                            recordId: selectedSenderRecord.id,
                                            templateId: 13,
                                            fieldResponses: senderAccountFieldResponses
                                          };
                                          const res =
                                            await accountService.createAccount(accountData);
                                          setSenderAccounts((prev: any[]) => [
                                            ...prev,
                                            { ...senderAccount, id: res.id }
                                          ]);
                                          setShowCreateAccount(false);
                                          setSenderAccount({});
                                          setSenderAccountFieldResponses([]);
                                          toast({
                                            title: 'Success',
                                            description: 'Account created successfully'
                                          });
                                          // After account creation, select it and close the dialog
                                          setSelectedSenderAccount({
                                            ...senderAccount,
                                            id: res.id
                                          });
                                          setForm((f) => ({ ...f, senderId: res.id }));
                                          setSenderDialogOpen(false);
                                        } catch (error: any) {
                                          console.error('Error creating sender account:', error);
                                          toast({
                                            title: 'Error',
                                            description: error?.response?.data?.message || 'Failed to create account',
                                            variant: 'destructive'
                                          });
                                        } finally {
                                          setAccountsLoading(false);
                                        }
                                      }}
                                    >
                                      Create Account
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </DialogBody>
                          <DialogFooter>
                            <Button
                              type="button"
                              onClick={() => {
                                console.log(
                                  'Done button clicked. selectedSenderAccount:',
                                  selectedSenderAccount
                                );
                                if (selectedSenderAccount) {
                                  console.log(
                                    'Setting form senderId to:',
                                    selectedSenderAccount.id
                                  );
                                  setForm((f) => ({ ...f, senderId: selectedSenderAccount.id }));
                                  setSenderDialogOpen(false);
                                } else {
                                  console.log('No sender account selected');
                                  toast({
                                    title: 'Select an account',
                                    description: 'Please select an account before continuing.',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              Done
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate('/records/new')}
                            >
                              Create New Customer
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
                      <Button
                        type="button"
                        onClick={() => {
                          console.log('Opening recipient dialog...');
                          // Reset recipient modal state
                          setSelectedRecipientRecord(null);
                          setSelectedRecipientAccount(null);
                          setRecipientAccounts([]);
                          setShowCreateRecipientAccount(false);
                          setRecipientAccount({});
                          setRecipientAccountFieldResponses([]);
                          setRecipientAccountErrors({});
                          // Reset expansion state
                          setExpandedAccounts({});
                          setAccountFieldResponses({});
                          setLoadingAccountResponses({});
                          
                          setRecipientDialogOpen(true);
                          fetchRecipientRecords();
                        }}
                      >
                        Select or Create Customer
                      </Button>
                      <Dialog 
                        open={recipientDialogOpen} 
                        onOpenChange={(open) => {
                          setRecipientDialogOpen(open);
                          if (!open) {
                            // Reset state when modal is closed
                            setSelectedRecipientRecord(null);
                            setSelectedRecipientAccount(null);
                            setRecipientAccounts([]);
                            setShowCreateRecipientAccount(false);
                            setRecipientAccount({});
                            setRecipientAccountFieldResponses([]);
                            setRecipientAccountErrors({});
                            // Reset expansion state
                            setExpandedAccounts({});
                            setAccountFieldResponses({});
                            setLoadingAccountResponses({});
                          }
                        }}
                      >
                        <DialogContent className="max-w-4xl w-full">
                          <DialogHeader>
                            <DialogTitle>Select Customer & Account</DialogTitle>
                          </DialogHeader>
                          <DialogBody>
                            {/* Step 1: Select Record */}
                            {!selectedRecipientRecord &&
                              (recipientRecordsLoading ? (
                                <div className="p-4 text-center">Loading...</div>
                              ) : (
                                <div className="overflow-x-auto mb-6">
                                  <table className="min-w-full border text-sm">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="border px-3 py-2 text-left">Select</th>
                                        <th className="border px-3 py-2 text-left">ID</th>
                                        <th className="border px-3 py-2 text-left">Name</th>
                                        <th className="border px-3 py-2 text-left">DOB</th>
                                        <th className="border px-3 py-2 text-left">
                                          Identification
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {recipientRecords.map((rec) => (
                                        <tr key={rec.id}>
                                          <td className="border px-3 py-2">
                                            <input
                                              type="radio"
                                              name="recipientRecord"
                                              checked={selectedRecipientRecord?.id === rec.id}
                                              onChange={() => setSelectedRecipientRecord(rec)}
                                            />
                                          </td>
                                          <td className="border px-3 py-2">{rec.id}</td>
                                          <td className="border px-3 py-2">
                                            {rec.firstName} {rec.lastName}
                                          </td>
                                          <td className="border px-3 py-2">{rec.dateOfBirth}</td>
                                          <td className="border px-3 py-2">{rec.identification}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            {/* Step 2: Show selected record info and accounts */}
                            {selectedRecipientRecord && (
                              <>
                                <div className="mb-4 p-3 rounded border bg-white flex flex-col md:flex-row md:items-center md:gap-8">
                                  <div>
                                    <div className="font-semibold">
                                      {selectedRecipientRecord.firstName}{' '}
                                      {selectedRecipientRecord.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {selectedRecipientRecord.id} | Identification:{' '}
                                      {selectedRecipientRecord.identification}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      DOB: {selectedRecipientRecord.dateOfBirth}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedRecipientRecord(null)}
                                  >
                                    Change Customer
                                  </Button>
                                </div>
                                <div className="mb-2 font-medium">Select Account</div>
                                {recipientAccountsLoading ? (
                                  <div className="p-4 text-center">Loading accounts...</div>
                                ) : (
                                  <div className="overflow-x-auto mb-4">
                                    <table className="min-w-full border text-sm">
                                      <thead>
                                        <tr className="bg-gray-50">
                                          <th className="border px-3 py-2 text-left">Select</th>
                                          <th className="border px-3 py-2 text-left">Name</th>
                                          <th className="border px-3 py-2 text-left">Number</th>
                                          <th className="border px-3 py-2 text-left">Bank</th>
                                          <th className="border px-3 py-2 text-left">City</th>
                                          <th className="border px-3 py-2 text-left">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {recipientAccounts.map((acc) => (
                                          <React.Fragment key={acc.id}>
                                            <tr>
                                              <td className="border px-3 py-2">
                                                <input
                                                  type="radio"
                                                  name="recipientAccount"
                                                  checked={selectedRecipientAccount?.id === acc.id}
                                                  onChange={() => {
                                                    console.log('Selecting recipient account:', acc);
                                                    setSelectedRecipientAccount(acc);
                                                  }}
                                                />
                                              </td>
                                              <td className="border px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleAccountExpansion(acc.id)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                  >
                                                    {expandedAccounts[acc.id] ? (
                                                      <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                      <ChevronRight className="h-4 w-4" />
                                                    )}
                                                  </button>
                                                  {acc.name}
                                                </div>
                                              </td>
                                              <td className="border px-3 py-2">{acc.number}</td>
                                              <td className="border px-3 py-2">
                                                {acc.bankOfCountryName}
                                              </td>
                                              <td className="border px-3 py-2">{acc.bankOfCity}</td>
                                              <td className="border px-3 py-2">
                                                {acc.accountStatus}
                                              </td>
                                            </tr>
                                            {expandedAccounts[acc.id] && (
                                              <tr>
                                                <td colSpan={6} className="border px-3 py-2 bg-gray-50">
                                                  {loadingAccountResponses[acc.id] ? (
                                                    <div className="flex items-center justify-center py-4">
                                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                      <span className="ml-2 text-sm text-muted-foreground">Loading field responses...</span>
                                                    </div>
                                                  ) : accountFieldResponses[acc.id] && accountFieldResponses[acc.id].length > 0 ? (
                                                    <div className="space-y-2">
                                                      <h4 className="font-medium text-sm">Account Field Responses:</h4>
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {accountFieldResponses[acc.id].map((response) => (
                                                          <div key={response.id} className="bg-white p-3 rounded border">
                                                            <div className="text-sm font-medium text-gray-700">
                                                              {response.fieldName}
                                                            </div>
                                                            <div className="text-sm text-gray-900 mt-1">
                                                              {renderFieldResponseValue(response)}
                                                            </div>
                                                            {response.created && (
                                                              <div className="text-xs text-gray-500 mt-1">
                                                                Created: {new Date(response.created).toLocaleDateString()}
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="text-sm text-gray-500 py-2">
                                                      No field responses found for this account.
                                                    </div>
                                                  )}
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCreateRecipientAccount((v) => !v)}
                                >
                                  {showCreateRecipientAccount ? 'Hide' : 'Create New Account'}
                                </Button>
                                {showCreateRecipientAccount && (
                                  <div className="mt-4 p-4 border rounded bg-muted/10">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <Input
                                        name="name"
                                        placeholder="Name"
                                        onChange={(e) =>
                                          setRecipientAccount((a: any) => ({
                                            ...a,
                                            name: e.target.value
                                          }))
                                        }
                                        autoComplete="off"
                                      />
                                      <Input
                                        name="number"
                                        placeholder="Account Number"
                                        onChange={(e) =>
                                          setRecipientAccount((a: any) => ({
                                            ...a,
                                            number: e.target.value
                                          }))
                                        }
                                        autoComplete="off"
                                      />
                                      <Select
                                        value={String(recipientAccount.bankOfCountryId || '')}
                                        onValueChange={(v) =>
                                          setRecipientAccount((a: any) => ({
                                            ...a,
                                            bankOfCountryId: v
                                          }))
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Bank Of Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {bankCountriesLoading ? (
                                            <div className="p-4 text-center">
                                              Loading countries...
                                            </div>
                                          ) : (
                                            bankCountries.map((country) => (
                                              <SelectItem
                                                key={country.id}
                                                value={String(country.id)}
                                              >
                                                {country.value}
                                              </SelectItem>
                                            ))
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        name="bankOfCity"
                                        placeholder="Bank Of City"
                                        onChange={(e) =>
                                          setRecipientAccount((a: any) => ({
                                            ...a,
                                            bankOfCity: e.target.value
                                          }))
                                        }
                                        autoComplete="off"
                                      />
                                      <Input
                                        name="creationDate"
                                        placeholder="Creation Date"
                                        type="datetime-local"
                                        onChange={(e) =>
                                          setRecipientAccount((a: any) => ({
                                            ...a,
                                            creationDate: e.target.value
                                          }))
                                        }
                                      />
                                      <Select
                                        value={String(recipientAccount.accountStatus || '')}
                                        onValueChange={(v) =>
                                          setRecipientAccount((a: any) => ({
                                            ...a,
                                            accountStatus: Number(v)
                                          }))
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Account Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {AccountStatusEnum.map((opt) => (
                                            <SelectItem key={opt.value} value={String(opt.value)}>
                                              {opt.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Dynamic Template Fields for Recipient Account */}
                                    {accountTemplateFields.length > 0 && (
                                      <div className="mt-6 pt-4 border-t">
                                        <h4 className="text-md font-medium mb-3 text-muted-foreground">
                                          Additional Account Information
                                        </h4>
                                        {accountTemplateFieldsLoading ? (
                                          <div className="flex items-center justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            <span className="ml-2 text-sm text-muted-foreground">Loading fields...</span>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sortFields(accountTemplateFields)
                                              .filter((field) => field.fieldType !== FieldType.Checkbox)
                                              .map((field) => (
                                                <div
                                                  key={field.id}
                                                  className={cn(
                                                    'p-3 rounded border bg-gray-50/50',
                                                    field.fieldType === FieldType.TextArea ? 'md:col-span-2' : ''
                                                  )}
                                                >
                                                  {renderAccountDynamicField(field, 'recipient')}
                                                </div>
                                              ))}
                                          </div>
                                        )}

                                        {/* Checkbox fields for account template */}
                                        {accountTemplateFields.some((field) => field.fieldType === FieldType.Checkbox) && (
                                          <div className="mt-4 pt-3 border-t">
                                            <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                                              Account Options
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {sortFields(accountTemplateFields)
                                                .filter((field) => field.fieldType === FieldType.Checkbox)
                                                .map((field) => (
                                                  <div key={field.id} className="p-2 rounded border bg-gray-50/30">
                                                    {renderAccountDynamicField(field, 'recipient')}
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <Button
                                      type="button"
                                      size="sm"
                                      className="mt-4"
                                      onClick={async () => {
                                        // Clear previous errors
                                        setRecipientAccountErrors({});
                                        
                                        // Validate before creating account
                                        const validationErrors = validateAccountCreation(
                                          recipientAccount,
                                          recipientAccountFieldResponses,
                                          'recipient'
                                        );

                                        if (validationErrors.length > 0) {
                                          toast({
                                            title: 'Validation Error',
                                            description: validationErrors[0], // Show first error
                                            variant: 'destructive'
                                          });
                                          return;
                                        }

                                        setRecipientAccountsLoading(true);
                                        try {
                                          const accountData = {
                                            ...recipientAccount,
                                            recordId: selectedRecipientRecord.id,
                                            templateId: 13,
                                            fieldResponses: recipientAccountFieldResponses
                                          };
                                          const res =
                                            await accountService.createAccount(accountData);
                                          setRecipientAccounts((prev: any[]) => [
                                            ...prev,
                                            { ...recipientAccount, id: res.id }
                                          ]);
                                          setShowCreateRecipientAccount(false);
                                          setRecipientAccount({});
                                          setRecipientAccountFieldResponses([]);
                                          toast({
                                            title: 'Success',
                                            description: 'Account created successfully'
                                          });
                                          setSelectedRecipientAccount({
                                            ...recipientAccount,
                                            id: res.id
                                          });
                                          setForm((f) => ({ ...f, recipientId: res.id }));
                                          setRecipientDialogOpen(false);
                                        } catch (error: any) {
                                          console.error('Error creating recipient account:', error);
                                          toast({
                                            title: 'Error',
                                            description: error?.response?.data?.message || 'Failed to create account',
                                            variant: 'destructive'
                                          });
                                        } finally {
                                          setRecipientAccountsLoading(false);
                                        }
                                      }}
                                    >
                                      Create Account
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </DialogBody>
                          <DialogFooter>
                            <Button
                              type="button"
                              onClick={() => {
                                console.log(
                                  'Recipient Done button clicked. selectedRecipientAccount:',
                                  selectedRecipientAccount
                                );
                                if (selectedRecipientAccount) {
                                  console.log(
                                    'Setting form recipientId to:',
                                    selectedRecipientAccount.id
                                  );
                                  setForm((f) => ({
                                    ...f,
                                    recipientId: selectedRecipientAccount.id
                                  }));
                                  setRecipientDialogOpen(false);
                                } else {
                                  console.log('No recipient account selected');
                                  toast({
                                    title: 'Select an account',
                                    description: 'Please select an account before continuing.',
                                    variant: 'destructive'
                                  });
                                }
                              }}
                            >
                              Done
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate('/records/new')}
                            >
                              Create New Customer
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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

                  {templateFieldsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">Loading template fields...</span>
                    </div>
                  ) : (
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
