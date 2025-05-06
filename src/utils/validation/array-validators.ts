
/**
 * Array validation utility functions for collections of values
 */

import { 
  isValidEmailFormat, 
  isValidPhoneNumberFormat, 
  isValidURLFormat 
} from './basic-validators';
import { isValidJSONString } from './type-validators';
import { 
  isValidMACAddress, 
  isValidIPAddress, 
  isValidHexColor 
} from './geo-validators';
import { 
  isValidPostalCode, 
  isValidCreditCardNumber, 
  isValidExpiryDateFormat, 
  isValidCVV 
} from './payment-validators';
import {
  isValidDateRange,
  isValidFutureDate,
  isValidPastDate,
  isValidTimeRange
} from './date-validators';
import {
  isValidFileSize,
  isValidFileType
} from './file-validators';

// Utility function to validate array of emails
export const isValidArrayOfEmails = (emails: string[]): boolean => {
  return emails.every(email => isValidEmailFormat(email));
};

// Utility function to validate array of phone numbers
export const isValidArrayOfPhoneNumbers = (phoneNumbers: string[]): boolean => {
  return phoneNumbers.every(phoneNumber => isValidPhoneNumberFormat(phoneNumber));
};

// Utility function to validate array of URLs
export const isValidArrayOfURLs = (urls: string[]): boolean => {
  return urls.every(url => isValidURLFormat(url));
};

// Utility function to validate array of numbers
export const isValidArrayOfNumbers = (numbers: number[]): boolean => {
  return numbers.every(number => typeof number === 'number');
};

// Utility function to validate array of strings
export const isValidArrayOfStrings = (strings: string[]): boolean => {
  return strings.every(str => typeof str === 'string');
};

// Utility function to validate array of booleans
export const isValidArrayOfBooleans = (booleans: boolean[]): boolean => {
  return booleans.every(bool => typeof bool === 'boolean');
};

// Utility function to validate array of objects
export const isValidArrayOfObjects = (objects: object[]): boolean => {
  return objects.every(obj => typeof obj === 'object' && obj !== null && !Array.isArray(obj));
};

// Utility function to validate array of arrays
export const isValidArrayOfArrays = (arrays: any[][]): boolean => {
  return arrays.every(arr => Array.isArray(arr));
};

// Utility function to validate array of functions
export const isValidArrayOfFunctions = (functions: Function[]): boolean => {
  return functions.every(func => typeof func === 'function');
};

// Utility function to validate array of symbols
export const isValidArrayOfSymbols = (symbols: symbol[]): boolean => {
  return symbols.every(symbol => typeof symbol === 'symbol');
};

// Utility function to validate array of nulls
export const isValidArrayOfNulls = (nulls: null[]): boolean => {
  return nulls.every(nul => nul === null);
};

// Utility function to validate array of undefineds
export const isValidArrayOfUndefineds = (undefineds: undefined[]): boolean => {
  return undefineds.every(undef => undef === undefined);
};

// Utility function to validate array of nulls or undefineds
export const isValidArrayOfNullsOrUndefineds = (values: (null | undefined)[]): boolean => {
  return values.every(value => value === null || value === undefined);
};
