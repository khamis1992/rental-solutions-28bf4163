
import { useMediaQuery } from './use-media-query';

/**
 * Hook to detect if the current viewport is mobile
 * @returns Boolean indicating if the device is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export default useIsMobile;
