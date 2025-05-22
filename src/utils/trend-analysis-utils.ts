/**
 * Utility functions for trend analysis
 */

interface DataItem {
  [key: string]: any;
  year?: number;
}

/**
 * Calculate year-over-year comparison data
 */
export const calculateYearOverYear = (data: DataItem[], timeField: string, metricField: string) => {
  const groupedByMonth = data.reduce<Record<string, DataItem[]>>((acc, item) => {
    const date = new Date(item[timeField]);
    const monthKey = `${date.getMonth() + 1}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    
    acc[monthKey].push({
      ...item,
      year: date.getFullYear()
    });
    
    return acc;
  }, {});
  
  const result = Object.entries(groupedByMonth).map(([month, items]: [string, DataItem[]]) => {
    items.sort((a, b) => (a.year || 0) - (b.year || 0));
    
    const currentYearData = items[items.length - 1];
    const previousYearData = items.length > 1 ? items[items.length - 2] : null;
    
    const monthName = new Date(currentYearData[timeField]).toLocaleString('default', { month: 'short' });
    
    return {
      [timeField]: `${monthName} ${currentYearData.year}`,
      current: currentYearData[metricField],
      comparison: previousYearData ? previousYearData[metricField] : 0,
      difference: previousYearData ? currentYearData[metricField] - previousYearData[metricField] : 0,
      percentChange: previousYearData && previousYearData[metricField] !== 0 
        ? ((currentYearData[metricField] - previousYearData[metricField]) / previousYearData[metricField] * 100).toFixed(2)
        : 0
    };
  });
  
  return result;
};

/**
 * Calculate month-over-month comparison data
 */
export const calculateMonthOverMonth = (data: DataItem[], timeField: string, metricField: string) => {
  const sortedData = [...data].sort((a, b) => {
    return new Date(a[timeField]).getTime() - new Date(b[timeField]).getTime();
  });
  
  return sortedData.map((item, index) => {
    const previousItem = index > 0 ? sortedData[index - 1] : null;
    
    return {
      [timeField]: item[timeField],
      current: item[metricField],
      comparison: previousItem ? previousItem[metricField] : 0,
      difference: previousItem ? item[metricField] - previousItem[metricField] : 0,
      percentChange: previousItem && previousItem[metricField] !== 0 
        ? ((item[metricField] - previousItem[metricField]) / previousItem[metricField] * 100).toFixed(2)
        : 0
    };
  });
};

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (data: DataItem[], timeField: string, metricField: string, windowSize = 3) => {
  const sortedData = [...data].sort((a, b) => {
    return new Date(a[timeField]).getTime() - new Date(b[timeField]).getTime();
  });
  
  return sortedData.map((item, index) => {
    const startIndex = Math.max(0, index - windowSize + 1);
    const window = sortedData.slice(startIndex, index + 1);
    
    const sum = window.reduce((acc, curr) => acc + curr[metricField], 0);
    const average = window.length > 0 ? sum / window.length : 0;
    
    return {
      [timeField]: item[timeField],
      current: item[metricField],
      comparison: average,
      difference: item[metricField] - average
    };
  });
};

/**
 * Calculate cumulative sum
 */
export const calculateCumulativeSum = (data: DataItem[], timeField: string, metricField: string) => {
  const sortedData = [...data].sort((a, b) => {
    return new Date(a[timeField]).getTime() - new Date(b[timeField]).getTime();
  });
  
  let cumulativeSum = 0;
  
  return sortedData.map(item => {
    cumulativeSum += item[metricField];
    
    return {
      [timeField]: item[timeField],
      current: item[metricField],
      comparison: cumulativeSum
    };
  });
};
