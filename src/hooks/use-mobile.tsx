
import * as React from "react";

// Define breakpoint constants for consistent usage
export const BREAKPOINTS = {
  MOBILE: 640,  // sm
  TABLET: 768,  // md
  LAPTOP: 1024, // lg
  DESKTOP: 1280 // xl
};

/**
 * Hook to detect if the current viewport is mobile
 * @returns boolean indicating if the current viewport is mobile width
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.TABLET : false
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.TABLET);
    };
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if the current viewport is tablet
 * @returns boolean indicating if the current viewport is tablet width
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(() => 
    typeof window !== 'undefined' 
      ? window.innerWidth >= BREAKPOINTS.TABLET && window.innerWidth < BREAKPOINTS.LAPTOP
      : false
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkIfTablet = () => {
      setIsTablet(
        window.innerWidth >= BREAKPOINTS.TABLET && 
        window.innerWidth < BREAKPOINTS.LAPTOP
      );
    };
    
    // Add event listener
    window.addEventListener("resize", checkIfTablet);
    
    return () => window.removeEventListener("resize", checkIfTablet);
  }, []);

  return isTablet;
}

/**
 * Hook to get the current breakpoint name
 * @returns string representing the current breakpoint (mobile, tablet, laptop, desktop)
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<string>(() => {
    if (typeof window === 'undefined') return "desktop";
    
    const width = window.innerWidth;
    if (width < BREAKPOINTS.MOBILE) return "mobile";
    if (width < BREAKPOINTS.TABLET) return "tablet";
    if (width < BREAKPOINTS.LAPTOP) return "laptop";
    return "desktop";
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.MOBILE) {
        setBreakpoint("mobile");
      } else if (width < BREAKPOINTS.TABLET) {
        setBreakpoint("tablet");
      } else if (width < BREAKPOINTS.LAPTOP) {
        setBreakpoint("laptop");
      } else {
        setBreakpoint("desktop");
      }
    };
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}
