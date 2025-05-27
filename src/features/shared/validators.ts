
import { VALIDATION_RULES } from './constants';

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.email.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return VALIDATION_RULES.phone.test(phone);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const { minLength, requireUppercase, requireLowercase, requireNumbers } = VALIDATION_RULES.password;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validateNumericRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (date: string): boolean => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

export const validateDateRange = (
  startDate: string,
  endDate: string
): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
};
