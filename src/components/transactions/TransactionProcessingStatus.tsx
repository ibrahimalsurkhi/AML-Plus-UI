import React from 'react';
import { KeenIcon } from '@/components/keenicons';
import { Alert } from '@/components/alert';
import { TransactionProcessingStatus as ProcessingStatus, TransactionProcessingStatusResponse, RuleMatch } from '@/services/api';

interface TransactionProcessingStatusProps {
  status: TransactionProcessingStatusResponse | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  onStartPolling: () => void;
  onStopPolling: () => void;
}

const getStatusIcon = (status: ProcessingStatus) => {
  switch (status) {
    case ProcessingStatus.Pending:
      return 'clock';
    case ProcessingStatus.Processing:
      return 'refresh';
    case ProcessingStatus.Completed:
      return 'check-circle';
    case ProcessingStatus.Failed:
      return 'close-circle';
    default:
      return 'information-2';
  }
};

const getStatusColor = (status: ProcessingStatus) => {
  switch (status) {
    case ProcessingStatus.Pending:
      return 'text-warning';
    case ProcessingStatus.Processing:
      return 'text-primary';
    case ProcessingStatus.Completed:
      return 'text-success';
    case ProcessingStatus.Failed:
      return 'text-danger';
    default:
      return 'text-muted-foreground';
  }
};

const getStatusText = (status: ProcessingStatus) => {
  switch (status) {
    case ProcessingStatus.Pending:
      return 'Pending';
    case ProcessingStatus.Processing:
      return 'Processing';
    case ProcessingStatus.Completed:
      return 'Completed';
    case ProcessingStatus.Failed:
      return 'Failed';
    default:
      return 'Unknown';
  }
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const RuleMatchItem: React.FC<{ rule: RuleMatch }> = ({ rule }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border ${
    rule.isMatched ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="flex items-center gap-2">
      <KeenIcon 
        icon={rule.isMatched ? 'alert-circle' : 'check-circle'} 
        className={`text-lg ${rule.isMatched ? 'text-red-500' : 'text-green-500'}`}
      />
      <span className="font-medium text-sm">{rule.ruleName}</span>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={`px-2 py-1 rounded-full ${
        rule.isMatched ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      }`}>
        {rule.isMatched ? 'Matched' : 'No Match'}
      </span>
      <span>{formatDateTime(rule.executedAt)}</span>
    </div>
  </div>
);

export const TransactionProcessingStatus: React.FC<TransactionProcessingStatusProps> = ({
  status,
  loading,
  error,
  isPolling,
  onStartPolling,
  onStopPolling
}) => {
  if (loading && !status) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <KeenIcon icon="refresh" className="animate-spin text-lg text-primary" />
          <span className="text-sm text-muted-foreground">Loading processing status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" icon="close-circle">
        <div className="space-y-2">
          <p className="font-medium">Error Loading Processing Status</p>
          <p className="text-sm">{error}</p>
        </div>
      </Alert>
    );
  }

  if (!status) {
    return (
      <div className="text-center p-8">
        <KeenIcon icon="information-2" className="text-4xl text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">No processing status available</p>
        <p className="text-sm text-muted-foreground mb-4">
          Transaction processing status will appear here once monitoring starts.
        </p>
        <button
          onClick={onStartPolling}
          className="px-4 py-2 bg-primary text-primary-inverse rounded-lg hover:bg-primary-dark transition-colors"
        >
          Start Monitoring
        </button>
      </div>
    );
  }

  const matchedRules = status.ruleMatches.filter(rule => rule.isMatched);
  const unmatchedRules = status.ruleMatches.filter(rule => !rule.isMatched);

  return (
    <div className="space-y-6">
      {/* Header with status and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeenIcon 
            icon={getStatusIcon(status.processingStatus)} 
            className={`text-2xl ${getStatusColor(status.processingStatus)}`}
          />
          <div>
            <h3 className="font-semibold text-lg">Transaction Processing Status</h3>
            <p className={`text-sm font-medium ${getStatusColor(status.processingStatus)}`}>
              {getStatusText(status.processingStatus)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isPolling ? (
            <button
              onClick={onStopPolling}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={onStartPolling}
              className="px-3 py-1.5 text-sm bg-primary text-primary-inverse rounded-lg hover:bg-primary-dark transition-colors"
            >
              Start Monitoring
            </button>
          )}
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Transaction ID</p>
          <p className="font-medium">{status.transactionID}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Internal ID</p>
          <p className="font-medium">#{status.transactionId}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Processing Started</p>
          <p className="font-medium">{formatDateTime(status.processingStartedAt)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Processing Completed</p>
          <p className="font-medium">{formatDateTime(status.processingCompletedAt)}</p>
        </div>
      </div>

      {/* Rule Evaluation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{status.totalRulesEvaluated}</p>
          <p className="text-sm text-blue-700">Total Rules Evaluated</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{status.matchedRulesCount}</p>
          <p className="text-sm text-red-700">Rules Matched</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{status.totalRulesEvaluated - status.matchedRulesCount}</p>
          <p className="text-sm text-green-700">Rules Passed</p>
        </div>
      </div>

      {/* Rule Matches Alert */}
      {status.hasRuleMatches && matchedRules.length > 0 && (
        <Alert variant="danger" icon="alert-circle">
          <div className="space-y-2">
            <p className="font-medium">⚠️ Rule Matches Detected</p>
            <p className="text-sm">
              {status.matchedRulesCount} rule(s) matched this transaction. This may indicate potential compliance issues.
            </p>
          </div>
        </Alert>
      )}

      {/* Rule Execution Details */}
      {status.ruleMatches.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Rule Execution Details</h4>
          
          {/* Matched Rules */}
          {matchedRules.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-red-700 flex items-center gap-2">
                <KeenIcon icon="alert-circle" className="text-lg" />
                Matched Rules ({matchedRules.length})
              </h5>
              <div className="space-y-2">
                {matchedRules.map((rule) => (
                  <RuleMatchItem key={rule.ruleId} rule={rule} />
                ))}
              </div>
            </div>
          )}

          {/* Unmatched Rules */}
          {unmatchedRules.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-green-700 flex items-center gap-2">
                <KeenIcon icon="check-circle" className="text-lg" />
                Passed Rules ({unmatchedRules.length})
              </h5>
              <div className="space-y-2">
                {unmatchedRules.map((rule) => (
                  <RuleMatchItem key={rule.ruleId} rule={rule} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing Status Details */}
      {status.processingStatus === ProcessingStatus.Processing && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <KeenIcon icon="refresh" className="animate-spin text-blue-500" />
          <span className="text-sm text-blue-700">
            Transaction is currently being processed. Rules are being evaluated...
          </span>
        </div>
      )}

      {status.processingStatus === ProcessingStatus.Failed && (
        <Alert variant="danger" icon="close-circle">
          <p className="font-medium">Transaction processing has failed</p>
          <p className="text-sm">Please contact support if this issue persists.</p>
        </Alert>
      )}
    </div>
  );
}; 