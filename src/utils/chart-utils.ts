
import { useMemo } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Optimizes chart data for RTL/LTR display and improves rendering performance
 */
export function useOptimizedChartData<T>(
  data: T[] | undefined,
  options: {
    rtlReverse?: boolean;
    dataKeys?: string[];
    valueKey?: string;
  } = {}
): T[] {
  const { isRTL } = useTranslation();
  const { rtlReverse = false, dataKeys = [], valueKey } = options;

  return useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // For RTL languages, we may need to reverse the order of data
    // (but not always - depends on the chart type)
    if (isRTL && rtlReverse) {
      const reversedData = [...data].reverse();
      
      // If specific data keys need special handling in RTL mode
      if (dataKeys.length > 0 && !valueKey) {
        return reversedData;
      }
      
      return reversedData;
    }
    
    return data;
  }, [data, isRTL, rtlReverse, dataKeys, valueKey]);
}

/**
 * Determines the optimal chart margin based on RTL direction
 */
export function useChartMargin(defaultMargin: { 
  top: number; 
  right: number; 
  bottom: number; 
  left: number;
}) {
  const { isRTL } = useTranslation();
  
  return useMemo(() => {
    if (isRTL) {
      // For RTL, swap left and right margins
      return {
        top: defaultMargin.top,
        right: defaultMargin.left,
        bottom: defaultMargin.bottom,
        left: defaultMargin.right
      };
    }
    
    return defaultMargin;
  }, [defaultMargin, isRTL]);
}

/**
 * Optimizes heavy calculations for charts
 */
export function useChartCalculation<T, R>(
  data: T[] | undefined,
  calculationFn: (data: T[]) => R,
  dependencies: any[] = []
): R | undefined {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return undefined;
    }
    
    return calculationFn(data);
  }, [data, calculationFn, ...dependencies]);
}
