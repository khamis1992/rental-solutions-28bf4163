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

/**
 * Converts directional classes like ml/mr/pl/pr to their RTL-aware versions
 * @param classes - Space-separated string of classes
 * @returns Properly flipped classes for RTL
 */
export const getDirectionalClasses = (classes: string): string => {
  const { isRTL } = useTranslation();
  
  if (!isRTL) return classes; // No changes needed for LTR
  
  return classes.split(' ').map(cls => {
    // Match padding and margin patterns
    const marginMatch = cls.match(/^(m[lr]|margin-[lr])\-(.+)$/);
    const paddingMatch = cls.match(/^(p[lr]|padding-[lr])\-(.+)$/);
    
    if (marginMatch) {
      const [, prefix, size] = marginMatch;
      if (prefix === 'ml' || prefix === 'margin-l') return `mr-${size}`;
      if (prefix === 'mr' || prefix === 'margin-r') return `ml-${size}`;
    }
    
    if (paddingMatch) {
      const [, prefix, size] = paddingMatch;
      if (prefix === 'pl' || prefix === 'padding-l') return `pr-${size}`;
      if (prefix === 'pr' || prefix === 'padding-r') return `pl-${size}`;
    }
    
    // Left/right text alignment
    if (cls === 'text-left') return 'text-right';
    if (cls === 'text-right') return 'text-left';
    
    // Left/right borders
    if (cls.startsWith('border-l')) return cls.replace('border-l', 'border-r');
    if (cls.startsWith('border-r')) return cls.replace('border-r', 'border-l');
    
    // Keep other classes unchanged
    return cls;
  }).join(' ');
};

/**
 * Flips icon rotation for RTL support
 * @param degrees - Original rotation in degrees
 * @returns Adjusted rotation for RTL
 */
export const getIconRotation = (degrees: number): number => {
  const { isRTL } = useTranslation();
  
  // For certain rotations, we need to flip them in RTL mode
  if (isRTL) {
    if (degrees === 0) return 0; // No rotation stays the same
    if (degrees === 180) return 180; // 180 stays the same
    
    // Flip horizontal rotations
    if (degrees === 90) return 270;
    if (degrees === 270) return 90;
  }
  
  return degrees;
};
