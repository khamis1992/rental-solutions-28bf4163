/**
 * Determines if an error is retryable based on status code and error type
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    const status = response?.status;
    
    return (
      !status ||
      status === 408 ||
      status === 429 ||
      (status >= 500 && status < 600)
    );
  }
  
  if (error instanceof Error) {
    const networkErrorMessages = [
      'network',
      'connection',
      'timeout',
      'abort',
      'socket',
    ];
    
    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }
  
  return false;
};

/**
 * Exponential backoff for retries
 */
export const getRetryDelay = (retryCount: number, initialDelay = 1000): number => {
  return Math.min(
    initialDelay * Math.pow(2, retryCount), // Exponential backoff
    30000 // Max delay: 30 seconds
  );
};

/**
 * Configure React Query retry logic
 */
export const defaultRetryConfig = {
  retries: 3,
  retryDelay: getRetryDelay,
  retryIf: isRetryableError,
};
