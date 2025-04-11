
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
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.TABLET);
    };
    
    // Set initial value
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return isMobile === undefined ? false : isMobile;
}

/**
 * Hook to detect if the current viewport is tablet
 * @returns boolean indicating if the current viewport is tablet width
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkIfTablet = () => {
      setIsTablet(
        window.innerWidth >= BREAKPOINTS.TABLET && 
        window.innerWidth < BREAKPOINTS.LAPTOP
      );
    };
    
    // Set initial value
    checkIfTablet();
    
    // Add event listener
    window.addEventListener("resize", checkIfTablet);
    
    return () => window.removeEventListener("resize", checkIfTablet);
  }, []);

  return isTablet === undefined ? false : isTablet;
}

/**
 * Hook to get the current breakpoint name
 * @returns string representing the current breakpoint (mobile, tablet, laptop, desktop)
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<string>("desktop");

  React.useEffect(() => {
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
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}
