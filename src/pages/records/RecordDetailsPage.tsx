import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  recordService,
  type Record,
  type TemplateField,
  templateService,
  FieldType,
  type Template,
  caseService,
  Case,
  lookupService,
  type LookupValue,
  accountService,
  fieldResponseService,
  type FieldResponseDetail
} from '@/services/api';
import { Container } from '@/components/container';
import {
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  Hash,
  FileText,
  IdCard,
  FileType,
  UserRound,
  Cake,
  Globe,
  Flag,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Building
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { cn } from '@/lib/utils';

// Extend TemplateField type to include options and ranges
interface ExtendedTemplateField extends TemplateField {
  options?: Array<{
    id?: number;
    fieldId?: number;
    label: string;
    scoreCriteriaId: number;
    displayOrder: number;
  }>;
}

// Extended section interface with processed fields
interface ExtendedTemplateSection {
  id: number;
  title: string;
  displayOrder: number;
  fields: ExtendedTemplateField[];
}

// Extended field response to handle optionId field
interface ExtendedFieldResponse {
  id: number;
  fieldId: number;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  optionId?: string | null;
}

// Extended Record interface to include lookup value objects
interface ExtendedRecord extends Record {
  countryOfBirthLookupValue?: LookupValue;
  nationalityLookupValue?: LookupValue;
}

const RecordDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ExtendedRecord | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [sections, setSections] = useState<ExtendedTemplateSection[]>([]);
  const [fieldsWithoutSection, setFieldsWithoutSection] = useState<ExtendedTemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  // Bank countries lookup state
  const [bankCountries, setBankCountries] = useState<any[]>([]);
  const [bankCountriesLoading, setBankCountriesLoading] = useState(false);
  // Account field responses display state
  const [expandedAccounts, setExpandedAccounts] = useState<{ [key: number]: boolean }>({});
  const [accountFieldResponses, setAccountFieldResponses] = useState<{ [key: number]: FieldResponseDetail[] }>({});
  const [loadingAccountResponses, setLoadingAccountResponses] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        

        // Now get the full record details using the template ID
        const fullRecord = await recordService.getRecordById(id!);
        setRecord(fullRecord as ExtendedRecord);

        // Get the template name
        const templateDetails = await templateService.getTemplateById(
          fullRecord.templateId.toString()
        );
        setTemplateName(templateDetails.name);

        // Get the template fields and their options
        const fieldsResponse = await templateService.getTemplateFields(
          fullRecord.templateId.toString()
        );

        // Process sections with their fields
        const processedSections = await Promise.all(
          fieldsResponse.sections.map(async (section) => {
            const fieldsWithOptions = await Promise.all(
              section.fields.map(async (field) => {
                const extendedField: ExtendedTemplateField = { ...field };

                // Fetch options for option-based fields
                if (
                  field.fieldType === FieldType.Dropdown ||
                  field.fieldType === FieldType.Radio ||
                  field.fieldType === FieldType.Checkbox
                ) {
                  const options = await templateService.getFieldOptions(
                    fullRecord.templateId.toString(),
                    field.id!
                  );
                  extendedField.options = options;
                }

                // Fetch lookup values for Lookup fields
                if (field.fieldType === FieldType.Lookup && field.lookupId) {
                  try {
                    const lookupValues = await lookupService.getLookupValues(field.lookupId, {
                      pageNumber: 1,
                      pageSize: 100
                    });
                    // Convert lookup values to field options format
                    extendedField.options = lookupValues.items.map(
                      (lookupValue: LookupValue, index: number) => ({
                        id: lookupValue.id,
                        fieldId: field.id!,
                        label: lookupValue.value,
                        scoreCriteriaId: lookupValue.scoreCriteriaId || 0,
                        displayOrder: index + 1
                      })
                    );
                    console.log(`Loaded ${lookupValues.items.length} lookup values for field ${field.id}:`, extendedField.options);
                  } catch (error) {
                    console.error(`Error fetching lookup values for field ${field.id}:`, error);
                    extendedField.options = [];
                  }
                }

                return extendedField;
              })
            );

            return {
              ...section,
              fields: fieldsWithOptions
            };
          })
        );

        // Process fields without section
        const processedFieldsWithoutSection = await Promise.all(
          fieldsResponse.fieldsWithoutSection.map(async (field) => {
            const extendedField: ExtendedTemplateField = { ...field };

            // Fetch options for option-based fields
            if (
              field.fieldType === FieldType.Dropdown ||
              field.fieldType === FieldType.Radio ||
              field.fieldType === FieldType.Checkbox
            ) {
              const options = await templateService.getFieldOptions(
                fullRecord.templateId.toString(),
                field.id!
              );
              extendedField.options = options;
            }

            // Fetch lookup values for Lookup fields
            if (field.fieldType === FieldType.Lookup && field.lookupId) {
              try {
                const lookupValues = await lookupService.getLookupValues(field.lookupId, {
                  pageNumber: 1,
                  pageSize: 100
                });
                // Convert lookup values to field options format
                extendedField.options = lookupValues.items.map(
                  (lookupValue: LookupValue, index: number) => ({
                    id: lookupValue.id,
                    fieldId: field.id!,
                    label: lookupValue.value,
                    scoreCriteriaId: lookupValue.scoreCriteriaId || 0,
                    displayOrder: index + 1
                  })
                );
                console.log(`Loaded ${lookupValues.items.length} lookup values for field ${field.id}:`, extendedField.options);
              } catch (error) {
                console.error(`Error fetching lookup values for field ${field.id}:`, error);
                extendedField.options = [];
              }
            }

            return extendedField;
          })
        );

        setSections(processedSections);
        setFieldsWithoutSection(processedFieldsWithoutSection);

        // Fetch cases by recordId
        caseService.getCasesByRecordId(fullRecord.id).then(setCases);

        // Fetch accounts by recordId
        setAccountsLoading(true);
        accountService
          .getAccountsByRecordId({ recordUUID: fullRecord.uuid, pageNumber: 1, pageSize: 100 })
          .then((accountsData) => {
            console.log('Fetched accounts data:', accountsData);
            if (accountsData && accountsData.length > 0) {
              console.log('First account structure:', accountsData[0]);
            }
            setAccounts(accountsData);
          })
          .catch((error) => {
            console.error('Error fetching accounts:', error);
            toast({
              title: 'Error',
              description: 'Failed to fetch accounts. Please try again.',
              variant: 'destructive'
            });
          })
          .finally(() => setAccountsLoading(false));
      } catch (error) {
        console.error('Error fetching record details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch record details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch bank countries from lookup service using "CountryOfBirth" key
  useEffect(() => {
    const fetchBankCountries = async () => {
      setBankCountriesLoading(true);
      try {
        const values = await lookupService.getLookupValuesByKey('CountryOfBirth', { pageNumber: 1, pageSize: 100 });
        console.log('Fetched bank countries from CountryOfBirth lookup:', values.items);
        setBankCountries(values.items);
      } catch (err) {
        console.error('Error fetching bank countries from CountryOfBirth lookup:', err);
        // Don't show toast error for this as it's not critical
      } finally {
        setBankCountriesLoading(false);
      }
    };
    fetchBankCountries();
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </Container>
    );
  }

  if (!record) {
    return (
      <Container>
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">Record Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The record you are looking for does not exist.
          </p>
          <Button onClick={() => navigate('/records')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Records
          </Button>
        </div>
      </Container>
    );
  }

  // Helper to get field value from record.fieldResponses
  const getFieldValue = (
    fieldId: number,
    fieldType: FieldType,
    options?: ExtendedTemplateField['options']
  ) => {
    const response = record.fieldResponses.find((fr) => fr.fieldId === fieldId) as ExtendedFieldResponse | undefined;
    if (!response) return null;

    switch (fieldType) {
      case FieldType.Text:
      case FieldType.TextArea:
        return response.valueText;
      case FieldType.Number:
        return response.valueNumber;
      case FieldType.Date:
        return response.valueDate ? new Date(response.valueDate).toLocaleDateString() : null;
      case FieldType.Dropdown:
      case FieldType.Radio:
      case FieldType.Checkbox:
      case FieldType.Lookup:
        // For debugging lookup fields
        if (fieldType === FieldType.Lookup) {
          console.log(`Lookup field ${fieldId}:`, {
            valueText: response.valueText,
            optionId: response.optionId,
            availableOptions: options?.map(opt => ({ id: opt.id, label: opt.label }))
          });
        }
        
        // Try to get the value from optionId first, then valueText
        const valueToMatch = response.optionId || response.valueText;
        
        if (valueToMatch) {
          // Try multiple matching strategies:
          // 1. Match by option ID (string comparison)
          const optionById = options?.find((opt) => opt.id?.toString() === valueToMatch);
          // 2. Match by option ID (number comparison)  
          const optionByNumericId = options?.find((opt) => opt.id === parseInt(valueToMatch));
          // 3. Match by label
          const optionByLabel = options?.find((opt) => opt.label === valueToMatch);
          
          const option = optionById || optionByNumericId || optionByLabel;
          
          if (fieldType === FieldType.Lookup && !option) {
            console.warn(`No matching option found for lookup field ${fieldId} with value: ${valueToMatch}`, {
              optionId: response.optionId,
              valueText: response.valueText,
              availableOptions: options
            });
          }
          
          return option?.label || valueToMatch;
        }
        return null;
      default:
        return response.valueText;
    }
  };

  // Helper to get field icon based on field type
  const getFieldIcon = (fieldType: FieldType) => {
    switch (fieldType) {
      case FieldType.Text:
      case FieldType.TextArea:
        return <FileType className="w-4 h-4" />;
      case FieldType.Number:
        return <Hash className="w-4 h-4" />;
      case FieldType.Date:
        return <Calendar className="w-4 h-4" />;
      case FieldType.Dropdown:
      case FieldType.Radio:
      case FieldType.Checkbox:
      case FieldType.Lookup:
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Function to toggle account expansion and fetch field responses
  const toggleAccountExpansion = async (accountId: number) => {
    const isCurrentlyExpanded = expandedAccounts[accountId];
    
    // Toggle expansion state
    setExpandedAccounts((prev: { [key: number]: boolean }) => ({
      ...prev,
      [accountId]: !isCurrentlyExpanded
    }));

    // If expanding and we don't have data yet, fetch it
    if (!isCurrentlyExpanded && !accountFieldResponses[accountId]) {
      setLoadingAccountResponses((prev: { [key: number]: boolean }) => ({ ...prev, [accountId]: true }));
      
      try {
        const responses = await fieldResponseService.getFieldResponses({ accountId });
        setAccountFieldResponses((prev: { [key: number]: FieldResponseDetail[] }) => ({
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
        setLoadingAccountResponses((prev: { [key: number]: boolean }) => ({ ...prev, [accountId]: false }));
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

  // Helper function to get bank country display value from CountryOfBirth lookup
  const getBankCountryDisplayValue = (account: any) => {
    console.log('Getting bank country for account:', account.id, {
      bankOfCountryName: account.bankOfCountryName,
      bankOfCountryId: account.bankOfCountryId,
      bankOfCountryLookupValueId: account.bankOfCountryLookupValueId,
      bankCountriesAvailable: bankCountries.length
    });
    
    // First, try to use the bankOfCountryName if it exists and is not empty
    if (account.bankOfCountryName && account.bankOfCountryName.trim() !== '') {
      console.log('Using bankOfCountryName:', account.bankOfCountryName);
      return account.bankOfCountryName;
    }
    
    // If we have a bankOfCountryId, try to find it in the lookup values
    if (account.bankOfCountryId && bankCountries.length > 0) {
      const country = bankCountries.find(c => c.id === account.bankOfCountryId || c.id === parseInt(account.bankOfCountryId));
      if (country) {
        console.log('Found country by bankOfCountryId:', country.value);
        return country.value;
      }
    }
    
    // If we have a bankOfCountryLookupValueId, try to find it in the lookup values
    if (account.bankOfCountryLookupValueId && bankCountries.length > 0) {
      const country = bankCountries.find(c => c.id === account.bankOfCountryLookupValueId || c.id === parseInt(account.bankOfCountryLookupValueId));
      if (country) {
        console.log('Found country by bankOfCountryLookupValueId:', country.value);
        return country.value;
      }
    }
    
    console.log('No bank country found, returning -');
    return '-';
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <div className="flex flex-col gap-1">
            <ToolbarHeading>Record Details</ToolbarHeading>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <Hash className="w-4 h-4 text-primary" />
                <span>ID: {record?.id || '-'}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <IdCard className="w-4 h-4 text-primary" />
                <span>Identification: {record?.identification || '-'}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <FileText className="w-4 h-4 text-primary" />
                <span>Template: {templateName || '-'}</span>
              </div>
            </div>
          </div>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate('/records')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Records
            </Button>
          </ToolbarActions>
        </Toolbar>

        {/* Personal Information Card */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" />
              Personal Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Basic information about the record holder.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  ID
                </div>
                <div className="text-base font-medium">{record?.id || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <IdCard className="w-4 h-4" />
                  Identification
                </div>
                <div className="text-base font-medium">{record?.identification || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <CreditCard className="w-4 h-4" />
                  Customer Reference ID
                </div>
                <div className="text-base font-medium">{record?.customerReferenceId || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Template
                </div>
                <div className="text-base font-medium">{templateName || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  First Name
                </div>
                <div className="text-base font-medium">{record.firstName}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  Middle Name
                </div>
                <div className="text-base font-medium">{record.middleName || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  Last Name
                </div>
                <div className="text-base font-medium">{record.lastName}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Cake className="w-4 h-4" />
                  Date of Birth
                </div>
                <div className="text-base font-medium">
                  {new Date(record.dateOfBirth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Globe className="w-4 h-4" />
                  Country of Birth
                </div>
                <div className="text-base font-medium">
                  {record.countryOfBirthLookupValue?.value || '-'}
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Flag className="w-4 h-4" />
                  Nationality
                </div>
                <div className="text-base font-medium">
                  {record.nationalityLookupValue?.value || '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Fields organized by Sections */}
        {sections.map((section) => (
          <Card key={section.id} className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {section.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Fields organized under the {section.title} section.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => {
                  const value = getFieldValue(field.id!, field.fieldType, field.options);
                  return (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        {getFieldIcon(field.fieldType)}
                        {field.label}
                      </div>
                      <div className="text-base font-medium">
                        {value !== null ? value : <span className="text-muted-foreground">-</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Fields without Section */}
        {fieldsWithoutSection.length > 0 && (
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Additional Information
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Additional template fields not organized under specific sections.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fieldsWithoutSection.map((field) => {
                  const value = getFieldValue(field.id!, field.fieldType, field.options);
                  return (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        {getFieldIcon(field.fieldType)}
                        {field.label}
                      </div>
                      <div className="text-base font-medium">
                        {value !== null ? value : <span className="text-muted-foreground">-</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Accounts Section */}
        {accounts.length > 0 && (
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Related Accounts
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Account information associated with this record.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {accountsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin w-8 h-8 text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading accounts...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {accounts.map((account) => (
                    <Card key={account.id} className="border bg-card hover:bg-accent/5 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium text-muted-foreground">Account Name</div>
                                <div className="text-base font-semibold">{account.name}</div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium text-muted-foreground">Account Number</div>
                                <div className="text-base font-mono">{account.number}</div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium text-muted-foreground">Bank Country</div>
                                <div className="text-base">{getBankCountryDisplayValue(account)}</div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium text-muted-foreground">Bank City</div>
                                <div className="text-base">{account.bankOfCity || '-'}</div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium text-muted-foreground">Status</div>
                                <div className="text-base">
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    account.accountStatus === 1 ? "bg-green-100 text-green-800" :
                                    account.accountStatus === 2 ? "bg-yellow-100 text-yellow-800" :
                                    account.accountStatus === 3 ? "bg-red-100 text-red-800" :
                                    account.accountStatus === 4 ? "bg-orange-100 text-orange-800" :
                                    "bg-gray-100 text-gray-800"
                                  )}>
                                    {account.accountStatus === 1 ? 'Active' :
                                     account.accountStatus === 2 ? 'Inactive' :
                                     account.accountStatus === 3 ? 'Closed' :
                                     account.accountStatus === 4 ? 'Suspended' :
                                     'Unknown'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium text-muted-foreground">Created</div>
                                <div className="text-base">
                                  {account.creationDate ? new Date(account.creationDate).toLocaleDateString() : '-'}
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <div className="text-sm font-medium text-muted-foreground">Account ID</div>
                                <div className="text-base font-mono">{account.id}</div>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAccountExpansion(account.id)}
                            className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
                            aria-label={expandedAccounts[account.id] ? 'Collapse details' : 'Expand details'}
                          >
                            {expandedAccounts[account.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        
                        {/* Expandable Field Responses Section */}
                        {expandedAccounts[account.id] && (
                          <div className="mt-4 pt-4 border-t">
                            {loadingAccountResponses[account.id] ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="animate-spin w-6 h-6 text-primary" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading field responses...</span>
                              </div>
                            ) : accountFieldResponses[account.id] && accountFieldResponses[account.id].length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">Additional Account Information:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {accountFieldResponses[account.id].map((response: FieldResponseDetail) => (
                                    <div key={response.id} className="p-3 rounded border bg-gray-50/50">
                                      <div className="text-sm font-medium text-gray-700 mb-1">
                                        {response.fieldName}
                                      </div>
                                      <div className="text-sm text-gray-900">
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
                                No additional field responses found for this account.
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {cases.length > 0 && (
          <Card className="shadow-sm border-primary/10 mt-6">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Related Cases
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left">ID</th>
                      <th className="border px-3 py-2 text-left">Full Name</th>
                      <th className="border px-3 py-2 text-left">Score</th>
                      <th className="border px-3 py-2 text-left">Target Threshold</th>
                      <th className="border px-3 py-2 text-left">Exceeds Target</th>
                      <th className="border px-3 py-2 text-left">Status</th>
                      <th className="border px-3 py-2 text-left">Source</th>
                      <th className="border px-3 py-2 text-left">Created</th>
                      <th className="border px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id}>
                        <td className="border px-3 py-2">{c.id}</td>
                        <td className="border px-3 py-2">{c.fullName}</td>
                        <td className="border px-3 py-2">
                          <span
                            className="px-2 w-16 text-center py-1 rounded-md inline-block"
                            style={{ 
                              backgroundColor: c.riskLevelBGColor || c.scoreBGColor,
                              color: c.riskLevelColor 
                            }}
                          >
                            {c.score}
                          </span>
                        </td>
                        <td className="border px-3 py-2">{c.targetThreshold}</td>
                        <td className="border px-3 py-2">
                          {c.exceedsTargetThreshold ? 'Yes' : 'No'}
                        </td>
                        <td className="border px-3 py-2">{c.status}</td>
                        <td className="border px-3 py-2">{c.source}</td>
                        <td className="border px-3 py-2">{c.created}</td>
                        <td className="border px-3 py-2">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(`/cases/${c.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default RecordDetailsPage;
