
import * as React from "react"
import { debounce } from 'lodash';

const MOBILE_BREAKPOINT = 768;
const DEBOUNCE_DELAY = 150;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  React.useEffect(() => {
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }, DEBOUNCE_DELAY);

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    if (mql.addEventListener) {
      mql.addEventListener('change', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      handleResize.cancel();
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return isMobile;
}
