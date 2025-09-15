// Test utility for validation error handling
// This can be used to test the validation error display functionality

export const createMockValidationError = (field: string, message: string) => {
  return {
    response: {
      data: {
        validationErrors: {
          [field]: [message]
        }
      }
    }
  };
};

export const createMockServerError = (message: string) => {
  return {
    response: {
      data: {
        message: message
      }
    }
  };
};

// Example usage:
// const mockError = createMockValidationError('Number', 'Account number must be unique within the tenant.');
// This will create an error object that matches the format returned by the server
