
/**
 * Check if a value exists (not null or undefined)
 * 
 * @param value Any value to check
 * @returns True if the value is not null or undefined
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Maps response objects to a specified type
 * 
 * @template T The type to map to
 * @template R The raw response type
 * @param responseData The raw response data to map
 * @param mapper A function to transform the response data
 * @returns Mapped data or null if input is null
 */
export function mapResponseData<T, R>(
  responseData: R | null | undefined,
  mapper: (data: R) => T
): T | null {
  if (!exists(responseData)) {
    return null;
  }
  return mapper(responseData);
}

/**
 * Maps an array of response objects to a specified type
 * 
 * @template T The type to map to
 * @template R The raw response type
 * @param responseData The raw response data array to map
 * @param mapper A function to transform each response item
 * @returns Array of mapped data or empty array if input is null
 */
export function mapResponseArray<T, R>(
  responseData: R[] | null | undefined,
  mapper: (data: R) => T
): T[] {
  if (!exists(responseData)) {
    return [];
  }
  return responseData.map(mapper);
}

/**
 * Safely extracts value from a potentially undefined object
 * 
 * @template T Object type
 * @template K Key type
 * @param obj The object to extract from
 * @param key The key to extract
 * @param defaultValue Optional default value if key doesn't exist
 * @returns The value at the key or the default value
 */
export function safeExtract<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!exists(obj)) return defaultValue;
  return obj[key] ?? defaultValue;
}

/**
 * Safely navigates nested objects with proper type checking
 * @param obj The root object to navigate
 * @param path Array of keys to traverse
 * @param defaultValue Optional default value if path not found
 */
export function safeNavigate<T, D = undefined>(
  obj: any,
  path: string[],
  defaultValue?: D
): T | D | undefined {
  const result = path.reduce((prev, key) => 
    prev && (typeof prev === 'object') && key in prev ? prev[key] : undefined, 
  obj as any);
  
  return (result === undefined) ? defaultValue : result as T;
}
