
import { useTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

/**
 * Hook to provide directional-aware CSS classes
 * @param baseClasses - classes to apply in both directions
 * @param ltrClasses - classes to apply only in LTR mode
 * @param rtlClasses - classes to apply only in RTL mode
 * @returns combined classes based on current direction
 */
export const useDirectionalClasses = (
  baseClasses: string,
  ltrClasses: string = '',
  rtlClasses: string = ''
): string => {
  const { isRTL } = useTranslation();
  
  return cn(
    baseClasses,
    isRTL ? rtlClasses : ltrClasses
  );
};

/**
 * Helper function to flip margins, paddings, etc. for RTL support
 * @param prefixClass - Base class prefix (e.g., 'ml', 'mr', 'pl', 'pr')
 * @param size - Size value (e.g., '2', '4', etc.)
 * @returns Appropriate directional class based on current direction
 */
export const getDirectionalMargin = (
  prefixClass: 'ml' | 'mr' | 'pl' | 'pr',
  size: string
): string => {
  const { isRTL } = useTranslation();
  
  // Flip margins and paddings for RTL
  const mapping = {
    ml: isRTL ? 'mr' : 'ml',
    mr: isRTL ? 'ml' : 'mr',
    pl: isRTL ? 'pr' : 'pl',
    pr: isRTL ? 'pl' : 'pr'
  };
  
  return `${mapping[prefixClass]}-${size}`;
};
