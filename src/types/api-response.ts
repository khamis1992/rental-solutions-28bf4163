export type ApiResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: Error | string;
  message?: string;
};

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function createErrorResponse(error: unknown, context?: string): ApiResponse {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'Unknown error';
      
  return {
    success: false,
    error: error instanceof Error ? error : new Error(errorMessage),
    message: context ? `${context}: ${errorMessage}` : errorMessage
  };
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage = 'Operation timed out'
): Promise<ApiResponse<T>> {
  try {
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), ms)
    );
    
    const result = await Promise.race([promise, timeout]);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error, 'Timeout Error');
  }
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number } = { retries: 3, delay: 1000 }
): Promise<ApiResponse<T>> {
  let lastError: unknown;
  
  for (let i = 0; i <= options.retries; i++) {
    try {
      const result = await fn();
      return createSuccessResponse(result);
    } catch (error) {
      lastError = error;
      if (i < options.retries) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
    }
  }
  
  return createErrorResponse(lastError, 'Max retries exceeded');
}

export interface Payment {
  id?: string;
  agreement_id: string;
  amount: number;
  description: string;
  type: string;
  status: string;
  due_date: string;
  is_recurring: boolean;
}
