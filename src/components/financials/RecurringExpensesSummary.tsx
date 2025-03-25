
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { Calendar, RefreshCw } from 'lucide-react';
import { FinancialTransaction } from '@/hooks/use-financials';

interface RecurringExpensesSummaryProps {
  recurringExpenses: FinancialTransaction[];
  isLoading: boolean;
}

const RecurringExpensesSummary: React.FC<RecurringExpensesSummaryProps> = ({
  recurringExpenses,
  isLoading
}) => {
  const getNextPaymentDate = (expense: FinancialTransaction) => {
    if (!expense.nextPaymentDate) return 'Not scheduled';
    
    return format(new Date(expense.nextPaymentDate), 'MMM d, yyyy');
  };

  const getFrequencyText = (interval: string | null) => {
    if (!interval) return 'Not set';
    
    if (interval.includes('month')) return 'Monthly';
    if (interval.includes('week')) return 'Weekly';
    if (interval.includes('day')) return 'Daily';
    if (interval.includes('year')) return 'Yearly';
    
    return interval;
  };

  // Calculate total monthly recurring expense
  const totalMonthly = recurringExpenses.reduce((sum, expense) => {
    // Only include expenses with recurring interval containing 'month'
    if (expense.recurringInterval && expense.recurringInterval.includes('month')) {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
          <CardDescription>Loading recurring expenses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Recurring Expenses</CardTitle>
            <CardDescription>Summary of your recurring expenses</CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm font-medium text-muted-foreground">Total Monthly</div>
            <div className="text-2xl font-bold text-red-600">${totalMonthly.toLocaleString()}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recurringExpenses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No recurring expenses set up.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="text-red-600">${expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {getFrequencyText(expense.recurringInterval)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        {getNextPaymentDate(expense)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringExpensesSummary;
