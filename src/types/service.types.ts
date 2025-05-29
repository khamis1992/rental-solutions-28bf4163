
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ServiceError {
  message: string;
  code?: string;
}
