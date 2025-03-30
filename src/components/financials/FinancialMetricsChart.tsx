
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, ResponsiveContainer, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

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

  const toggleChartType = () => {
    setChartType(prev => prev === 'pie' ? 'bar' : 'pie');
  };

  const renderLegendItem = (value: string, entry: any, index: number) => {
    return (
      <span className="flex items-center text-sm" key={`legend-${index}`}>
        <span style={{ backgroundColor: COLORS[index % COLORS.length] }} className="inline-block w-3 h-3 mr-2 rounded-sm" />
        <span className="opacity-90">{entry.name}</span>
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expense Categories</CardTitle>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleChartType}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            View as {chartType === 'pie' ? 'Bar Chart' : 'Pie Chart'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartType === 'pie' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={createCustomColor(index)} />
                  ))}
                </Pie>
                <Legend 
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={renderLegendItem}
                  wrapperStyle={{ paddingLeft: '20px' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={expenseData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                />
                <Bar dataKey="value" barSize={30}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={createCustomColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialMetricsChart;
