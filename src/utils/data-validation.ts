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
  const regex = /^(?:(?:\+|00)974)?\s?(3|5|6|7)\d{7}$/;
  return regex.test(phoneNumber);
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

// Utility function to validate JSON string
export const isValidJSONString = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

// Utility function to validate array
export const isValidArray = (arr: any): boolean => {
  return Array.isArray(arr);
};

// Utility function to validate object
export const isValidObject = (obj: any): boolean => {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};

// Utility function to validate boolean
export const isValidBoolean = (bool: any): boolean => {
  return typeof bool === 'boolean';
};

// Utility function to validate null or undefined
export const isNullOrUndefined = (value: any): boolean => {
  return value === null || value === undefined;
};

// Utility function to validate empty string
export const isEmptyString = (str: string): boolean => {
  return str.trim() === '';
};

// Utility function to validate empty array
export const isEmptyArray = (arr: any): boolean => {
  return Array.isArray(arr) && arr.length === 0;
};

// Utility function to validate empty object
export const isEmptyObject = (obj: any): boolean => {
  return typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0;
};

// Utility function to validate credit card number
export const isValidCreditCardNumber = (cardNumber: string): boolean => {
  const regex = /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
  return regex.test(cardNumber);
};

// Utility function to validate expiry date (MM/YY)
export const isValidExpiryDateFormat = (expiryDate: string): boolean => {
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  return regex.test(expiryDate);
};

// Utility function to validate CVV
export const isValidCVV = (cvv: string): boolean => {
  const regex = /^[0-9]{3,4}$/;
  return regex.test(cvv);
};

// Utility function to validate postal code
export const isValidPostalCode = (postalCode: string): boolean => {
  const regex = /^[0-9]{5}(?:-[0-9]{4})?$/;
  return regex.test(postalCode);
};

// Utility function to validate file size (in MB)
export const isValidFileSize = (fileSize: number, maxSize: number): boolean => {
  const fileSizeInMB = fileSize / (1024 * 1024);
  return fileSizeInMB <= maxSize;
};

// Utility function to validate file type
export const isValidFileType = (fileType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(fileType);
};

// Utility function to validate image dimensions
export const isValidImageDimensions = (width: number, height: number, maxWidth: number, maxHeight: number): boolean => {
  return width <= maxWidth && height <= maxHeight;
};

// Utility function to validate date is in the future
export const isValidFutureDate = (date: Date): boolean => {
  return date > new Date();
};

// Utility function to validate date is in the past
export const isValidPastDate = (date: Date): boolean => {
  return date < new Date();
};

// Utility function to validate date is within a range
export const isValidDateRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

// Utility function to validate time is within a range
export const isValidTimeRange = (time: string, startTime: string, endTime: string): boolean => {
  return time >= startTime && time <= endTime;
};

// Utility function to validate latitude
export const isValidLatitude = (latitude: number): boolean => {
  return latitude >= -90 && latitude <= 90;
};

// Utility function to validate longitude
export const isValidLongitude = (longitude: number): boolean => {
  return longitude >= -180 && longitude <= 180;
};

// Utility function to validate color in hex format
export const isValidHexColor = (color: string): boolean => {
  const regex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  return regex.test(color);
};

// Utility function to validate MAC address
export const isValidMACAddress = (macAddress: string): boolean => {
  const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return regex.test(macAddress);
};

// Utility function to validate IP address
export const isValidIPAddress = (ipAddress: string): boolean => {
  const regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  return regex.test(ipAddress);
};

// Utility function to validate username
export const isValidUsername = (username: string): boolean => {
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
};

// Utility function to validate password
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

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

// Utility function to validate array of empty strings
export const isValidArrayOfEmptyStrings = (strings: string[]): boolean => {
  return strings.every(str => isEmptyString(str));
};

// Utility function to validate array of empty arrays
export const isValidArrayOfEmptyArrays = (arrays: any[][]): boolean => {
  return arrays.every(arr => isEmptyArray(arr));
};

