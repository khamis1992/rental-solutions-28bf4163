import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

interface FinancialReportProps {
  data: {
    total: number;
    income: number;
    expense: number;
  };
}

const FinancialReport: React.FC<FinancialReportProps> = ({ data }) => {
  // Ensure data has correct shape or provide defaults
  const financialData = data || { total: 0, income: 0, expense: 0 };
  const total = financialData.total || 0;
  const income = financialData.income || 0;
  const expense = financialData.expense || 0;
  
  const percentage = income ? Math.round((income / total) * 100) : 0;

  return (
    <Card>
      <CardTitle>Financial Report</CardTitle>
      <CardContent>
        <div className="financial-summary">
          <div>Total: ${total.toLocaleString()}</div>
          <div>Income: ${income.toLocaleString()}</div>
          <div>Expenses: ${expense.toLocaleString()}</div>
          <div>Profit Percentage: {percentage}%</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialReport;
