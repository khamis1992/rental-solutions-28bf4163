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
    
    // Left/right flex alignments
    if (cls === 'items-start') return 'items-end';
    if (cls === 'items-end') return 'items-start';
    if (cls === 'justify-start') return 'justify-end';
    if (cls === 'justify-end') return 'justify-start';
    
    // Left/right borders
    if (cls.startsWith('border-l')) return cls.replace('border-l', 'border-r');
    if (cls.startsWith('border-r')) return cls.replace('border-r', 'border-l');
    
    // Left/right positioning
    if (cls.startsWith('left-')) return cls.replace('left-', 'right-');
    if (cls.startsWith('right-')) return cls.replace('right-', 'left-');
    
    // Rounded corners
    if (cls.includes('rounded-l-')) return cls.replace('rounded-l-', 'rounded-r-');
    if (cls.includes('rounded-r-')) return cls.replace('rounded-r-', 'rounded-l-');
    if (cls.includes('rounded-tl-')) return cls.replace('rounded-tl-', 'rounded-tr-');
    if (cls.includes('rounded-tr-')) return cls.replace('rounded-tr-', 'rounded-tl-');
    if (cls.includes('rounded-bl-')) return cls.replace('rounded-bl-', 'rounded-br-');
    if (cls.includes('rounded-br-')) return cls.replace('rounded-br-', 'rounded-bl-');
    
    // Space between elements in flexbox
    if (cls === 'space-x-reverse') return '';
    if (cls === 'space-x-1') return 'space-x-1 space-x-reverse';
    if (cls === 'space-x-2') return 'space-x-2 space-x-reverse';
    if (cls === 'space-x-3') return 'space-x-3 space-x-reverse';
    if (cls === 'space-x-4') return 'space-x-4 space-x-reverse';
    if (cls === 'space-x-5') return 'space-x-5 space-x-reverse';
    if (cls === 'space-x-6') return 'space-x-6 space-x-reverse';
    if (cls === 'space-x-8') return 'space-x-8 space-x-reverse';
    if (cls === 'space-x-10') return 'space-x-10 space-x-reverse';
    if (cls === 'space-x-12') return 'space-x-12 space-x-reverse';
    
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

/**
 * Returns the appropriate position value for RTL layouts
 * @param ltrPosition - Position value for LTR direction
 * @param rtlPosition - Position value for RTL direction
 * @returns The appropriate position based on current direction
 */
export const getDirectionalPosition = (ltrPosition: string, rtlPosition: string): string => {
  const { isRTL } = useTranslation();
  return isRTL ? rtlPosition : ltrPosition;
};

/**
 * Returns the correct float direction for RTL support
 * @returns The appropriate float CSS value
 */
export const getFloatDirection = (ltrFloat: 'left' | 'right' | 'none'): 'left' | 'right' | 'none' => {
  const { isRTL } = useTranslation();
  
  if (ltrFloat === 'none') return 'none';
  return isRTL ? 
    (ltrFloat === 'left' ? 'right' : 'left') : 
    ltrFloat;
};
