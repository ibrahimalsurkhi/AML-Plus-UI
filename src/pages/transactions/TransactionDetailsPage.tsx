import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import {
  transactionService,
  type Transaction,
  type TransactionParticipant,
  type TransactionFieldResponse
} from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { KeenIcon } from '@/components/keenicons';
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  DollarSign,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


interface TransactionDetails extends Transaction {
  // The Transaction interface now includes sender, recipient, and fieldResponses
  // No need for additional interfaces as they're already defined in the API service
}

const TransactionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await transactionService.getTransactionById(id);
        setTransaction(data as TransactionDetails);
      } catch (error) {
        console.error('Error fetching transaction details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch transaction details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [id]);

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Active';
      case 2:
        return 'Inactive';
      case 3:
        return 'Blocked';
      case 4:
        return 'Suspended';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 2:
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 3:
        return 'bg-red-50 text-red-700 border-red-200';
      case 4:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getProcessingStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Processing';
      case 2:
        return 'Completed';
      case 3:
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getProcessingStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 1:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 2:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 3:
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getAccountStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Active';
      case 2:
        return 'Inactive';
      case 3:
        return 'Closed';
      case 4:
        return 'Suspended';
      default:
        return 'Unknown';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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


  // Helper to get field score information
  const getFieldScore = (fieldId: number) => {
    if (!transaction?.fieldResponses) return null;
    const response = transaction.fieldResponses.find((fr) => fr.fieldId === fieldId);
    return response ? {
      score: response.score,
      scoreCriteriaKey: response.scoreCriteriaKey,
      scoreCriteriaBGColor: response.scoreCriteriaBGColor,
      scoreCriteriaColor: response.scoreCriteriaColor
    } : null;
  };


  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <p className="text-muted-foreground text-xl font-medium">
              Loading transaction details...
            </p>
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
              <KeenIcon
                icon="document"
                style="duotone"
                className="text-3xl text-muted-foreground"
              />
            </div>
            <h2 className="text-3xl font-bold mb-4">Transaction Not Found</h2>
            <p className="text-muted-foreground text-lg mb-8">
              The transaction you are looking for does not exist or has been removed.
            </p>
            <Button
              onClick={() => navigate('/transactions')}
              variant="outline"
              size="lg"
              className="px-8"
            >
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
            <div className="flex items-center gap-3">
              <Badge
                className={`px-4 py-2 text-sm font-medium ${getStatusColor(transaction.transactionStatus)}`}
              >
                {getStatusLabel(transaction.transactionStatus)}
              </Badge>
              {transaction.processingStatus !== undefined && (
                <Badge
                  className={`px-4 py-2 text-sm font-medium ${getProcessingStatusColor(transaction.processingStatus)}`}
                >
                  {getProcessingStatusLabel(transaction.processingStatus)}
                </Badge>
              )}
            </div>
          </div>

          {/* Transaction Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Created</p>
                <p className="font-semibold text-blue-900">{formatDate(transaction.created!) || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Currency</p>
                <p className="font-semibold text-green-900">{transaction.transactionCurrencyName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Type</p>
                <p className="font-semibold text-purple-900">{transaction.transactionTypeName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Transaction Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Transaction #{transaction.transactionID}
                </h2>
                <p className="text-lg text-gray-600">
                  {transaction.transactionTypeName ||
                    `Transaction Type ${transaction.transactionTypeId}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary mb-1">
                  {transaction.transactionAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: transaction.transactionCurrencyName || 'USD'
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {transaction.transactionCurrencyName || 'USD'}
                </div>
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
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold">
                    {transaction.created ? formatDate(transaction.created) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">UUID</p>
                  <p className="font-mono text-xs break-all text-gray-700" title={transaction.uuid}>
                    {transaction.uuid}
                  </p>
                </div>
              </div>
            </div>

            {/* Purpose Section - Full Width */}
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium mb-2">Transaction Purpose</p>
                  <p className="text-gray-900 font-semibold break-words leading-relaxed">
                    {transaction.transactionPurpose}
                  </p>
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
                {transaction.sender ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Name</span>
                      <span className="font-medium">{transaction.sender.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Number</span>
                      <span className="font-mono font-medium">
                        {transaction.sender.number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Record</span>
                      <div className="flex items-center gap-2">
                        {transaction.sender.record ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                            onClick={() =>
                              navigate(`/records/${transaction.sender!.record!.id}`)
                            }
                          >
                            {transaction.sender.record.recordName}
                          </Button>
                        ) : (
                          <span className="font-medium text-gray-400">No record</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Bank</span>
                      <span className="font-medium">
                        {transaction.sender.bankOfCountryName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">City</span>
                      <span className="font-medium">{transaction.sender.bankOfCity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge
                        className={`text-xs ${getStatusColor(transaction.sender.accountStatus)}`}
                      >
                        {getAccountStatusLabel(transaction.sender.accountStatus)}
                      </Badge>
                    </div>
                    {transaction.sender.record && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Template</span>
                          <span className="font-medium">{transaction.sender.record.templateName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Customer Ref</span>
                          <span className="font-medium">{transaction.sender.record.customerReferenceId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Nationality</span>
                          <span className="font-medium">{transaction.sender.record.nationality}</span>
                        </div>
                      </>
                    )}
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
                {transaction.recipient ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Name</span>
                      <span className="font-medium">{transaction.recipient.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Number</span>
                      <span className="font-mono font-medium">
                        {transaction.recipient.number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Record</span>
                      <div className="flex items-center gap-2">
                        {transaction.recipient.record ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                            onClick={() =>
                              navigate(`/records/${transaction.recipient!.record!.id}`)
                            }
                          >
                            {transaction.recipient.record.recordName}
                          </Button>
                        ) : (
                          <span className="font-medium text-gray-400">No record</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Bank</span>
                      <span className="font-medium">
                        {transaction.recipient.bankOfCountryName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">City</span>
                      <span className="font-medium">{transaction.recipient.bankOfCity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge
                        className={`text-xs ${getStatusColor(transaction.recipient.accountStatus)}`}
                      >
                        {getAccountStatusLabel(transaction.recipient.accountStatus)}
                      </Badge>
                    </div>
                    {transaction.recipient.record && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Record Information
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Template</span>
                            <Badge variant="outline" className="text-xs">
                              {transaction.recipient.record.templateName}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Customer Ref</span>
                            <span className="font-mono text-xs">{transaction.recipient.record.customerReferenceId}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Nationality</span>
                            <span className="font-medium">{transaction.recipient.record.nationality}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Country of Birth</span>
                            <span className="font-medium">{transaction.recipient.record.countryOfBirth}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Date of Birth</span>
                            <span className="font-medium">{formatDateOnly(transaction.recipient.record.dateOfBirth)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Identification</span>
                            <span className="font-mono text-xs">{transaction.recipient.record.identification}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No recipient account</p>
                  </div>
                )}
              </div>
            </div>

          </div>


          {/* Field Responses Card */}
          {transaction.fieldResponses && transaction.fieldResponses.length > 0 && (
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="bg-primary/5 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Custom Fields
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Additional transaction information and scoring details.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {transaction.fieldResponses.map((fieldResponse) => {
                    const fieldScore = getFieldScore(fieldResponse.fieldId);
                    const fieldValue = fieldResponse.optionValue || 
                                     fieldResponse.valueText || 
                                     fieldResponse.valueNumber || 
                                     (fieldResponse.valueDate ? new Date(fieldResponse.valueDate).toLocaleDateString() : null);
                    
                    return (
                      <div
                        key={fieldResponse.id}
                        className="p-6 rounded-xl border bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{fieldResponse.fieldLabel}</h4>
                              <p className="text-xs text-gray-500">Field ID: {fieldResponse.fieldId}</p>
                            </div>
                          </div>
                          {fieldScore && fieldScore.score !== null && (
                            <Badge
                              className="text-xs font-medium"
                              style={{
                                backgroundColor: fieldScore.scoreCriteriaBGColor || '#f3f4f6',
                                color: fieldScore.scoreCriteriaColor || '#374151',
                                borderColor: fieldScore.scoreCriteriaColor || '#d1d5db'
                              }}
                            >
                              {fieldScore.scoreCriteriaKey || `Score: ${fieldScore.score}`}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-lg font-semibold text-gray-900">
                            {fieldValue || <span className="text-gray-400 italic">No value set</span>}
                          </div>
                        </div>
                        
                        {fieldResponse.fieldName !== fieldResponse.fieldLabel && (
                          <div className="mt-2 text-xs text-gray-500">
                            Internal Name: {fieldResponse.fieldName}
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
