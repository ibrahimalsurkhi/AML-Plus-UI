import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  caseService, 
  Case, 
  ScreeningHistory, 
  ActivityLog, 
  CaseScreening,
  recordService,
  type Record as RecordType,
  type TemplateField,
  templateService,
  FieldType,
  type Template,
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
  Hash, 
  User, 
  FileText, 
  Calendar,
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

// Extended field response to handle optionId field, score, and templateScoreCriteriaId
interface ExtendedFieldResponse {
  id: number;
  fieldId: number;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  optionId?: string | null;
  templateScoreCriteriaId?: number | null;
  score?: number | null;
  templateScoreCriteria?: {
    id: number;
    templateId: number;
    key: string;
    bgColor: string;
    color: string;
    score: number;
  } | null;
}

// Extended Record interface to include lookup value objects
interface ExtendedRecord extends RecordType {
  countryOfBirthLookupValue?: LookupValue;
  nationalityLookupValue?: LookupValue;
}

const CaseStatusMap: Record<string, string> = {
  New: 'New',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Rejected: 'Rejected',
  Closed: 'Closed',
  Active: 'Active'
};

const SourceTypeMap: Record<string, string> = {
  Web: 'Web',
  Api: 'Api',
  Manual: 'Manual'
};

const CaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({});
  
  // Record details state
  const [record, setRecord] = useState<ExtendedRecord | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [sections, setSections] = useState<ExtendedTemplateSection[]>([]);
  const [fieldsWithoutSection, setFieldsWithoutSection] = useState<ExtendedTemplateField[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [bankCountries, setBankCountries] = useState<any[]>([]);
  const [bankCountriesLoading, setBankCountriesLoading] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<{ [key: number]: boolean }>({});
  const [accountFieldResponses, setAccountFieldResponses] = useState<{ [key: number]: FieldResponseDetail[] }>({});
  const [loadingAccountResponses, setLoadingAccountResponses] = useState<{ [key: number]: boolean }>({});

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('Invalid case ID');
        
        // Fetch case data
        const caseData = await caseService.getCaseById(Number(id));
        setCaseData(caseData);
        
        // Fetch record details if recordId exists
        if (caseData.recordId) {
          try {
            const recordData = await recordService.getRecordById(caseData.recordId);
            setRecord(recordData as ExtendedRecord);
            
            // Get the template name
            const templateDetails = await templateService.getTemplateById(
              recordData.templateId.toString()
            );
            setTemplateName(templateDetails.name);
            
            // Get the template fields and their options
            const fieldsResponse = await templateService.getTemplateFields(
              recordData.templateId.toString()
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
                        recordData.templateId.toString(),
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
                        extendedField.options = lookupValues.items.map(
                          (lookupValue: LookupValue, index: number) => ({
                            id: lookupValue.id,
                            fieldId: field.id!,
                            label: lookupValue.value,
                            scoreCriteriaId: lookupValue.scoreCriteriaId || 0,
                            displayOrder: index + 1
                          })
                        );
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
                    recordData.templateId.toString(),
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
                    extendedField.options = lookupValues.items.map(
                      (lookupValue: LookupValue, index: number) => ({
                        id: lookupValue.id,
                        fieldId: field.id!,
                        label: lookupValue.value,
                        scoreCriteriaId: lookupValue.scoreCriteriaId || 0,
                        displayOrder: index + 1
                      })
                    );
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
            
            // Fetch accounts by recordId
            setAccountsLoading(true);
            accountService
              .getAccountsByRecordId(recordData.id)
              .then((accountsData) => {
                setAccounts(accountsData);
              })
              .catch((error) => {
                console.error('Error fetching accounts:', error);
              })
              .finally(() => setAccountsLoading(false));
              
          } catch (recordError) {
            console.error('Error fetching record details:', recordError);
            // Don't show error toast for record details as case data is more important
          }
        }
        
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch case details. Please try again.',
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
        setBankCountries(values.items);
      } catch (err) {
        console.error('Error fetching bank countries from CountryOfBirth lookup:', err);
      } finally {
        setBankCountriesLoading(false);
      }
    };
    fetchBankCountries();
  }, []);

  // Helper to get field value from record.fieldResponses
  const getFieldValue = (
    fieldId: number,
    fieldType: FieldType,
    options?: ExtendedTemplateField['options']
  ) => {
    if (!record) return null;
    
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
        // Try to get the value from optionId first, then valueText
        const valueToMatch = response.optionId || response.valueText;
        
        if (valueToMatch) {
          // Try multiple matching strategies:
          const optionById = options?.find((opt) => opt.id?.toString() === valueToMatch);
          const optionByNumericId = options?.find((opt) => opt.id === parseInt(valueToMatch));
          const optionByLabel = options?.find((opt) => opt.label === valueToMatch);
          
          const option = optionById || optionByNumericId || optionByLabel;
          return option?.label || valueToMatch;
        }
        return null;
      default:
        return response.valueText;
    }
  };

  // Helper to render field value with score and templateScoreCriteria if available
  const renderFieldValue = (
    fieldId: number,
    fieldType: FieldType,
    options?: ExtendedTemplateField['options']
  ) => {
    if (!record) return null;
    
    const response = record.fieldResponses.find((fr) => fr.fieldId === fieldId) as ExtendedFieldResponse | undefined;
    if (!response) return <span className="text-muted-foreground">-</span>;

    const basicValue = getFieldValue(fieldId, fieldType, options);
    
    // Check if we have score and templateScoreCriteria information
    const hasScore = response.score !== null && response.score !== undefined;
    const hasTemplateCriteria = response.templateScoreCriteria !== null && response.templateScoreCriteria !== undefined;
    
    if (!hasScore && !hasTemplateCriteria) {
      return basicValue !== null ? basicValue : <span className="text-muted-foreground">-</span>;
    }

    return (
      <div className="space-y-2">
        {basicValue !== null && (
          <div className="text-base font-medium">{basicValue}</div>
        )}
        
        {hasTemplateCriteria && response.templateScoreCriteria && (
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 rounded-md text-sm font-medium"
              style={{ 
                backgroundColor: response.templateScoreCriteria.bgColor,
                color: response.templateScoreCriteria.color 
              }}
            >
              {response.templateScoreCriteria.key}
            </span>
            {hasScore && (
              <span className="text-sm text-muted-foreground">
                Score: {response.score}
              </span>
            )}
          </div>
        )}
        
        {hasScore && !hasTemplateCriteria && (
          <div className="text-sm text-muted-foreground">
            Score: {response.score}
          </div>
        )}
        
        {response.templateScoreCriteriaId && !hasTemplateCriteria && (
          <div className="text-xs text-muted-foreground">
            Template Criteria ID: {response.templateScoreCriteriaId}
          </div>
        )}
      </div>
    );
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
    
    setExpandedAccounts((prev: { [key: number]: boolean }) => ({
      ...prev,
      [accountId]: !isCurrentlyExpanded
    }));

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

  // Function to render field response value with score and templateScoreCriteria
  const renderFieldResponseValue = (response: FieldResponseDetail) => {
    let basicValue = '-';
    if (response.valueText) basicValue = response.valueText;
    else if (response.valueNumber !== null) basicValue = response.valueNumber.toString();
    else if (response.valueDate) basicValue = new Date(response.valueDate).toLocaleDateString();
    else if (response.optionValue) basicValue = response.optionValue;

    const hasScore = response.score !== null && response.score !== undefined;
    const hasTemplateCriteria = response.templateScoreCriteria !== null && response.templateScoreCriteria !== undefined;
    
    if (!hasScore && !hasTemplateCriteria) {
      return basicValue;
    }

    return (
      <div className="space-y-1">
        <div className="text-sm text-gray-900">{basicValue}</div>
        
        {hasTemplateCriteria && response.templateScoreCriteria && (
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ 
                backgroundColor: response.templateScoreCriteria.bgColor,
                color: response.templateScoreCriteria.color 
              }}
            >
              {response.templateScoreCriteria.key}
            </span>
            {hasScore && (
              <span className="text-xs text-gray-500">
                Score: {response.score}
              </span>
            )}
          </div>
        )}
        
        {hasScore && !hasTemplateCriteria && (
          <div className="text-xs text-gray-500">
            Score: {response.score}
          </div>
        )}
        
        {response.templateScoreCriteriaId && !hasTemplateCriteria && (
          <div className="text-xs text-gray-400">
            Criteria ID: {response.templateScoreCriteriaId}
          </div>
        )}
      </div>
    );
  };

  // Helper function to get bank country display value from CountryOfBirth lookup
  const getBankCountryDisplayValue = (account: any) => {
    if (account.bankOfCountryName && account.bankOfCountryName.trim() !== '') {
      return account.bankOfCountryName;
    }
    
    if (account.bankOfCountryId && bankCountries.length > 0) {
      const country = bankCountries.find(c => c.id === account.bankOfCountryId || c.id === parseInt(account.bankOfCountryId));
      if (country) return country.value;
    }
    
    if (account.bankOfCountryLookupValueId && bankCountries.length > 0) {
      const country = bankCountries.find(c => c.id === account.bankOfCountryLookupValueId || c.id === parseInt(account.bankOfCountryLookupValueId));
      if (country) return country.value;
    }
    
    return '-';
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </Container>
    );
  }

  if (!caseData) {
    return (
      <Container>
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">Case Not Found</h2>
          <p className="text-muted-foreground mb-4">The case you are looking for does not exist.</p>
          <Button onClick={() => navigate('/cases')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cases
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <div className="flex flex-col gap-1">
            <ToolbarHeading>Case Details</ToolbarHeading>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <Hash className="w-4 h-4 text-primary" />
                <span>ID: {caseData.id}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <FileText className="w-4 h-4 text-primary" />
                <span>Record ID: {caseData.recordId}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <User className="w-4 h-4 text-primary" />
                <span>Name: {caseData.fullName}</span>
              </div>
            </div>
          </div>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate('/cases')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cases
            </Button>
          </ToolbarActions>
        </Toolbar>

        {/* Case Information Card */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Case Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Basic information about the case.</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  Case ID
                </div>
                <div className="text-base font-medium">{caseData.id}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Source
                </div>
                <div className="text-base font-medium">
                  {SourceTypeMap[caseData.source] || caseData.source}
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Score
                </div>
                <div className="text-base font-medium">
                  <span
                    className="px-2 w-16 text-center py-1 rounded-md inline-block"
                    style={{ 
                      backgroundColor: caseData.riskLevelBGColor || caseData.scoreBGColor,
                      color: caseData.riskLevelColor 
                    }}
                  >
                    {caseData.score}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Target Threshold
                </div>
                <div className="text-base font-medium">{caseData.targetThreshold}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Exceeds Target Threshold
                </div>
                <div className="text-base font-medium">
                  {caseData.exceedsTargetThreshold ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        {record && (
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
                    Record ID
                  </div>
                  <div className="text-base font-medium">
                  <button
                    onClick={() => navigate(`/records/${caseData.recordId}`)}
                    className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                  >
                    {caseData.recordId}
                  </button>
                  </div>
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
        )}

        {/* Template Fields organized by Sections */}
        {record && sections.map((section) => (
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
                  return (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        {getFieldIcon(field.fieldType)}
                        {field.label}
                      </div>
                      <div>
                        {renderFieldValue(field.id!, field.fieldType, field.options)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Fields without Section */}
        {record && fieldsWithoutSection.length > 0 && (
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
                  return (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        {getFieldIcon(field.fieldType)}
                        {field.label}
                      </div>
                      <div>
                        {renderFieldValue(field.id!, field.fieldType, field.options)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Accounts Section */}
        {record && accounts.length > 0 && (
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
                                      <div>
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

        {/* Screening Histories Card */}
        {caseData.screeningHistories && caseData.screeningHistories.length > 0 && (
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Screening Histories
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left">ID</th>
                      <th className="border px-3 py-2 text-left">No. of Matches</th>
                      <th className="border px-3 py-2 text-left">Case Screenings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.screeningHistories.map((history) => (
                      <React.Fragment key={history.id}>
                        <tr className="bg-white">
                          <td className="border px-3 py-2">
                            <button
                              className="text-primary font-bold focus:outline-none"
                              onClick={() => toggleExpand(history.id)}
                              aria-label={expanded[history.id] ? 'Collapse' : 'Expand'}
                            >
                              {expanded[history.id] ? '−' : '+'}
                            </button>
                            <span className="ml-2">{history.id}</span>
                          </td>
                          <td className="border px-3 py-2">{history.noOfMatches}</td>
                          <td className="border px-3 py-2">
                            {history.caseScreenings && history.caseScreenings.length > 0 ? (
                              <span>{history.caseScreenings.length} screening(s)</span>
                            ) : (
                              <span className="text-muted-foreground">No screenings</span>
                            )}
                          </td>
                        </tr>
                        {expanded[history.id] && (
                          <tr>
                            <td colSpan={3} className="border px-3 py-2 bg-gray-50">
                              <table className="min-w-full border text-xs">
                                <thead>
                                  <tr>
                                    <th className="border px-2 py-1">Screening ID</th>
                                    <th className="border px-2 py-1">Individual ID</th>
                                    <th className="border px-2 py-1">Individual Name</th>
                                    <th className="border px-2 py-1">Entity ID</th>
                                    <th className="border px-2 py-1">Match Score</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {history.caseScreenings.map((screening) => (
                                    <tr key={screening.id}>
                                      <td className="border px-2 py-1">{screening.id}</td>
                                      <td className="border px-2 py-1">
                                        {screening.individualId ?? '-'}
                                      </td>
                                      <td className="border px-2 py-1">
                                        {screening.individualName ?? '-'}
                                      </td>
                                      <td className="border px-2 py-1">
                                        {screening.entityId ?? '-'}
                                      </td>
                                      <td className="border px-2 py-1">{screening.matchScore}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Logs Card */}
        {caseData.activityLogs && caseData.activityLogs.length > 0 && (
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Activity Logs
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left">Description</th>
                      <th className="border px-3 py-2 text-left">Action</th>
                      <th className="border px-3 py-2 text-left">Module</th>
                      <th className="border px-3 py-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.activityLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="border px-3 py-2">{log.description}</td>
                        <td className="border px-3 py-2">{log.action}</td>
                        <td className="border px-3 py-2">{log.module}</td>
                        <td className="border px-3 py-2">{log.created}</td>
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

export default CaseDetailsPage;
