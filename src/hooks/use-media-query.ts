import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that detects if the current viewport matches a media query
 * @param query The media query to check against (e.g., '(max-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the match state, or false if SSR
  const getMatches = (query: string): boolean => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    // Handle window resize and update matches state
    function handleChange() {
      setMatches(getMatches(query));
    }

    // Create a MediaQueryList object
    const matchMedia = window.matchMedia(query);

    // Initial check
    handleChange();

    // Listen for changes
    // Use the deprecated addListener for older browsers that don't support addEventListener
    if (matchMedia.addEventListener) {
      matchMedia.addEventListener('change', handleChange);
    } else {
      // @ts-ignore - For older browsers
      matchMedia.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (matchMedia.removeEventListener) {
        matchMedia.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore - For older browsers
        matchMedia.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}