// Utility function to validate array of empty objects
export const isValidArrayOfEmptyObjects = (objects: object[]): boolean => {
  return objects.every(obj => isEmptyObject(obj));
};

// Utility function to validate array of valid JSON strings
export const isValidArrayOfValidJSONStrings = (strings: string[]): boolean => {
  return strings.every(str => isValidJSONString(str));
};

// Utility function to validate array of valid MAC addresses
export const isValidArrayOfValidMACAddresses = (macAddresses: string[]): boolean => {
  return macAddresses.every(macAddress => isValidMACAddress(macAddress));
};

// Utility function to validate array of valid IP addresses
export const isValidArrayOfValidIPAddresses = (ipAddresses: string[]): boolean => {
  return ipAddresses.every(ipAddress => isValidIPAddress(ipAddress));
};

// Utility function to validate array of valid hex colors
export const isValidArrayOfValidHexColors = (colors: string[]): boolean => {
  return colors.every(color => isValidHexColor(color));
};

// Utility function to validate array of valid postal codes
export const isValidArrayOfValidPostalCodes = (postalCodes: string[]): boolean => {
  return postalCodes.every(postalCode => isValidPostalCode(postalCode));
};

// Utility function to validate array of valid credit card numbers
export const isValidArrayOfValidCreditCardNumbers = (cardNumbers: string[]): boolean => {
  return cardNumbers.every(cardNumber => isValidCreditCardNumber(cardNumber));
};

// Utility function to validate array of valid expiry dates
export const isValidArrayOfValidExpiryDates = (expiryDates: string[]): boolean => {
  return expiryDates.every(expiryDate => isValidExpiryDateFormat(expiryDate));
};

// Utility function to validate array of valid CVVs
export const isValidArrayOfValidCVVs = (cvvs: string[]): boolean => {
  return cvvs.every(cvv => isValidCVV(cvv));
};

// Utility function to validate array of valid file sizes
export const isValidArrayOfValidFileSizes = (fileSizes: number[], maxSize: number): boolean => {
  return fileSizes.every(fileSize => isValidFileSize(fileSize, maxSize));
};

// Utility function to validate array of valid file types
export const isValidArrayOfValidFileTypes = (fileTypes: string[], allowedTypes: string[]): boolean => {
  return fileTypes.every(fileType => isValidFileType(fileType, allowedTypes));
};

// Utility function to validate array of valid image dimensions
export const isValidArrayOfValidImageDimensions = (dimensions: { width: number, height: number }[], maxWidth: number, maxHeight: number): boolean => {
  return dimensions.every(dimension => isValidImageDimensions(dimension.width, dimension.height, maxWidth, maxHeight));
};

// Utility function to validate array of valid future dates
export const isValidArrayOfValidFutureDates = (dates: Date[]): boolean => {
  return dates.every(date => isValidFutureDate(date));
};

// Utility function to validate array of valid past dates
export const isValidArrayOfValidPastDates = (dates: Date[]): boolean => {
  return dates.every(date => isValidPastDate(date));
};

// Utility function to validate array of valid date ranges
export const isValidArrayOfValidDateRanges = (dates: Date[], startDate: Date, endDate: Date): boolean => {
  return dates.every(date => isValidDateRange(date, startDate, endDate));
};

// Utility function to validate array of valid time ranges
export const isValidArrayOfValidTimeRanges = (times: string[], startTime: string, endTime: string): boolean => {
  return times.every(time => isValidTimeRange(time, startTime, endTime));
};

// Utility function to validate array of valid latitudes
export const isValidArrayOfValidLatitudes = (latitudes: number[]): boolean => {
  return latitudes.every(latitude => isValidLatitude(latitude));
};

// Utility function to validate array of valid longitudes
export const isValidArrayOfValidLongitudes = (longitudes: number[]): boolean => {
  return longitudes.every(longitude => isValidLongitude(longitude));
};

// Fix the instanceof check to ensure it works with proper types
const isValidDate = (date: unknown): boolean => {
  return date && typeof date === 'object' && 'getTime' in date && typeof date.getTime === 'function';
};
