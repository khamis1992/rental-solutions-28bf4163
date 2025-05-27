
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const createApiResponse = <T>(
  data: T,
  success = true,
  message?: string,
  error?: string
): ApiResponse<T> => {
  return {
    data,
    success,
    message,
    error,
  };
};

export const createErrorResponse = <T>(
  error: string,
  data: T | null = null
): ApiResponse<T> => {
  return {
    data: data as T,
    success: false,
    error,
  };
};

export const handleApiError = (error: any): ApiError => {
  if (error?.response?.data) {
    return {
      code: error.response.data.code || 'UNKNOWN_ERROR',
      message: error.response.data.message || 'An unknown error occurred',
      details: error.response.data.details,
    };
  }

  if (error?.message) {
    return {
      code: 'CLIENT_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
};

export const isApiError = (error: any): error is ApiError => {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
};

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> => {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};
