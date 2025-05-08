
// Error handler for API errors
export const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  
  // Determine the error message to display
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as any).message);
  }
  
  // Return standard error format
  return {
    success: false,
    error: errorMessage,
    data: null
  };
};

// Success handler for API responses
export const handleApiSuccess = <T>(data: T) => {
  return {
    success: true,
    data,
    error: null
  };
};
