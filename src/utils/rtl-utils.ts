
import { useTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

/**
 * Hook to provide directional-aware CSS classes with memoization
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
  
  // Use memoization to avoid recalculating on every render
  return useMemo(() => {
    return cn(
      baseClasses,
      isRTL ? rtlClasses : ltrClasses
    );
  }, [baseClasses, ltrClasses, rtlClasses, isRTL]);
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
  
  // Mapping table for better performance
  const mapping: Record<string, Record<string, string>> = {
    ltr: { 'ml': 'ml', 'mr': 'mr', 'pl': 'pl', 'pr': 'pr' },
    rtl: { 'ml': 'mr', 'mr': 'ml', 'pl': 'pr', 'pr': 'pl' }
  };
  
  const direction = isRTL ? 'rtl' : 'ltr';
  return `${mapping[direction][prefixClass]}-${size}`;
};

// Pre-compile regex patterns for better performance
const MARGIN_PATTERN = /^(m[lr]|margin-[lr])\-(.+)$/;
const PADDING_PATTERN = /^(p[lr]|padding-[lr])\-(.+)$/;
const BORDER_L_PATTERN = /^border-l/;
const BORDER_R_PATTERN = /^border-r/;
const LEFT_PATTERN = /^left-/;
const RIGHT_PATTERN = /^right-/;
const ROUNDED_L_PATTERN = /rounded-l-/;
const ROUNDED_R_PATTERN = /rounded-r-/;
const ROUNDED_TL_PATTERN = /rounded-tl-/;
const ROUNDED_TR_PATTERN = /rounded-tr-/;
const ROUNDED_BL_PATTERN = /rounded-bl-/;
const ROUNDED_BR_PATTERN = /rounded-br-/;
const SPACE_X_PATTERN = /^space-x-/;

/**
 * Converts directional classes like ml/mr/pl/pr to their RTL-aware versions
 * Optimized version with memoization and pre-compiled patterns
 * @param classes - Space-separated string of classes
 * @returns Properly flipped classes for RTL
 */
export const getDirectionalClasses = (classes: string): string => {
  const { isRTL } = useTranslation();
  
  if (!isRTL) return classes; // No changes needed for LTR
  
  // Process each class
  return classes.split(' ').map(cls => {
    // Match patterns using pre-compiled regex
    const marginMatch = MARGIN_PATTERN.exec(cls);
    if (marginMatch) {
      const [, prefix, size] = marginMatch;
      if (prefix === 'ml' || prefix === 'margin-l') return `mr-${size}`;
      if (prefix === 'mr' || prefix === 'margin-r') return `ml-${size}`;
    }
    
    const paddingMatch = PADDING_PATTERN.exec(cls);
    if (paddingMatch) {
      const [, prefix, size] = paddingMatch;
      if (prefix === 'pl' || prefix === 'padding-l') return `pr-${size}`;
      if (prefix === 'pr' || prefix === 'padding-r') return `pl-${size}`;
    }
    
    // Text alignment
    if (cls === 'text-left') return 'text-right';
    if (cls === 'text-right') return 'text-left';
    
    // Flex alignment
    if (cls === 'items-start') return 'items-end';
    if (cls === 'items-end') return 'items-start';
    if (cls === 'justify-start') return 'justify-end';
    if (cls === 'justify-end') return 'justify-start';
    
    // Borders
    if (BORDER_L_PATTERN.test(cls)) return cls.replace('border-l', 'border-r');
    if (BORDER_R_PATTERN.test(cls)) return cls.replace('border-r', 'border-l');
    
    // Positioning
    if (LEFT_PATTERN.test(cls)) return cls.replace('left-', 'right-');
    if (RIGHT_PATTERN.test(cls)) return cls.replace('right-', 'left-');
    
    // Rounded corners
    if (ROUNDED_L_PATTERN.test(cls)) return cls.replace('rounded-l-', 'rounded-r-');
    if (ROUNDED_R_PATTERN.test(cls)) return cls.replace('rounded-r-', 'rounded-l-');
    if (ROUNDED_TL_PATTERN.test(cls)) return cls.replace('rounded-tl-', 'rounded-tr-');
    if (ROUNDED_TR_PATTERN.test(cls)) return cls.replace('rounded-tr-', 'rounded-tl-');
    if (ROUNDED_BL_PATTERN.test(cls)) return cls.replace('rounded-bl-', 'rounded-br-');
    if (ROUNDED_BR_PATTERN.test(cls)) return cls.replace('rounded-br-', 'rounded-bl-');
    
    // Space between elements
    if (cls === 'space-x-reverse') return '';
    if (SPACE_X_PATTERN.test(cls)) return `${cls} space-x-reverse`;
    
    return cls;
  }).join(' ');
};

// Memoization cache for frequently used classes
const memoizedFlexClasses: Record<string, string> = {
  'true': 'flex-row-reverse',
  'false': 'flex-row'
};

const memoizedTextAlignClasses: Record<string, string> = {
  'true': 'text-right',
  'false': 'text-left'
};

/**
 * Returns appropriate directional flex class based on current language
 * @returns The flex direction class for the current language
 */
export const getDirectionalFlexClass = (): string => {
  const { isRTL } = useTranslation();
  return memoizedFlexClasses[String(isRTL)];
};

/**
 * Returns the appropriate text-align class based on current language
 * @returns The text alignment class for the current language
 */
export const getDirectionalTextAlign = (): string => {
  const { isRTL } = useTranslation();
  return memoizedTextAlignClasses[String(isRTL)];
};

// Cached icon mapping for better performance
const iconMappings = {
  arrow: {
    true: 'ArrowRight',
    false: 'ArrowLeft'
  },
  chevron: {
    true: 'ChevronRight', 
    false: 'ChevronLeft'
  }
};

/**
 * Helper function to get appropriate icon for directional navigation
 * Optimized with cache for better performance
 * @param iconType Type of directional icon (e.g., 'arrow', 'chevron')
 * @returns The icon component to use based on direction
 */
export const getDirectionalIcon = (iconType: 'arrow' | 'chevron') => {
  const { isRTL } = useTranslation();
  return iconMappings[iconType][String(isRTL)];
};
