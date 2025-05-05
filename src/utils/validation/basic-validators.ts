
/**
 * Basic validation utility functions for common data types
 */

// Utility function to validate date format (YYYY-MM-DD)
export const isValidDateFormat = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
};

// Utility function to validate time format (HH:MM)
export const isValidTimeFormat = (timeString: string): boolean => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
};

// Utility function to validate email format
export const isValidEmailFormat = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Utility function to validate phone number format (Qatar format)
export const isValidPhoneNumberFormat = (phoneNumber: string): boolean => {
  // For 8-digit Qatar numbers (without country code)
  const qatarRegex = /^[3-9]\d{7}$/;
  
  // For numbers with +974 country code
  const qatarWithCodeRegex = /^(?:\+974)?[3-9]\d{7}$/;
  
  return qatarRegex.test(phoneNumber) || qatarWithCodeRegex.test(phoneNumber);
};

// Utility function to validate URL format
export const isValidURLFormat = (url: string): boolean => {
  const regex = /^(ftp|http|https):\/\/[^ "]+$/;
  return regex.test(url);
};

// Utility function to validate positive number
export const isValidPositiveNumber = (number: number): boolean => {
  return number > 0;
};

// Utility function to validate integer number
export const isValidIntegerNumber = (number: number): boolean => {
  return Number.isInteger(number);
};

// Utility function to validate alphanumeric string
export const isValidAlphanumericString = (str: string): boolean => {
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(str);
};

// Utility function to validate string with spaces
export const isValidStringWithSpaces = (str: string): boolean => {
  const regex = /^[a-zA-Z\s]*$/;
  return regex.test(str);
};

// Utility function to validate strong password
export const isValidStrongPassword = (password: string): boolean => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
  return regex.test(password);
};

// Utility function to validate empty string
export const isEmptyString = (str: string): boolean => {
  return str.trim() === '';
};

// Fix the instanceof check to ensure it works with proper types
export const isValidDate = (date: unknown): boolean => {
  return date && typeof date === 'object' && 'getTime' in date && typeof date.getTime === 'function';
};
