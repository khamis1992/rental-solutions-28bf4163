/**
 * Helper function to build Supabase queries with proper table aliases
 * to avoid ambiguous column reference errors
 */
export function buildAliasedQuery(supabase, table, columns) {
  let query = supabase.from(table).select(
    columns.map(col => {
      if (col.includes(':')) {
        const [relation, fields] = col.split(':');
        return `${relation}:${relation}(${fields})`;
      }
      return `${table}.${col}`;
    }).join(', ')
  );
  
  return query;
}

/**
 * Fix date format issues by attempting to parse dates in multiple formats
 */
export function parseFlexibleDate(dateString) {
  if (!dateString) return null;
  
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day1 = parseInt(parts[0], 10);
      const month1 = parseInt(parts[1], 10) - 1;
      const year1 = parseInt(parts[2], 10);
      
      if (day1 <= 31 && month1 < 12) {
        date = new Date(year1, month1, day1);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      const month2 = parseInt(parts[0], 10) - 1;
      const day2 = parseInt(parts[1], 10);
      const year2 = parseInt(parts[2], 10);
      
      if (day2 <= 31 && month2 < 12) {
        date = new Date(year2, month2, day2);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  }
  
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      if (day <= 31 && month < 12) {
        date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  }
  
  throw new Error(`Unable to parse date: ${dateString}. Please use format YYYY-MM-DD or DD/MM/YYYY`);
}
