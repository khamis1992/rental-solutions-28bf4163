
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
