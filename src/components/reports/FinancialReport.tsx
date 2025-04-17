
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface FinancialReportProps {
  data: {
    revenue: Array<{ month: string; amount: number }>;
    expenses: Array<{ month: string; amount: number }>;
  };
}

const FinancialReport: React.FC<FinancialReportProps> = ({ data }) => {
  // Transform data for the chart
  const chartData = data.revenue.map((item, index) => {
    const expense = data.expenses[index] || { month: item.month, amount: 0 };
    return {
      name: item.month,
      revenue: item.amount,
      expenses: expense.amount,
      profit: item.amount - expense.amount
    };
  });

  return (
    <div className="mt-6">
      <h3 className="text-base font-medium mb-4">Financial Summary</h3>
      {chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No financial data available
        </div>
      )}
    </div>
  );
};

export default FinancialReport;
