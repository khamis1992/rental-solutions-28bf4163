
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const monthlyData = [
  { name: 'Jan', income: 12000, expenses: 8000 },
  { name: 'Feb', income: 15000, expenses: 7500 },
  { name: 'Mar', income: 18000, expenses: 9000 },
  { name: 'Apr', income: 16000, expenses: 8800 },
  { name: 'May', income: 21000, expenses: 9200 },
  { name: 'Jun', income: 19000, expenses: 8700 },
  { name: 'Jul', income: 23000, expenses: 9500 },
  { name: 'Aug', income: 25000, expenses: 10000 },
  { name: 'Sep', income: 22000, expenses: 9800 },
  { name: 'Oct', income: 20000, expenses: 9300 },
  { name: 'Nov', income: 24000, expenses: 9900 },
  { name: 'Dec', income: 27000, expenses: 10500 }
];

const FinancialRevenueChart = () => {
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
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
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
                  tickFormatter={(value) => `$${value / 1000}k`}
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
