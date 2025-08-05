import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import { transactionService, type Transaction, templateService, FieldType, type TemplateField } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { KeenIcon } from '@/components/keenicons';
import { ArrowLeft, Calendar, User, Building, AlertTriangle, CheckCircle, XCircle, DollarSign, Clock, FileText, Shield, Activity, ArrowUpRight, ArrowDownRight, Hash, FileType } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

interface TransactionDetails extends Transaction {
  senderAccount?: {
    id: number;
    name: string;
    number: string;
    bankOfCountryId: number;
    bankOfCountryName: string;
    bankOfCity: string;
    creationDate: string;
    accountStatus: number;
    recordId: number;
    recordName?: string;
  };
  recipientAccount?: {
    id: number;
    name: string;
    number: string;
    bankOfCountryId: number;
    bankOfCountryName: string;
    bankOfCity: string;
    creationDate: string;
    accountStatus: number;
    recordId: number;
    recordName?: string;
  };
  relatedRecords?: Array<{
    id: number;
    templateId: number;
    templateName: string;
    created: string;
    createdBy: string;
    recordName?: string;
  }>;
  ruleExecutions?: Array<{
    id: number;
    ruleId: number;
    ruleName: string;
    ruleType: number;
    isMatched: boolean;
    executedAt: string;
    created: string;
    createdBy: string;
  }>;
  fieldResponses?: Array<{
    id: number;
    fieldId: number;
    fieldName: string;
    optionId: number | null;
    optionValue: string | null;
    templateFieldScoreCriteriaId: number | null;
    valueText: string | null;
    valueNumber: number | null;
    valueDate: string | null;
    created: string;
    createdBy: string;
  }>;
}

const TransactionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<ExtendedTemplateField[]>([]);
  const [templateName, setTemplateName] = useState<string>('');

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await transactionService.getTransactionById(Number(id));
        setTransaction(data as TransactionDetails);

        // Fetch template fields for template ID 15 (transaction template)
        const fieldsResponse = await templateService.getTemplateFields('15');
        // Get all fields from sections and fields without section
        const allFields = [
          ...fieldsResponse.sections.flatMap(section => section.fields),
          ...fieldsResponse.fieldsWithoutSection
        ];
        
        // Fetch options for fields that need them
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
              extendedField.options = options;
            }
            
            return extendedField;
          })
        );
        
        setFields(fieldsWithOptions);

        // Get template name
        const templateDetails = await templateService.getTemplateById('15');
        setTemplateName(templateDetails.name);
      } catch (error) {
        console.error('Error fetching transaction details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch transaction details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [id]);

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'Active';
      case 2: return 'Inactive';
      case 3: return 'Blocked';
      case 4: return 'Suspended';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 2: return 'bg-slate-50 text-slate-700 border-slate-200';
      case 3: return 'bg-red-50 text-red-700 border-red-200';
      case 4: return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getAccountStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'Active';
      case 2: return 'Inactive';
      case 3: return 'Closed';
      case 4: return 'Suspended';
      default: return 'Unknown';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Helper to get field value from transaction.fieldResponses
  const getFieldValue = (fieldId: number, fieldType: FieldType, options?: ExtendedTemplateField['options']) => {
    if (!transaction?.fieldResponses) return null;
    
    const response = transaction.fieldResponses.find(fr => fr.fieldId === fieldId);
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
        // For dropdown fields, check optionValue first, then optionId, then valueText
        if (response.optionValue) {
          return response.optionValue;
        } else if (response.optionId !== null) {
          // Find the option that matches the optionId
          const option = options?.find(opt => opt.id?.toString() === response.optionId!.toString());
          return option?.label || response.optionId!.toString();
        } else if (response.valueText) {
          // Find the option that matches the valueText (which might be the option ID)
          const option = options?.find(opt => opt.id?.toString() === response.valueText);
          return option?.label || response.valueText;
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
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <p className="text-muted-foreground text-xl font-medium">Loading transaction details...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!transaction) {
    return (
      <Container>
        <div className="text-center py-24">
          <div className="max-w-lg mx-auto">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <KeenIcon icon="document" style="duotone" className="text-3xl text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Transaction Not Found</h2>
            <p className="text-muted-foreground text-lg mb-8">The transaction you are looking for does not exist or has been removed.</p>
            <Button onClick={() => navigate('/transactions')} variant="outline" size="lg" className="px-8">
              <ArrowLeft className="w-5 h-5 mr-3" /> Back to Transactions
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>Transaction Details</ToolbarHeading>
      </Toolbar>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/transactions')} 
                variant="ghost" 
                size="sm"
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
            </div>
            <Badge className={`px-4 py-2 text-sm font-medium ${getStatusColor(transaction.transactionStatus)}`}>
              {getStatusLabel(transaction.transactionStatus)}
            </Badge>
          </div>
          
          {/* Transaction Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-semibold">{transaction.createdBy || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tenant ID</p>
                <p className="font-semibold">{transaction.tenantId || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Currency Amount</p>
                <p className="font-semibold">{formatAmount(transaction.currencyAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Transaction Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{transaction.transactionID}</h2>
                <p className="text-lg text-gray-600">{transaction.transactionTypeName || `Transaction Type ${transaction.transactionTypeId}`}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary mb-1">{formatAmount(transaction.transactionAmount)}</div>
                <div className="text-sm text-gray-500">{transaction.transactionCurrencyName || `Currency ${transaction.transactionCurrencyId}`}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transaction Time</p>
                  <p className="font-semibold">{formatDate(transaction.transactionTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="font-semibold truncate" title={transaction.transactionPurpose}>
                    {transaction.transactionPurpose}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold">{transaction.created ? formatDate(transaction.created) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Accounts & Related Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Sender Account */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Sender Account</h4>
                </div>
                {transaction.senderAccount ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Name</span>
                      <span className="font-medium">{transaction.senderAccount.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Number</span>
                      <span className="font-mono font-medium">{transaction.senderAccount.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Record</span>
                      <div className="flex items-center gap-2">
                        {transaction.senderAccount.recordName ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                            onClick={() => navigate(`/records/${transaction.senderAccount!.recordId}`)}
                          >
                            {transaction.senderAccount.recordName}
                          </Button>
                        ) : (
                          <span className="font-medium text-gray-400">No record</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Bank</span>
                      <span className="font-medium">{transaction.senderAccount.bankOfCountryName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">City</span>
                      <span className="font-medium">{transaction.senderAccount.bankOfCity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge className={`text-xs ${getStatusColor(transaction.senderAccount.accountStatus)}`}>
                        {getAccountStatusLabel(transaction.senderAccount.accountStatus)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No sender account</p>
                  </div>
                )}
              </div>

              {/* Recipient Account */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Recipient Account</h4>
                </div>
                {transaction.recipientAccount ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Name</span>
                      <span className="font-medium">{transaction.recipientAccount.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Number</span>
                      <span className="font-mono font-medium">{transaction.recipientAccount.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Record</span>
                      <div className="flex items-center gap-2">
                        {transaction.recipientAccount.recordName ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                            onClick={() => navigate(`/records/${transaction.recipientAccount!.recordId}`)}
                          >
                            {transaction.recipientAccount.recordName}
                          </Button>
                        ) : (
                          <span className="font-medium text-gray-400">No record</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Bank</span>
                      <span className="font-medium">{transaction.recipientAccount.bankOfCountryName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">City</span>
                      <span className="font-medium">{transaction.recipientAccount.bankOfCity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge className={`text-xs ${getStatusColor(transaction.recipientAccount.accountStatus)}`}>
                        {getAccountStatusLabel(transaction.recipientAccount.accountStatus)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No recipient account</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Records */}
            {transaction.relatedRecords && transaction.relatedRecords.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  Related Records
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transaction.relatedRecords.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h5 className="font-semibold text-gray-900 mb-2">{record.templateName}</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>ID:</span>
                          <span className="font-medium">{record.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Record:</span>
                          <div className="flex items-center gap-2">
                            {record.recordName ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                                onClick={() => navigate(`/records/${record.id}`)}
                              >
                                {record.recordName}
                              </Button>
                            ) : (
                              <span className="font-medium text-gray-400">No name</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-medium">{formatDate(record.created)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>By:</span>
                          <span className="font-medium">{record.createdBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rule Executions */}
          {transaction.ruleExecutions && transaction.ruleExecutions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Rule Executions</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900">Rule Name</TableHead>
                      <TableHead className="font-semibold text-gray-900">Type</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Executed At</TableHead>
                      <TableHead className="font-semibold text-gray-900">Created By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaction.ruleExecutions.map((rule) => (
                      <TableRow key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="font-medium">{rule.ruleName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {rule.ruleType === 1 ? 'Monitoring' : 'Screening'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {rule.isMatched ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <Badge className={`text-xs ${
                              rule.isMatched 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {rule.isMatched ? 'Matched' : 'Not Matched'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(rule.executedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {rule.createdBy}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

                    {/* Template Fields Card */}
          {fields.length > 0 && (
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="bg-primary/5 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Template Fields
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Additional information based on the template requirements.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.map(field => {
                    const value = getFieldValue(field.id!, field.fieldType, field.options);
                    return (
                      <div key={field.id} className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                          {getFieldIcon(field.fieldType)}
                          {field.label}
                        </div>
                        <div className="text-base font-medium">
                          {value !== null ? value : <span className="text-muted-foreground">No value set</span>}
                        </div>
                        {/* Show available options for dropdown/radio/checkbox fields */}
                        {(field.fieldType === FieldType.Dropdown || field.fieldType === FieldType.Radio || field.fieldType === FieldType.Checkbox) && 
                         field.options && field.options.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Available options:</div>
                            <div className="flex flex-wrap gap-1">
                              {field.options.map(option => (
                                <span key={option.id} className="inline-block px-2 py-1 text-xs bg-gray-100 rounded border">
                                  {option.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
};

export default TransactionDetailsPage; 