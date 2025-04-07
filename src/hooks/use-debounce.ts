
import { useState, useEffect } from 'react';

/**
 * A custom hook that debounces a value over a specified delay period.
 * 
 * @param value - The value to be debounced
 * @param delay - The delay in milliseconds
 * @returns The debounced value, updated after the delay period
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes again before the delay period
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
