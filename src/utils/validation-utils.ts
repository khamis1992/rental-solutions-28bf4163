import { 
  LeaseStatus, 
  ValidationLeaseStatus, 
  ensureValidLeaseStatus 
} from '../types/lease-types';

/**
 * Validate and normalize lease status values
 * Maps variant spellings and inconsistent casing to valid enum values
 */
export function normalizeLeaseStatus(status: string | null | undefined): LeaseStatus {
  if (!status) return 'draft';
  
  const normalizedStatus = status.toLowerCase();
  
  const statusMap: Record<string, LeaseStatus> = {
    'active': 'active',
    'pending': 'pending',
    'pending_payment': 'pending',
    'pending_deposit': 'pending',
    'completed': 'completed',
    'closed': 'closed',
    'done': 'completed',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'cancel': 'cancelled',
    'expired': 'expired',
    'draft': 'draft',
    'open': 'active'
  };
  
  return statusMap[normalizedStatus] || ensureValidLeaseStatus(status);
}

/**
 * Format a date string to a consistent format
 * Attempts to parse various formats and returns a consistent ISO format
 */
export function formatConsistentDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        if (day <= 31 && month < 12) {
          const newDate = new Date(year, month, day);
          if (!isNaN(newDate.getTime())) {
            return newDate.toISOString();
          }
        }
        
        const month2 = parseInt(parts[0], 10) - 1;
        const day2 = parseInt(parts[1], 10);
        
        if (day2 <= 31 && month2 < 12) {
          const newDate = new Date(year, month2, day2);
          if (!isNaN(newDate.getTime())) {
            return newDate.toISOString();
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return null;
  }
}
