
import { useCallback } from 'react';
import { format, differenceInMonths, parseISO } from 'date-fns';

export const useDateUtils = () => {
  const formatDate = useCallback((date: Date | string | null): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM d, yyyy');
  }, []);

  const calculateDuration = useCallback((startDateStr: string | Date, endDateStr: string | Date): number => {
    if (!startDateStr || !endDateStr) return 0;
    
    const startDate = typeof startDateStr === 'string' ? new Date(startDateStr) : startDateStr;
    const endDate = typeof endDateStr === 'string' ? new Date(endDateStr) : endDateStr;
    
    const months = differenceInMonths(endDate, startDate);
    return months > 0 ? months : 1;
  }, []);

  const toDateString = useCallback((date: Date | null): string => {
    if (!date) return '';
    return date.toISOString();
  }, []);

  const toDateObject = useCallback((dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr);
    } catch (e) {
      console.error('Error parsing date string:', dateStr, e);
      return null;
    }
  }, []);

  return {
    formatDate,
    calculateDuration,
    toDateString,
    toDateObject
  };
};
