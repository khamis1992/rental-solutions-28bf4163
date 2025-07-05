/**
 * Utility to fix date formats in CSV imports
 */
export function fixAgreementImportDates(dateString: string): string {
  if (!dateString) return '';
  
  let date: Date | null = null;
  
  date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
  }
  
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      if (day <= 31 && month < 12) {
        date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      const month2 = parseInt(parts[0], 10) - 1;
      const day2 = parseInt(parts[1], 10);
      
      if (day2 <= 31 && month2 < 12) {
        date = new Date(year, month2, day2);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
  }
  
  if (!date || isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}. Please use DD/MM/YYYY or YYYY-MM-DD format.`);
  }
  
  return date.toISOString().split('T')[0];
}
