
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Returns the correct value based on the current language direction
 * @param ltrValue The value to use when direction is left-to-right
 * @param rtlValue The value to use when direction is right-to-left
 * @returns The appropriate value based on current direction
 */
export const useDirectionalValue = <T,>(ltrValue: T, rtlValue: T): T => {
  const { direction } = useTranslation();
  return direction === 'rtl' ? rtlValue : ltrValue;
};

/**
 * Returns whether the current language direction is RTL
 * @returns Boolean indicating if current direction is RTL
 */
export const useIsRTL = (): boolean => {
  const { direction } = useTranslation();
  return direction === 'rtl';
};

/**
 * Conditionally adds RTL-specific classes to a className string
 * @param baseClasses The base classes to always include
 * @param ltrClasses Classes to add in LTR mode
 * @param rtlClasses Classes to add in RTL mode
 */
export const useDirectionalClasses = (
  baseClasses: string,
  ltrClasses: string = '',
  rtlClasses: string = ''
): string => {
  const { direction } = useTranslation();
  const directionSpecificClasses = direction === 'rtl' ? rtlClasses : ltrClasses;
  return `${baseClasses} ${directionSpecificClasses}`.trim();
};

/**
 * Returns RTL-specific styles object
 * @param ltrStyles Styles for LTR mode
 * @param rtlStyles Styles for RTL mode
 */
export const useDirectionalStyles = <T extends Record<string, any>, U extends Record<string, any>>(
  ltrStyles: T,
  rtlStyles: U
): T | U => {
  const { direction } = useTranslation();
  return direction === 'rtl' ? rtlStyles : ltrStyles;
};

/**
 * Returns the opposite direction of the current language
 */
export const useOppositeDirection = (): 'ltr' | 'rtl' => {
  const { direction } = useTranslation();
  return direction === 'rtl' ? 'ltr' : 'rtl';
};

/**
 * Returns the correct float value based on the current direction
 * Useful for floating elements to the correct side in RTL layouts
 * @param defaultSide The default side in LTR mode ('left' or 'right')
 */
export const useDirectionalFloat = (defaultSide: 'left' | 'right'): string => {
  const { direction } = useTranslation();
  if (defaultSide === 'left') {
    return direction === 'rtl' ? 'float-right' : 'float-left';
  } else {
    return direction === 'rtl' ? 'float-left' : 'float-right';
  }
};

/**
 * Returns the correct margin classes based on direction
 * @param side The side to apply margin to ('left' or 'right')
 * @param size The size of the margin (1-12)
 */
export const useDirectionalMargin = (side: 'left' | 'right', size: number): string => {
  const { direction } = useTranslation();
  const actualSide = direction === 'rtl' 
    ? (side === 'left' ? 'right' : 'left') 
    : side;
    
  return `m${actualSide[0]}-${size}`;
};

/**
 * Returns the correct padding classes based on direction
 * @param side The side to apply padding to ('left' or 'right')
 * @param size The size of the padding (1-12)
 */
export const useDirectionalPadding = (side: 'left' | 'right', size: number): string => {
  const { direction } = useTranslation();
  const actualSide = direction === 'rtl' 
    ? (side === 'left' ? 'right' : 'left') 
    : side;
    
  return `p${actualSide[0]}-${size}`;
};
