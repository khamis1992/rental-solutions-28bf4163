
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Receipt, Plus, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExpensesList from '@/components/financials/expenses/ExpensesList';
import ExpenseDialog from '@/components/financials/expenses/ExpenseDialog';
import { useFinancials, FinancialTransaction } from '@/hooks/use-financials';

const Expenses = () => {
  const {
    transactions,
    isLoadingTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    systemDate,
    refetchTransactions
  } = useFinancials();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<FinancialTransaction | undefined>(undefined);
  const [dialogTitle, setDialogTitle] = useState('Add Expense');

  // Get only expense transactions
  const expenses = transactions.filter(transaction => transaction.type === 'expense');

  const handleAddExpense = () => {
    setCurrentExpense(undefined);
    setDialogTitle('Add Expense');
    setIsExpenseDialogOpen(true);
  };

  const handleEditExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setCurrentExpense(expense);
      setDialogTitle('Edit Expense');
      setIsExpenseDialogOpen(true);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteTransaction(id);
    }
  };

  const handleExpenseSubmit = (data: any) => {
    // Add type: 'expense' to ensure it's properly categorized
    const expenseData = {
      ...data,
      type: 'expense' as const
    };

    if (currentExpense) {
      updateTransaction({ 
        id: currentExpense.id, 
        data: expenseData
      });
    } else {
      addTransaction(expenseData);
    }
  };

  const handleExportExpenses = () => {
    // Implementation for exporting expenses to CSV/Excel could be added here
    alert('Export functionality will be implemented here');
  };

  const handleGenerateReport = () => {
    // Implementation for generating expense reports could be added here
    alert('Report generation functionality will be implemented here');
  };

  return (
    <PageContainer
      title="Expense Management"
      description="Track and manage business expenses"
      systemDate={systemDate}
    >
      <SectionHeader
        title="Expenses"
        description="Manage fixed and recurring expenses for your business"
        icon={Receipt}
        actions={
          <>
            <Button variant="outline" onClick={handleGenerateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={handleExportExpenses}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={handleAddExpense}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <ExpensesList
          expenses={expenses}
          isLoading={isLoadingTransactions}
          onAddExpense={handleAddExpense}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onRefreshExpenses={refetchTransactions}
        />
      </div>

      <ExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSubmit={handleExpenseSubmit}
        expense={currentExpense}
        title={dialogTitle}
      />
    </PageContainer>
  );
};

export default Expenses;
