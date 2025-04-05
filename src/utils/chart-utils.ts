
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Prepares chart data for RTL display
 * Reverses data arrays for RTL mode to ensure proper visual representation
 * @param data The original chart data array
 * @returns The chart data properly formatted for the current direction
 */
export const useDirectionalChartData = (data: any[]) => {
  const { isRTL } = useTranslation();
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // For RTL layouts, we reverse the data array to display the chart correctly
  return isRTL ? [...data].reverse() : data;
};

/**
 * Generates appropriate chart margin configuration based on direction
 * @param baseMargin Base margin object
 * @returns Margin configuration adjusted for current direction
 */
export const useChartMargin = (baseMargin = { top: 20, right: 30, left: 20, bottom: 5 }) => {
  const { isRTL } = useTranslation();
  
  if (isRTL) {
    // Swap left and right margins for RTL
    return {
      top: baseMargin.top,
      right: baseMargin.left,
      left: baseMargin.right,
      bottom: baseMargin.bottom
    };
  }
  
  return baseMargin;
};

/**
 * Provides configuration for axis labels based on direction
 * @returns Configuration object for text anchor and alignment
 */
export const useAxisLabelConfig = () => {
  const { isRTL } = useTranslation();
  
  return {
    textAnchor: isRTL ? 'end' : 'start',
    transform: isRTL ? 'rotate(180)' : 'rotate(0)',
    mirror: isRTL,
    dx: isRTL ? -10 : 10,
  };
};

/**
 * Handles RTL text presentation in chart elements
 * @param text The text to display
 * @returns Properly formatted text for current direction
 */
export const getDirectionalChartText = (text: string) => {
  const { isRTL } = useTranslation();
  
  // No special handling needed for LTR
  if (!isRTL) return text;
  
  // For RTL, we need to handle numbers specially to ensure they display correctly
  return text;
};
