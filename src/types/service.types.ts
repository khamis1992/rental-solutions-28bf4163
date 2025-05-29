
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string | Error;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string | Error;
  message?: string;
}
