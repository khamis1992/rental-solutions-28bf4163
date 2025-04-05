
import { useTranslation } from '@/contexts/TranslationContext';
import { useMemo } from 'react';
import performanceMonitor from '@/utils/performance-monitor';

/**
 * Prepares chart data for RTL display with performance optimization
 * @param data The original chart data array
 * @returns The chart data properly formatted for the current direction
 */
export const useDirectionalChartData = <T extends any[]>(data: T): T => {
  const { isRTL } = useTranslation();
  
  return useMemo(() => {
    performanceMonitor.startMeasure('prepare_chart_data');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      performanceMonitor.endMeasure('prepare_chart_data');
      return [] as unknown as T;
    }
    
    // Don't create a new array unnecessarily if not in RTL mode
    const result = isRTL ? [...data].reverse() : data;
    
    performanceMonitor.endMeasure('prepare_chart_data');
    return result;
  }, [data, isRTL]);
};

/**
 * Generates appropriate chart margin configuration based on direction
 * @param baseMargin Base margin object
 * @returns Margin configuration adjusted for current direction
 */
export const useChartMargin = (baseMargin = { top: 20, right: 30, left: 20, bottom: 5 }) => {
  const { isRTL } = useTranslation();
  
  return useMemo(() => {
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
  }, [baseMargin, isRTL]);
};

/**
 * Provides configuration for axis labels based on direction
 * @returns Configuration object for text anchor and alignment
 */
export const useAxisLabelConfig = () => {
  const { isRTL } = useTranslation();
  
  return useMemo(() => ({
    textAnchor: isRTL ? 'end' : 'start',
    transform: isRTL ? 'rotate(180)' : 'rotate(0)',
    mirror: isRTL,
    dx: isRTL ? -10 : 10,
  }), [isRTL]);
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

/**
 * Provides optimized dataset configuration for charts in both LTR and RTL layouts
 * @param originalData The raw data array
 * @param config Configuration object
 * @returns Optimized and transformed chart dataset
 */
export const useOptimizedChartData = <T extends Record<string, any>>(
  originalData: T[], 
  config: {
    rtlReverse?: boolean;
    dataKeys?: string[];
    dataTransform?: (item: T) => any;
    emptyFallback?: T[];
  } = {}
) => {
  const { isRTL } = useTranslation();
  const { rtlReverse = true, dataKeys = [], dataTransform, emptyFallback = [] } = config;
  
  return useMemo(() => {
    performanceMonitor.startMeasure('optimize_chart_data');
    
    if (!originalData || !Array.isArray(originalData) || originalData.length === 0) {
      performanceMonitor.endMeasure('optimize_chart_data');
      return emptyFallback;
    }
    
    // Optimize by applying transformations only once
    let processedData = originalData;
    
    // Apply custom data transformations if provided
    if (dataTransform) {
      processedData = processedData.map(dataTransform);
    }
    
    // Only reverse if in RTL mode and reversal is needed
    if (isRTL && rtlReverse) {
      processedData = [...processedData].reverse();
    }
    
    performanceMonitor.endMeasure('optimize_chart_data');
    return processedData;
  }, [originalData, isRTL, rtlReverse, dataTransform, JSON.stringify(emptyFallback), JSON.stringify(dataKeys)]);
};

