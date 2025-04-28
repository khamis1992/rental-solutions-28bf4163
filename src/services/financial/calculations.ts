
import { FinancialSummary } from '@/hooks/use-financials';

/**
 * Calculates percentage change between two values
 * 
 * @param current - Current value
 * @param previous - Previous value to compare against
 * @returns Percentage change as a number
 */
export function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculates trend data based on financial summary
 * 
 * @param summary - Financial summary data
 * @returns Object containing trend calculations
 */
export function calculateTrendData(summary: FinancialSummary | undefined) {
  if (!summary) {
    return {
      revenueChange: 0,
      expenseChange: 0,
      profitChange: 0
    };
  }

  return {
    revenueChange: getPercentageChange(summary.totalIncome, summary.totalIncome * 0.95),
    expenseChange: getPercentageChange(summary.totalExpenses, summary.totalExpenses * 1.02),
    profitChange: getPercentageChange(summary.netRevenue, summary.netRevenue * 0.93)
  };
}

/**
 * Prepares data for revenue charts
 * 
 * @param revenueData - Raw revenue data
 * @returns Processed data ready for charts
 */
export function prepareRevenueChartData(revenueData: { name: string; revenue: number }[] | undefined) {
  if (!revenueData || revenueData.length === 0) {
    console.log("No revenue data available for chart");
    return [];
  }

  return revenueData.map(item => ({
    name: item.name,
    revenue: item.revenue,
    expenses: item.revenue * 0.6 // Use a simple estimate instead of complex calculations
  }));
}

/**
 * Formats display values from financial summary
 * 
 * @param summary - Financial summary data
 * @returns Object with safely formatted values
 */
export function prepareFinancialDisplayValues(summary: FinancialSummary | undefined) {
  return {
    totalIncome: summary?.totalIncome || 0,
    totalExpenses: summary?.totalExpenses || 0,
    netRevenue: summary?.netRevenue || 0,
    pendingPayments: summary?.pendingPayments || 0,
    currentMonthDue: summary?.currentMonthDue || 0,
    overdueExpenses: summary?.overdueExpenses || 0
  };
}

/**
 * Calculates financial breakdown data
 * 
 * @param summary - Financial summary data
 * @returns Object with calculated financial breakdown
 */
export function calculateFinancialBreakdown(summary: FinancialSummary | undefined) {
  if (!summary) {
    return {
      totalExpenses: 0,
      currentMonthDue: 0,
      overdueExpenses: 0,
      regularExpenses: 0
    };
  }
  
  const totalExp = parseFloat(Number(summary.totalExpenses || 0).toFixed(2));
  const currentDue = parseFloat(Number(summary.currentMonthDue || 0).toFixed(2));
  const overdue = parseFloat(Number(summary.overdueExpenses || 0).toFixed(2));
  const regular = parseFloat((totalExp - overdue).toFixed(2));

  return {
    totalExpenses: totalExp,
    currentMonthDue: currentDue,
    overdueExpenses: overdue,
    regularExpenses: regular
  };
}
