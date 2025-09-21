import { useState, useEffect, useCallback, useRef } from 'react';
import {
  transactionService,
  TransactionProcessingStatus,
  TransactionProcessingStatusResponse
} from '@/services/api';
import { toast } from '@/components/ui/use-toast';

interface UseTransactionProcessingStatusOptions {
  transactionId: string;
  pollInterval?: number; // in milliseconds
  maxPollAttempts?: number;
  onComplete?: (result: TransactionProcessingStatusResponse) => void;
  onError?: (error: string) => void;
}

interface UseTransactionProcessingStatusReturn {
  status: TransactionProcessingStatusResponse | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  startPolling: (transactionId?: string) => void;
  stopPolling: () => void;
}

export const useTransactionProcessingStatus = ({
  transactionId,
  pollInterval = 2000, // 2 seconds default
  maxPollAttempts = 150, // 5 minutes max (150 * 2 seconds)
  onComplete,
  onError
}: UseTransactionProcessingStatusOptions): UseTransactionProcessingStatusReturn => {
  const [status, setStatus] = useState<TransactionProcessingStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStatus = useCallback(async (): Promise<TransactionProcessingStatusResponse> => {
    if (!transactionId || transactionId.trim() === '') {
      throw new Error('Invalid transaction ID. Please provide a valid transaction ID.');
    }
    
    const response = await transactionService.getTransactionProcessingStatus(transactionId);
    return response;
  }, [transactionId]);

  const checkForRuleMatches = useCallback((result: TransactionProcessingStatusResponse) => {
    if (result.hasRuleMatches && result.matchedRulesCount > 0) {
      const matchedRules = result.ruleMatches.filter((rule) => rule.isMatched);
      const ruleNames = matchedRules.map((rule) => rule.ruleName).join(', ');

      toast({
        title: 'Rule Matches Detected',
        description: `${result.matchedRulesCount} rule(s) matched: ${ruleNames}`,
        variant: 'destructive'
      });
    }
  }, []);

  const startPolling = useCallback((overrideTransactionId?: string) => {
    if (isPolling) {
      return;
    }
    
    const idToUse = overrideTransactionId || transactionId;
    if (!idToUse || idToUse.trim() === '') {
      console.warn('Cannot start polling: Invalid transaction ID', { overrideTransactionId, transactionId });
      return;
    }
    
    setIsPolling(true);
    setPollAttempts(0);
    setError(null);
    setLoading(true);

    const poll = async () => {
      try {
        // Use the override ID if provided, otherwise use the hook's transactionId
        const idToUse = overrideTransactionId || transactionId;
        if (!idToUse || idToUse.trim() === '') {
          console.warn('Cannot poll: Invalid transaction ID');
          return;
        }
        
        
        const result = await transactionService.getTransactionProcessingStatus(idToUse);
        setStatus(result);
        setLoading(false);

        // Check for rule matches and show alerts
        checkForRuleMatches(result);

        // Check if processing is complete or failed
        if (result.processingStatus === TransactionProcessingStatus.Completed) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete?.(result);
          toast({
            title: 'Processing Complete',
            description: 'Transaction processing has completed successfully'
          });
        } else if (result.processingStatus === TransactionProcessingStatus.Failed) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          const errorMsg = 'Transaction processing failed';
          setError(errorMsg);
          onError?.(errorMsg);
          toast({
            title: 'Processing Failed',
            description: 'Transaction processing has failed',
            variant: 'destructive'
          });
        } else {
          // Continue polling
          setPollAttempts((prev) => {
            const newAttempts = prev + 1;
            if (newAttempts >= maxPollAttempts) {
              setIsPolling(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              const timeoutMsg = 'Transaction processing timeout - please check status manually';
              setError(timeoutMsg);
              onError?.(timeoutMsg);
              toast({
                title: 'Processing Timeout',
                description: 'Transaction processing is taking longer than expected',
                variant: 'destructive'
              });
            }
            return newAttempts;
          });
        }
      } catch (err) {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch processing status';
        setError(errorMsg);
        setLoading(false);
        onError?.(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive'
        });
      }
    };

    // Initial fetch
    poll();

    // Set up polling interval
    intervalRef.current = setInterval(poll, pollInterval);
  }, [
    isPolling,
    transactionId,
    fetchStatus,
    checkForRuleMatches,
    maxPollAttempts,
    pollInterval,
    onComplete,
    onError
  ]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling
  };
};
