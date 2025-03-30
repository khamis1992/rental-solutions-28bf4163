import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, ResponsiveContainer, Cell, Legend } from 'recharts';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';
interface ExpenseData {
  name: string;
  value: number;
}
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const FinancialMetricsChart = () => {
  const {
    expenses
  } = useFinancials();
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  useEffect(() => {
    if (expenses && expenses.length > 0) {
      console.log("Processing expenses for pie chart:", expenses.length);

      // Process expenses by category
      const categoriesMap = new Map<string, number>();
      expenses.forEach(expense => {
        const category = expense.category || 'Other';
        const amount = Number(expense.amount || 0);
        categoriesMap.set(category, (categoriesMap.get(category) || 0) + amount);
      });

      // Convert map to array and sort by value
      const processedData = Array.from(categoriesMap.entries()).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      })).sort((a, b) => b.value - a.value)
      // Get top 5 categories + combine the rest
      .reduce((acc: ExpenseData[], curr, index, array) => {
        if (index < 5) {
          acc.push(curr);
        } else if (index === 5) {
          // Add "Other" category with remaining expenses
          const otherValue = array.slice(5).reduce((sum, item) => sum + item.value, 0);
          if (otherValue > 0) {
            acc.push({
              name: 'Other',
              value: parseFloat(otherValue.toFixed(2))
            });
          }
        }
        return acc;
      }, []);
      console.log("Processed expense data for pie chart:", processedData);
      setExpenseData(processedData);
    } else {
      // If no expenses, show default placeholder data
      setExpenseData([{
        name: 'No expense data',
        value: 1
      }]);
    }
  }, [expenses]);
  const createCustomColor = (index: number) => {
    return COLORS[index % COLORS.length];
  };

  // Create chart config from expense data
  const chartConfig = expenseData.reduce((config, category, index) => {
    config[category.name] = {
      label: category.name,
      color: createCustomColor(index)
    };
    return config;
  }, {} as Record<string, {
    label: string;
    color: string;
  }>);
  return;
};
export default FinancialMetricsChart;