
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, ResponsiveContainer, Cell, Legend } from 'recharts';

const expenseData = [
  { name: 'Maintenance', value: 35 },
  { name: 'Insurance', value: 25 },
  { name: 'Fuel', value: 20 },
  { name: 'Taxes', value: 15 },
  { name: 'Other', value: 5 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const FinancialMetricsChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer
            config={{
              Maintenance: {
                label: "Maintenance",
                color: COLORS[0]
              },
              Insurance: {
                label: "Insurance",
                color: COLORS[1]
              },
              Fuel: {
                label: "Fuel",
                color: COLORS[2]
              },
              Taxes: {
                label: "Taxes",
                color: COLORS[3]
              },
              Other: {
                label: "Other",
                color: COLORS[4]
              }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expenseData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`var(--color-${entry.name})`} 
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialMetricsChart;
