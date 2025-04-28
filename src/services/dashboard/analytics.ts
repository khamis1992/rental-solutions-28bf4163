
/**
 * Formats a time ago string
 * 
 * @param date - Date to calculate from
 * @returns String representing time elapsed
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
}

/**
 * Parse a time ago string into minutes for sorting
 * 
 * @param timeAgo - String time ago representation
 * @returns Number of minutes for comparison
 */
export function parseTimeAgo(timeAgo: string): number {
  const match = timeAgo.match(/(\d+)\s+(\w+)/);
  if (!match) return 9999;
  
  const [, value, unit] = match;
  const numValue = parseInt(value);

  if (unit.includes('minute')) return numValue;
  if (unit.includes('hour')) return numValue * 60;
  if (unit.includes('day')) return numValue * 60 * 24;

  return 9999;
}

/**
 * Processes activity data for dashboard display
 * 
 * @param activities - Raw activity data
 * @returns Sorted and limited activity data
 */
export function processActivityData(activities: any[]): any[] {
  return activities.sort((a, b) => {
    const timeA = parseTimeAgo(a.time);
    const timeB = parseTimeAgo(b.time);
    return timeA - timeB;
  }).slice(0, 5);
}

/**
 * Calculate statistics for vehicle status
 * 
 * @param vehicles - Array of vehicles with status
 * @returns Object with status counts and availability metrics
 */
export function calculateVehicleStats(vehicles: any[]): any {
  const statusCounts = vehicles.reduce((acc, vehicle) => {
    const status = vehicle.status || 'available';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return {
    total: vehicles.length,
    available: statusCounts['available'] || 0,
    rented: statusCounts['rented'] || 0,
    maintenance: statusCounts['maintenance'] || 0,
    police_station: statusCounts['police_station'] || 0,
    accident: statusCounts['accident'] || 0,
    stolen: statusCounts['stolen'] || 0,
    reserved: statusCounts['reserved'] || 0,
    attention: statusCounts['maintenance'] || 0,
    critical: (statusCounts['accident'] || 0) + (statusCounts['stolen'] || 0)
  };
}
