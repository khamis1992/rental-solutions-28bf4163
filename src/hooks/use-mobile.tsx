
import * as React from "react"
import { useTranslation } from "@/contexts/TranslationContext";

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const { isRTL } = useTranslation();

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useResponsiveLayout() {
  const isMobile = useIsMobile();
  const { isRTL } = useTranslation();
  
  return {
    isMobile,
    isRTL,
    // Helper function to get direction-aware CSS classes
    getFlexClass: () => isRTL ? 'flex-row-reverse' : 'flex-row',
    getMarginClass: (side: 'left' | 'right', size: number) => {
      if (side === 'left') {
        return isRTL ? `mr-${size}` : `ml-${size}`;
      } else {
        return isRTL ? `ml-${size}` : `mr-${size}`;
      }
    },
    getTextAlignClass: () => isRTL ? 'text-right' : 'text-left'
  };
}
