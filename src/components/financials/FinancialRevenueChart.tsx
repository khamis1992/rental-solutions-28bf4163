
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useFinancials } from '@/hooks/use-financials';

interface MonthlyData {
  name: string;
  income: number;
  expenses: number;
}

const FinancialRevenueChart = () => {
  const { transactions } = useFinancials();
  const [chartData, setChartData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Process transactions to monthly data
      const monthlyDataMap = new Map<string, { income: number, expenses: number }>();
      
      // Initialize last 12 months with zero values
      const today = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 11; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${monthNames[month.getMonth()]}`;
        monthlyDataMap.set(monthKey, { income: 0, expenses: 0 });
      }
      
      // Fill with actual transaction data
      transactions.forEach(transaction => {
        if (!transaction.date) return;
        
        const date = new Date(transaction.date);
        const monthKey = monthNames[date.getMonth()];
        
        if (monthlyDataMap.has(monthKey)) {
          const currentData = monthlyDataMap.get(monthKey)!;
          
          if (transaction.type === 'income') {
            currentData.income += Number(transaction.amount || 0);
          } else {
            currentData.expenses += Number(transaction.amount || 0);
          }
          
          monthlyDataMap.set(monthKey, currentData);
        }
      });
      
      // Convert map to array for chart
      const processedData = Array.from(monthlyDataMap.entries())
        .map(([name, data]) => ({
          name,
          income: data.income,
          expenses: data.expenses
        }));
      
      console.log("Processed monthly data for revenue chart:", processedData);
      setChartData(processedData);
    } else {
      // If no transactions, initialize with empty data
      const emptyData: MonthlyData[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 0; i < 12; i++) {
        emptyData.push({
          name: monthNames[i],
          income: 0,
          expenses: 0
        });
      }
      
      setChartData(emptyData);
    }
  }, [transactions]);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Revenue vs. Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer
            config={{
              income: {
                label: "Income",
                color: "#22c55e"
              },
              expenses: {
                label: "Expenses",
                color: "#ef4444"
              }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${formatCurrency(value / 1000).split('.')[0]}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialRevenueChart;
