
/**
 * Check if a response has data
 */
export function hasData(response: any): boolean {
  return response && !response.error && response.data !== null;
}

/**
 * Check if an object exists and has a specific property
 */
export function hasProperty(obj: any, prop: string): boolean {
  return obj && typeof obj === 'object' && prop in obj;
}

/**
 * Check if a value exists (not null or undefined)
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely extract data from a response
 */
export function safelyExtractData<T>(response: any): T | null {
  if (!response || response.error || !response.data) {
    return null;
  }
  return response.data;
}

/**
 * Safely handle array data
 */
export function safeArrayData<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

// ID type conversion helpers
export function asDbId<T>(id: string): T {
  return id as unknown as T;
}

export function asVehicleId(id: string): string {
  return id as string;
}

export function asLeaseId(id: string): string {
  return id as string;
}

export function asCustomerId(id: string): string {
  return id as string;
}

export function asProfileId(id: string): string {
  return id as string;
}

export function asPaymentId(id: string): string {
  return id as string;
}

export function asTrafficFineId(id: string): string {
  return id as string;
}

// Column helpers
export function asLeaseIdColumn(columnName: string): string {
  return columnName;
}

export function asStatusColumn(columnName: string): string {
  return columnName;
}

// Type casting helpers 
export function castDbId<T = string>(id: string): T {
  return id as unknown as T;
}

export function castDatabaseObject<T>(obj: any): T {
  return obj as T;
}

export function castToUUID(id: string): string {
  return id;
}

// String and number conversion helpers
export function asString(value: any): string {
  return value?.toString() || '';
}

export function asNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

// Type checking helper
export function asDatabaseType<T>(value: any): T {
  return value as T;
}

// Safe property access
export function safeProperty<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (!obj) return undefined;
  return obj[key];
}

// Fix the handleResponseData function to avoid the T | T[] error
export function handleResponseData<T>(response: any): T | null {
  if (response?.error || !response?.data) {
    return null;
  }
  // Make sure we're returning T, not T | T[]
  if (Array.isArray(response.data)) {
    return response.data.length > 0 ? response.data[0] : null;
  }
  return response.data;
}
