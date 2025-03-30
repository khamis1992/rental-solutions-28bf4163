
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';

// Custom color palette
const COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#4ade80', '#F59E0B'];

const FinancialExpensesBreakdown = () => {
  const { expenses } = useFinancials();
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (expenses && expenses.length > 0) {
      setIsLoading(true);
      
      // Group expenses by category
      const categoryTotals = expenses.reduce((acc: Record<string, number>, expense) => {
        const category = expense.category || 'Other';
        const amount = Number(expense.amount || 0);
        
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      }, {});
      
      // Convert to array and sort
      const sortedData = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Get top 6 categories
      
      setChartData(sortedData);
      setIsLoading(false);
    } else {
      setChartData([
        { name: 'No Data', value: 0 }
      ]);
      setIsLoading(false);
    }
  }, [expenses]);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value).split('.')[0]} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialExpensesBreakdown;
