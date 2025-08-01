import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransactionProcessingStatus } from '@/hooks/useTransactionProcessingStatus';
import { TransactionProcessingStatus } from '@/components/transactions/TransactionProcessingStatus';
import { toast } from '@/components/ui/use-toast';
import { testSpecificTransaction } from '@/utils/testTransactionAPI';

const TransactionProcessingDemoPage = () => {
  const [transactionId, setTransactionId] = useState<number>(123);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const {
    status: processingStatus,
    loading: processingLoading,
    error: processingError,
    isPolling,
    startPolling,
    stopPolling
  } = useTransactionProcessingStatus({
    transactionId,
    pollInterval: 2000, // 2 seconds
    maxPollAttempts: 150, // 5 minutes max
    onComplete: (result) => {
      console.log('Transaction processing completed:', result);
      toast({
        title: 'Processing Complete',
        description: 'Transaction processing has completed successfully',
      });
    },
    onError: (error) => {
      console.error('Transaction processing error:', error);
      toast({
        title: 'Processing Error',
        description: error,
        variant: 'destructive'
      });
    }
  });

  const handleStartMonitoring = () => {
    if (transactionId > 0) {
      setIsMonitoring(true);
      startPolling();
      toast({
        title: 'Monitoring Started',
        description: `Started monitoring transaction #${transactionId}`,
      });
    } else {
      toast({
        title: 'Invalid Transaction ID',
        description: 'Please enter a valid transaction ID (must be greater than 0)',
        variant: 'destructive'
      });
    }
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    stopPolling();
    toast({
      title: 'Monitoring Stopped',
      description: 'Transaction monitoring has been stopped',
    });
  };

  const handleTestAPI = async () => {
    if (transactionId > 0) {
      try {
        const result = await testSpecificTransaction(transactionId);
        if (result.success) {
          toast({
            title: 'API Test Successful',
            description: `Successfully tested transaction #${transactionId}`,
          });
        } else {
          toast({
            title: 'API Test Failed',
            description: result.error || 'Unknown error',
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast({
          title: 'API Test Error',
          description: 'Failed to test API',
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Invalid Transaction ID',
        description: 'Please enter a valid transaction ID to test',
        variant: 'destructive'
      });
    }
  };

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>Transaction Processing Demo</ToolbarHeading>
      </Toolbar>

      <div className="space-y-6">
        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary">Demo Controls</span>
            </CardTitle>
            <CardDescription>
              Test the transaction processing status monitoring functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  type="number"
                  min="1"
                  value={transactionId}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setTransactionId(value > 0 ? value : 0);
                  }}
                  placeholder="Enter transaction ID"
                  disabled={isPolling}
                />
              </div>
              <div className="flex items-end gap-2">
                {!isPolling ? (
                  <Button onClick={handleStartMonitoring} className="w-full">
                    Start Monitoring
                  </Button>
                ) : (
                  <Button onClick={handleStopMonitoring} variant="outline" className="w-full">
                    Stop Monitoring
                  </Button>
                )}
                <Button onClick={handleTestAPI} variant="secondary" className="w-full">
                  Test API
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>Test Transaction IDs:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><code>123</code> - Transaction with rule matches (High Value + Suspicious Pattern)</li>
                <li><code>456</code> - Transaction with no rule matches</li>
                <li><code>789</code> - Transaction still processing</li>
                <li><code>999</code> - Non-existent transaction (will show error)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Processing Status Display */}
        {isMonitoring && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary">Processing Status</span>
                {isPolling && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span>Live Monitoring</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Real-time monitoring of transaction processing and rule evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionProcessingStatus
                status={processingStatus}
                loading={processingLoading}
                error={processingError}
                isPolling={isPolling}
                onStartPolling={startPolling}
                onStopPolling={stopPolling}
              />
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Enter a Transaction ID</h4>
              <p className="text-sm text-muted-foreground">
                Use one of the test transaction IDs above to simulate different scenarios.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Start Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                Click "Start Monitoring" to begin polling the API for processing status updates.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Watch Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">
                The system will poll every 2 seconds until processing is complete or failed.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Rule Match Alerts</h4>
              <p className="text-sm text-muted-foreground">
                If any rules match the transaction, you'll see toast notifications and visual alerts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default TransactionProcessingDemoPage; 