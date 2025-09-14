/**
 * Test Transaction API utility functions
 * Used for testing transaction processing functionality
 */

export interface TestTransactionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Test a specific transaction by ID
 * @param transactionId - The ID of the transaction to test
 * @returns Promise<TestTransactionResult>
 */
export const testSpecificTransaction = async (
  transactionId: number
): Promise<TestTransactionResult> => {
  try {
    // For now, this is a mock implementation
    // In a real scenario, this would make an API call to test the transaction

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response for demo purposes
    return {
      success: true,
      data: {
        transactionId,
        status: 'processed',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Test multiple transactions
 * @param transactionIds - Array of transaction IDs to test
 * @returns Promise<TestTransactionResult[]>
 */
export const testMultipleTransactions = async (
  transactionIds: number[]
): Promise<TestTransactionResult[]> => {
  const results: TestTransactionResult[] = [];

  for (const id of transactionIds) {
    const result = await testSpecificTransaction(id);
    results.push(result);
  }

  return results;
};

/**
 * Test transaction processing with custom parameters
 * @param params - Custom test parameters
 * @returns Promise<TestTransactionResult>
 */
export const testTransactionWithParams = async (params: {
  transactionId: number;
  testType?: string;
  timeout?: number;
}): Promise<TestTransactionResult> => {
  try {
    // Simulate API call with custom parameters
    await new Promise((resolve) => setTimeout(resolve, params.timeout || 1000));

    return {
      success: true,
      data: {
        transactionId: params.transactionId,
        testType: params.testType || 'default',
        status: 'processed',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
