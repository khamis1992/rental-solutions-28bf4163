
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
      <CardTitle className="p-4">Financial Report</CardTitle>
      <CardContent>
        <div className="financial-summary space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Total:</span> 
            <span>${total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Income:</span> 
            <span>${income.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Expenses:</span> 
            <span>${expense.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Profit Percentage:</span> 
            <span>{percentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialReport;
