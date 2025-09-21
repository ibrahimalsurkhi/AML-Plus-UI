import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  transactionService,
  ruleService,
  type TransactionCaseDetails,
  type TransactionCase,
  type PaginatedResponse,
  type RuleDetails,
  type Rule,
  type Transaction,
  type TransactionParticipant,
  type TransactionFieldResponse
} from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { KeenIcon } from '@/components/keenicons';
import { formatCurrencyUSD, formatCurrency } from '@/utils/currency';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  DollarSign,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useTransactionProcessingStatus } from '@/hooks/useTransactionProcessingStatus';

interface TransactionDetails extends Transaction {
  // The Transaction interface now includes sender, recipient, and fieldResponses
  // No need for additional interfaces as they're already defined in the API service
}

const TransactionCaseDetailsPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<TransactionCaseDetails | null>(null);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [relatedCases, setRelatedCases] = useState<PaginatedResponse<TransactionCase> | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [relatedCasesLoading, setRelatedCasesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reExecuting, setReExecuting] = useState(false);
  const [processingTransactionId, setProcessingTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!uuid) return;

      try {
        setLoading(true);
        const data = await transactionService.getTransactionCaseByUuid(uuid);
        setCaseData(data);
        setError(null);

        // Fetch transaction details using the transactionUuid from case data
        if (data.tranactionUuid) {
          await fetchTransactionDetails(data.tranactionUuid);
        }

        // Fetch related cases if we have account information
        if (data.accountId) {
          fetchRelatedCases(data.accountId);
        }
      } catch (err) {
        setError('Failed to fetch case details');
        toast({
          title: 'Error',
          description: 'Failed to fetch case details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactionDetails = async (transactionUuid: string) => {
      try {
        setTransactionLoading(true);
        const transactionData = await transactionService.getTransactionById(transactionUuid);
        setTransaction(transactionData as TransactionDetails);
      } catch (err) {
        console.error('Error fetching transaction details:', err);
        toast({
          title: 'Warning',
          description: 'Failed to fetch transaction details. Case information is still available.',
          variant: 'default'
        });
      } finally {
        setTransactionLoading(false);
      }
    };

    const fetchRelatedCases = async (accountId: number) => {
      try {
        setRelatedCasesLoading(true);
        const data = await transactionService.getTransactionCases({
          pageNumber: 1,
          pageSize: 10,
          accountId: accountId
        });
        setRelatedCases(data);
      } catch (err) {
        console.error('Failed to fetch related cases:', err);
      } finally {
        setRelatedCasesLoading(false);
      }
    };


    fetchCaseData();
  }, [uuid]);

  // Callback when processing completes
  const handleProcessingComplete = useCallback(async (result: any) => {
    console.log('Transaction re-execution completed:', result);
    
    // Refresh transaction details to get updated status
    if (caseData?.tranactionUuid) {
      try {
        const updatedData = await transactionService.getTransactionById(caseData.tranactionUuid);
        setTransaction(updatedData as TransactionDetails);
      } catch (error) {
        console.error('Error refreshing transaction details:', error);
      }
    }
    
    // Refresh case data to show any updates
    if (uuid) {
      try {
        const updatedCaseData = await transactionService.getTransactionCaseByUuid(uuid);
        setCaseData(updatedCaseData);
      } catch (error) {
        console.error('Error refreshing case data:', error);
      }
    }
    
    // Reset processing state
    setProcessingTransactionId(null);
    setReExecuting(false);
  }, [caseData?.tranactionUuid, uuid]);

  // Callback when processing encounters an error
  const handleProcessingError = useCallback((error: string) => {
    console.error('Transaction re-execution error:', error);
    setProcessingTransactionId(null);
    setReExecuting(false);
  }, []);

  // Use the transaction processing status hook
  const {
    status: processingStatus,
    loading: processingLoading,
    error: processingError,
    isPolling,
    startPolling,
    stopPolling
  } = useTransactionProcessingStatus({
    transactionId: processingTransactionId || '', // Use empty string as invalid ID to prevent hook from running
    pollInterval: 2000,
    maxPollAttempts: 150,
    onComplete: handleProcessingComplete,
    onError: handleProcessingError
  });

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleReExecute = async () => {
    if (!caseData?.tranactionUuid) return;
    
    console.log('Starting re-execution for transaction:', caseData.tranactionUuid);
    setReExecuting(true);
    
    try {
      console.log('Calling reExecuteTransaction API...');
      await transactionService.reExecuteTransaction(caseData.tranactionUuid);
      
      console.log('Re-execution API call successful, setting processing transaction ID:', caseData.tranactionUuid);
      
      // Set the transaction ID for processing status monitoring
      setProcessingTransactionId(caseData.tranactionUuid);
      
      // Start polling after a short delay to ensure state is updated
      setTimeout(() => {
        console.log('Starting polling for re-executed transaction:', caseData.tranactionUuid);
        startPolling(caseData.tranactionUuid); // Pass the transaction ID directly
      }, 200);
      
      toast({
        title: 'Success',
        description: 'Transaction re-execution started successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error re-executing transaction:', error);
      setReExecuting(false);
      toast({
        title: 'Error',
        description: 'Failed to re-execute transaction. Please try again.',
        variant: 'destructive'
      });
    }
  };

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

  const getTypeLabel = (type: number) => {
    return caseData?.transactionType?.name || `Type ${type}`;
  };

  const formatAmount = (amount: number) => {
    return formatCurrencyUSD(amount);
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

  const formatUuid = (uuid: string) => {
    return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 4);
  };

  // Helper to get field score information
  const getFieldScore = (fieldId: number) => {
    if (!transaction?.fieldResponses) return null;
    const response = transaction.fieldResponses.find((fr) => fr.fieldId === fieldId);
    return response
      ? {
          score: response.score,
          scoreCriteriaKey: response.scoreCriteriaKey,
          scoreCriteriaBGColor: response.scoreCriteriaBGColor,
          scoreCriteriaColor: response.scoreCriteriaColor
        }
      : null;
  };

  const handleViewRelatedCase = (uuid: string) => {
    navigate(`/transaction-cases/${uuid}`);
  };

  const getRuleTypeLabel = (ruleType: number) => {
    switch (ruleType) {
      case 1:
        return 'Transaction Monitoring';
      case 2:
        return 'Transaction Screening';
      case 3:
        return 'Financial Fraud';
      case 4:
        return 'Anti-Concealment';
      default:
        return `Type ${ruleType}`;
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'alert':
        return 'Generate Alert';
      case 'block':
        return 'Block Transaction';
      case 'flag':
        return 'Flag for Review';
      case 'report':
        return 'Generate Report';
      default:
        return actionType;
    }
  };


  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <p className="text-muted-foreground text-xl font-medium">
              Loading case details...
            </p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <div className="flex items-center gap-2">
              <KeenIcon icon="shield-tick" style="duotone" className="text-primary" />
              Transaction Case Details
            </div>
          </ToolbarHeading>
        </Toolbar>

        <div className="text-center py-16">
          <KeenIcon
            icon="shield-tick"
            style="duotone"
            className="text-muted-foreground text-4xl mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold mb-2">Error Loading Case</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/transaction-cases')}>
              <KeenIcon icon="arrow-left" style="duotone" className="mr-2" />
              Back to Cases
            </Button>
            <Button variant="outline" onClick={() => navigate('/transactions/new')}>
              <KeenIcon icon="plus" style="duotone" className="mr-2" />
              Create Transaction
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>Transaction Case Details</ToolbarHeading>
      </Toolbar>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/transaction-cases')}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction Case Details</h1>
            </div>
            <div className="flex items-center gap-3">
              {caseData?.tranactionUuid && (
                <Button
                  onClick={handleReExecute}
                  disabled={reExecuting || isPolling}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${(reExecuting || isPolling) ? 'animate-spin' : ''}`} />
                  {reExecuting || isPolling ? 'Processing...' : 'Re-execute'}
                </Button>
              )}
              {caseData && (
                <Badge
                  className={`px-4 py-2 text-sm font-medium ${getStatusColor(caseData.status)}`}
                >
                  {getStatusLabel(caseData.status)}
                </Badge>
              )}
              {transaction?.processingStatus !== undefined && (
                <Badge
                  className={`px-4 py-2 text-sm font-medium ${getProcessingStatusColor(transaction.processingStatus)}`}
                >
                  {getProcessingStatusLabel(transaction.processingStatus)}
                </Badge>
              )}
              {(reExecuting || isPolling) && (
                <Badge className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border-blue-200">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              )}
            </div>
          </div>

          {/* Case Info Cards */}
          {caseData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Created</p>
                  <p className="font-semibold text-blue-900">
                    {formatDate(caseData.created) || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Amount</p>
                  <p className="font-semibold text-green-900">
                    {formatAmount(caseData.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Type</p>
                  <p className="font-semibold text-purple-900">{caseData.transactionType?.name || `Type ${caseData.type}`}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {caseData ? (
            <div className="grid gap-6 mt-6">
          {/* Case Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Case Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Basic Case Information */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <KeenIcon icon="shield-tick" style="duotone" className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Basic Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Case UUID</span>
                    <span className="font-mono font-medium text-sm">{caseData.uuid}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <Badge
                      className={`text-xs ${getStatusColor(caseData.status)}`}
                    >
                      {getStatusLabel(caseData.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="font-medium">{formatDate(caseData.created)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Created By</span>
                    <span className="font-medium">{caseData.createdBy || 'System'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Last Modified</span>
                    <span className="font-medium">{formatDate(caseData.lastModified)}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Information */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Transaction Details</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="font-medium">
                      {caseData.transactionType?.name || `Type ${caseData.type}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="font-medium">{formatAmount(caseData.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Currency</span>
                    <span className="font-medium">{caseData.currency?.value || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Account ID</span>
                    <span className="font-mono font-medium">{caseData.accountId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Rule Execution ID</span>
                    <span className="font-mono font-medium">{caseData.ruleExecutionId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Account & Related Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Account Details */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Account Information</h4>
                </div>
                {caseData.account ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Name</span>
                      <span className="font-medium">{caseData.account.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Number</span>
                      <span className="font-mono font-medium">{caseData.account.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Bank Country</span>
                      <span className="font-medium">{caseData.account.bankOfCountryName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Bank City</span>
                      <span className="font-medium">{caseData.account.bankOfCity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Account Status</span>
                      <Badge
                        className={`text-xs ${getStatusColor(caseData.account.accountStatus)}`}
                      >
                        {getAccountStatusLabel(caseData.account.accountStatus)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Building className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No account information available</p>
                  </div>
                )}
              </div>

              {/* Record Details */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Record Information</h4>
                </div>
                {caseData.record ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Full Name</span>
                      <span className="font-medium">
                        {`${caseData.record.firstName} ${caseData.record.middleName || ''} ${caseData.record.lastName}`.trim()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Date of Birth</span>
                      <span className="font-medium">{formatDateOnly(caseData.record.dateOfBirth)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Identification</span>
                      <span className="font-mono font-medium text-xs">{caseData.record.identification}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Record Details</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                        onClick={() => navigate(`/records/${caseData.record!.id}`)}
                      >
                        View Record Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No record information available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          {transaction && (
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
                    {formatCurrency(
                      transaction.transactionAmount,
                      transaction.transactionCurrencyName
                    )}
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
              {transaction.transactionPurpose && (
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
              )}
            </div>
          )}

          {/* Accounts Section */}
          {transaction && (
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
                        <span className="font-mono font-medium">{transaction.sender.number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Record</span>
                        <div className="flex items-center gap-2">
                          {transaction.sender.record ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                              onClick={() => navigate(`/records/${transaction.sender!.record!.id}`)}
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
                        <span className="font-medium">{transaction.sender.bankOfCountryName}</span>
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
                        <span className="font-mono font-medium">{transaction.recipient.number}</span>
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
                        <span className="font-medium">{transaction.recipient.bankOfCountryName}</span>
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
                              <span className="font-mono text-xs">
                                {transaction.recipient.record.customerReferenceId}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Nationality</span>
                              <span className="font-medium">
                                {transaction.recipient.record.nationality}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Country of Birth</span>
                              <span className="font-medium">
                                {transaction.recipient.record.countryOfBirth}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Date of Birth</span>
                              <span className="font-medium">
                                {formatDateOnly(transaction.recipient.record.dateOfBirth)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Identification</span>
                              <span className="font-mono text-xs">
                                {transaction.recipient.record.identification}
                              </span>
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
          )}

          {/* Field Responses Card */}
          {transaction?.fieldResponses && transaction.fieldResponses.length > 0 && (
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
                    const fieldValue =
                      fieldResponse.optionValue ||
                      fieldResponse.valueText ||
                      fieldResponse.valueNumber ||
                      (fieldResponse.valueDate
                        ? new Date(fieldResponse.valueDate).toLocaleDateString()
                        : null);

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
                              <h4 className="font-semibold text-gray-900">
                                {fieldResponse.fieldLabel}
                              </h4>
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
                            {fieldValue || (
                              <span className="text-gray-400 italic">No value set</span>
                            )}
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

          {/* Processing Status Section */}
          {(reExecuting || isPolling) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Processing Transaction</h3>
                  <p className="text-sm text-gray-600">
                    Re-executing transaction and monitoring rule execution results...
                  </p>
                </div>
              </div>
              
              {processingStatus && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">
                        Status: {processingStatus.processingStatus === 1 ? 'Processing' : 'Completed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">
                        Rules Matched: {processingStatus.matchedRulesCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">
                        Processing Time: {processingStatus.processingCompletedAt ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rule Preview */}
          {caseData?.matchedRule && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <KeenIcon icon="document" style="duotone" className="text-primary" />
                  Rule Preview
                </h3>
                {caseData.matchedRule.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/rules/${caseData.matchedRule!.id}`)}
                    className="bg-white hover:bg-gray-50"
                  >
                    <KeenIcon icon="external-link" style="outline" className="h-4 w-4 mr-2" />
                    View Full Rule
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Rule Information */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="document" style="duotone" className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Rule Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rule Name</span>
                      <span className="font-medium">{caseData.matchedRule.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rule ID</span>
                      <span className="font-mono font-medium">{caseData.matchedRule.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rule UUID</span>
                      <span className="font-mono font-medium text-xs">{caseData.matchedRule.uuid}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rule Type</span>
                      <Badge variant="outline" className="text-xs">
                        {getRuleTypeLabel(caseData.matchedRule.ruleType)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Active</span>
                      <Badge
                        className={`text-xs ${caseData.matchedRule.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {caseData.matchedRule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Created</span>
                      <span className="font-medium">{formatDate(caseData.matchedRule.created)}</span>
                    </div>
                  </div>
                </div>

                {/* Rule Preview */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="code" style="duotone" className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Rule Conditions</h4>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">Rule Preview:</div>
                    <div className="text-sm font-mono text-gray-800 leading-relaxed bg-white rounded-md p-4 border border-blue-100">
                      {caseData.matchedRule.rulePreview || 'Rule preview not available'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Related Cases Grid */}
          {caseData?.accountId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeenIcon icon="shield-tick" style="duotone" className="text-primary" />
                  Related Cases (Same Account)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatedCasesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading related cases...</span>
                  </div>
                ) : relatedCases && relatedCases.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case UUID</TableHead>
                          <TableHead>Rule Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatedCases.items
                          .filter((caseItem) => caseItem.caseUuid !== caseData.uuid) // Exclude current case
                          .map((caseItem) => (
                            <TableRow key={caseItem.id} className="hover:bg-muted/50">
                              <TableCell className="font-mono text-sm">
                                <div className="flex items-center gap-2">
                                  <KeenIcon
                                    icon="shield-tick"
                                    style="outline"
                                    className="text-primary"
                                  />
                                  {formatUuid(caseItem.caseUuid)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {caseItem.ruleName ? (
                                  <div className="flex items-center gap-2">
                                    <KeenIcon
                                      icon="document"
                                      style="outline"
                                      className="text-muted-foreground"
                                    />
                                    <span>{caseItem.ruleName}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">No rule</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <KeenIcon
                                    icon="sort"
                                    style="outline"
                                    className="text-muted-foreground"
                                  />
                                  Type {caseItem.type}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD'
                                }).format(caseItem.amount)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}
                                >
                                  {getStatusLabel(caseItem.status)}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(caseItem.created)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewRelatedCase(caseItem.caseUuid)}
                                  className="h-8 px-2"
                                >
                                  <KeenIcon icon="eye" style="outline" className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <KeenIcon
                      icon="shield-tick"
                      style="duotone"
                      className="text-muted-foreground text-3xl mx-auto mb-2"
                    />
                    <p className="text-muted-foreground">No other cases found for this account</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

            <div className="flex gap-2">
              <Button onClick={() => navigate('/transaction-cases')}>
                <KeenIcon icon="arrow-left" style="duotone" className="mr-2" />
                Back to Cases
              </Button>
              <Button variant="outline" onClick={() => navigate('/transactions/new')}>
                <KeenIcon icon="plus" style="duotone" className="mr-2" />
                Create Transaction
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <KeenIcon
              icon="shield-tick"
              style="duotone"
              className="text-muted-foreground text-4xl mx-auto mb-4"
            />
            <h2 className="text-2xl font-semibold mb-2">No Case Data</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load case details. Please try again.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/transaction-cases')}>
                <KeenIcon icon="arrow-left" style="duotone" className="mr-2" />
                Back to Cases
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </Container>
  );
};

export default TransactionCaseDetailsPage;
