
/**
 * Date validation utility functions
 */

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
