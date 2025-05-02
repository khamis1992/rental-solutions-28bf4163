
/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely extract a value from an object that might be null or undefined
 */
export function safeExtract<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (!obj) {
    return defaultValue;
  }
  return obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Cast a string to a UUID, ensuring it has the correct format
 */
export function castToUUID(value: string): string {
  // Simple validation to ensure the string looks like a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return value;
  }
  throw new Error(`Invalid UUID format: ${value}`);
}

/**
 * Verify that a value is one of the allowed options
 * @param value The value to check
 * @param allowedValues Array of allowed values
 * @param defaultValue Optional default value if check fails
 * @returns The value if it's in the allowed values, or the default value
 */
export function verifyEnum<T extends string>(
  value: string | null | undefined, 
  allowedValues: T[], 
  defaultValue?: T
): T | undefined {
  if (!value) {
    return defaultValue;
  }
  
  const normalizedValue = value.toLowerCase() as T;
  
  if (allowedValues.includes(normalizedValue) || 
      allowedValues.map(v => v.toLowerCase()).includes(normalizedValue)) {
    return normalizedValue;
  }
  
  // If a direct match wasn't found, check for alternative mappings
  // e.g., 'reserve' to 'reserved', etc.
  for (const allowed of allowedValues) {
    // Common variations (singular/plural, past tense)
    const variations = [
      allowed,
      `${allowed}d`,   // e.g., reserve -> reserved
      `${allowed}ed`,  // e.g., rent -> rented
      allowed.replace(/ed$/, ''), // e.g., reserved -> reserve
      allowed.replace(/d$/, '')   // e.g., rented -> rent
    ];
    
    if (variations.some(v => v.toLowerCase() === normalizedValue)) {
      return allowed;
    }
  }
  
  return defaultValue;
}

/**
 * Creates a debug logger that only logs in development environment
 * @param context The context or module name for the logs
 * @returns A logger function
 */
export function createDebugLogger(context: string) {
  return (message: string, ...data: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${context}] ${message}`, ...data);
    }
  };
}

/**
 * Safe JSON parse with type safety
 * @param jsonString String to parse
 * @param defaultValue Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON string:', error);
    return defaultValue;
  }
}
