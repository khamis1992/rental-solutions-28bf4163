
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, TrendingUp, TrendingDown, AlertTriangle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';
import { generatePDFSafely, isPDFSystemReady } from '@/utils/pdf-generator';
import FinancialExpensesBreakdown from '@/components/financials/FinancialExpensesBreakdown';
import { toast } from 'sonner';

interface CategoryTotal {
  total: number;
  income: number;
  expense: number;
}

const FinancialReport = () => {
  const { 
    financialSummary, 
    isLoadingSummary, 
    transactions, 
    isLoadingTransactions 
  } = useFinancials();

  const handleGeneratePDF = async () => {
    try {
      console.log('Starting PDF generation for financial report...');
      
      // Check if PDF system is ready
      if (!isPDFSystemReady()) {
        toast.warning('PDF system is loading fonts. Please wait a moment and try again.');
        return;
      }

      const categoryTotals = (transactions || []).reduce<Record<string, CategoryTotal>>((acc, transaction) => {
        const category = transaction.category || 'Other';
        if (!acc[category]) {
          acc[category] = {
            total: 0,
            income: 0,
            expense: 0
          };
        }
        
        const amount = transaction.amount || 0;
        acc[category].total += amount;
        
        if (transaction.type === 'income') {
          acc[category].income += amount;
        } else {
          acc[category].expense += amount;
        }
        
        return acc;
      }, {});

      // Create PDF document definition
      const documentDefinition = {
        content: [
          {
            text: 'Financial Report',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 30]
          },
          {
            text: 'Financial Summary',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            columns: [
              {
                width: '25%',
                text: [
                  { text: 'Total Income\n', style: 'label' },
                  { text: formatCurrency(financialSummary?.totalIncome || 0), style: 'value' }
                ]
              },
              {
                width: '25%',
                text: [
                  { text: 'Total Expenses\n', style: 'label' },
                  { text: formatCurrency(financialSummary?.totalExpenses || 0), style: 'value' }
                ]
              },
              {
                width: '25%',
                text: [
                  { text: 'Net Revenue\n', style: 'label' },
                  { text: formatCurrency(financialSummary?.netRevenue || 0), style: 'value' }
                ]
              },
              {
                width: '25%',
                text: [
                  { text: 'Overdue\n', style: 'label' },
                  { text: formatCurrency(financialSummary?.overdueExpenses || 0), style: 'value' }
                ]
              }
            ]
          },
          // Category breakdown table
          {
            text: 'Income by Category',
            style: 'sectionHeader',
            margin: [0, 30, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: 'Category', style: 'tableHeader' },
                  { text: 'Income', style: 'tableHeader' },
                  { text: 'Expenses', style: 'tableHeader' },
                  { text: 'Net', style: 'tableHeader' },
                  { text: '% of Total', style: 'tableHeader' }
                ],
                ...Object.entries(categoryTotals).map(([category, data]) => [
                  category,
                  formatCurrency(data.income),
                  formatCurrency(data.expense),
                  formatCurrency(data.income - data.expense),
                  `${financialSummary?.totalIncome ? ((data.income / financialSummary.totalIncome) * 100).toFixed(1) : '0'}%`
                ])
              ]
            },
            layout: 'lightHorizontalLines'
          }
        ],
        styles: {
          header: {
            fontSize: 20,
            bold: true,
            color: '#1e40af'
          },
          subheader: {
            fontSize: 12,
            color: '#64748b'
          },
          sectionHeader: {
            fontSize: 16,
            bold: true,
            color: '#1e293b'
          },
          label: {
            fontSize: 10,
            color: '#64748b'
          },
          value: {
            fontSize: 14,
            bold: true,
            color: '#1e293b'
          },
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: 'white',
            fillColor: '#1e40af'
          }
        },
        defaultStyle: {
          fontSize: 10,
          font: 'Roboto' // Will be overridden by generatePDFSafely
        }
      };

      await generatePDFSafely(documentDefinition, {
        filename: `financial-report-${new Date().toISOString().split('T')[0]}.pdf`,
        preferArabic: false,
        timeout: 15000
      });

      toast.success('Financial report PDF generated successfully');
    } catch (error) {
      console.error('Error generating financial report PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  if (isLoadingSummary || isLoadingTransactions) {
    return <div>Loading financial data...</div>;
  }

  const categoryTotals = (transactions || []).reduce<Record<string, CategoryTotal>>((acc, transaction) => {
    const category = transaction.category || 'Other';
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        income: 0,
        expense: 0
      };
    }
    
    const amount = transaction.amount || 0;
    
    acc[category].total += amount;
    
    if (transaction.type === 'income') {
      acc[category].income += amount;
    } else {
      acc[category].expense += amount;
    }
    
    return acc;
  }, {});

  const categoryAnalytics = Object.entries(categoryTotals).map(([category, data]) => ({
    category,
    totalAmount: data.total,
    incomeAmount: data.income,
    expenseAmount: data.expense,
    percentageOfTotal: financialSummary?.totalIncome 
      ? ((data.income / financialSummary.totalIncome) * 100).toFixed(1) 
      : '0'
  }));

  return (
    <div className="space-y-8">
      {/* PDF Generation Button */}
      <div className="flex justify-end">
        <Button onClick={handleGeneratePDF} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Generate PDF Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Income" 
          value={formatCurrency(financialSummary?.totalIncome || 0)} 
          trend={2.5}
          trendLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(financialSummary?.totalExpenses || 0)} 
          trend={-1.2}
          trendLabel="vs last month"
          icon={TrendingDown}
          iconColor="text-red-500"
        />
        <StatCard 
          title="Net Revenue" 
          value={formatCurrency(financialSummary?.netRevenue || 0)} 
          trend={3.4}
          trendLabel="vs last month"
          icon={CircleDollarSign}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Overdue Expenses" 
          value={formatCurrency(financialSummary?.overdueExpenses ?? 0)} 
          trend={(financialSummary?.overdueExpenses ?? 0) > 0 ? 100 : 0}
          trendLabel="requires attention"
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      <FinancialExpensesBreakdown />

      <Card>
        <CardHeader>
          <CardTitle>Income by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Total Income</TableHead>
                <TableHead>Total Expenses</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>% of Total Income</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryAnalytics.length > 0 ? (
                categoryAnalytics.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(category.incomeAmount)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(category.expenseAmount)}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          category.incomeAmount - category.expenseAmount > 0 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                        }
                      >
                        {formatCurrency(category.incomeAmount - category.expenseAmount)}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.percentageOfTotal}%</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No financial data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;
