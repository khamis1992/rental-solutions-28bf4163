
import { differenceInDays, differenceInMonths, format } from 'date-fns';

/**
 * Formats agreement duration in a human-readable format
 */
export const formatAgreementDuration = (startDate?: string | Date, endDate?: string | Date): string => {
  if (!startDate || !endDate) {
    return 'N/A';
  }

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  const monthsDiff = differenceInMonths(end, start);
  const daysDiff = differenceInDays(end, start) % 30;
  
  if (monthsDiff <= 0) {
    return `${daysDiff} days`;
  } else if (daysDiff === 0) {
    return monthsDiff === 1 ? '1 month' : `${monthsDiff} months`;
  } else {
    return `${monthsDiff} month${monthsDiff > 1 ? 's' : ''}, ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
  }
};
