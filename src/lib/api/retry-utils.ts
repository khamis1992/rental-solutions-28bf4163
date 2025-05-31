/**
 * Configuration options for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
  retryableErrorMessages: string[];
}

/**
 * Default retry configuration
 */
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrorMessages: [
    'network',
    'connection',
    'timeout',
    'abort',
    'socket',
    'econnrefused',
    'econnreset',
  ],
};

/**
 * Determines if an error is retryable based on status code and error type
 */
export const isRetryableError = (error: unknown, config: RetryConfig = defaultRetryConfig): boolean => {
  // Check for response status codes
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    const status = response?.status;
    
    return (
      !status ||
      config.retryableStatusCodes.includes(status)
    );
  }
  
  // Check for network-related error messages
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return config.retryableErrorMessages.some(msg => 
      errorMessage.includes(msg)
    );
  }
  
  return false;
};

/**
 * Calculate exponential backoff delay with jitter
 */
export const getRetryDelay = (
  retryCount: number, 
  config: RetryConfig = defaultRetryConfig
): number => {
  const exponentialDelay = config.initialDelay * Math.pow(
    config.backoffFactor, 
    retryCount
  );
  
  // Add jitter to prevent thundering herd problem
  const jitter = Math.random() * 0.1 * exponentialDelay;
  
  return Math.min(
    exponentialDelay + jitter,
    config.maxDelay
  );
};

/**
 * Configure React Query retry logic
 */
export const getRetryConfig = (config: Partial<RetryConfig> = {}) => {
  const mergedConfig = { ...defaultRetryConfig, ...config };
  
  return {
    retries: mergedConfig.maxRetries,
    retryDelay: (retryCount: number) => getRetryDelay(retryCount, mergedConfig),
    retryIf: (error: unknown) => isRetryableError(error, mergedConfig),
  };
};
