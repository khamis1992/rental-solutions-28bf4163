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
const classCache = new Map<string, string>();

export const getDirectionalClasses = (classes: string): string => {
  const { isRTL } = useTranslation();
  
  if (!isRTL) return classes;
  
  const cacheKey = `${classes}-${isRTL}`;
  if (classCache.has(cacheKey)) {
    return classCache.get(cacheKey)!;
  } // No changes needed for LTR
  
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
    if (cls.startsWith('space-x-')) return `${cls} space-x-reverse`;
    
    // Keep other classes unchanged
    return cls;
  }).join(' ');
};

/**
 * Returns appropriate directional flex class based on current language
 * @returns The flex direction class for the current language
 */
export const getDirectionalFlexClass = (): string => {
  const { isRTL } = useTranslation();
  return isRTL ? 'flex-row-reverse' : 'flex-row';
};

/**
 * Returns the appropriate text-align class based on current language
 * @returns The text alignment class for the current language
 */
export const getDirectionalTextAlign = (): string => {
  const { isRTL } = useTranslation();
  return isRTL ? 'text-right' : 'text-left';
};

/**
 * Helper function to get appropriate icon for directional navigation
 * @param iconType Type of directional icon (e.g., 'arrow', 'chevron')
 * @returns The icon component to use based on direction
 */
export const getDirectionalIcon = (iconType: 'arrow' | 'chevron') => {
  const { isRTL } = useTranslation();
  
  // You will need to import these from lucide-react where this function is used
  if (iconType === 'arrow') {
    return isRTL ? 'ArrowRight' : 'ArrowLeft';
  } else {
    return isRTL ? 'ChevronRight' : 'ChevronLeft';
  }
};

import { useTranslation } from 'react-i18next';

export const useIsRTL = () => {
  const { i18n } = useTranslation();
  return i18n.dir() === 'rtl';
};

export const applyRTLStyle = (isRTL: boolean, style: React.CSSProperties = {}): React.CSSProperties => {
  if (!isRTL) return style;
  return {
    ...style,
    direction: 'rtl',
    textAlign: 'right'
  };
};