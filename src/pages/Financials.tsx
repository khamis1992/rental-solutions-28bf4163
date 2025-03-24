
import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { BarChart4, Plus, FileText, Download, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FinancialSummary from '@/components/financials/FinancialSummary';
import FinancialTransactions from '@/components/financials/FinancialTransactions';
import FinancialRevenueChart from '@/components/financials/FinancialRevenueChart';
import FinancialMetricsChart from '@/components/financials/FinancialMetricsChart';
import TransactionDialog from '@/components/financials/TransactionDialog';
import CarInstallmentContracts from '@/components/financials/car-installments/CarInstallmentContracts';
import { useFinancials, FinancialTransaction } from '@/hooks/use-financials';
import { useToast } from '@/hooks/use-toast';
import { checkAndGenerateMonthlyPayments, forceCheckAllAgreementsForPayments } from '@/lib/supabase';

const Financials = () => {
  const { toast } = useToast();
  const {
    transactions,
    isLoadingTransactions,
    financialSummary,
    isLoadingSummary,
    filters,
    setFilters,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    systemDate
  } = useFinancials();

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<FinancialTransaction | undefined>(undefined);
  const [dialogTitle, setDialogTitle] = useState('Add Transaction');
  const [activeTab, setActiveTab] = useState("transactions");

  // Check for monthly payments on page load
  useEffect(() => {
    // Run the payment check on every page load and use system date
    checkAndGenerateMonthlyPayments().then((result) => {
      console.log(`Automatic payment check completed for system date ${systemDate.toDateString()}:`, result);
      
      // Force check for payments for all agreements every time the financial page is loaded
      forceCheckAllAgreementsForPayments().then((forceResult) => {
        console.log("Force check for all agreements completed:", forceResult);
        if (forceResult.success && forceResult.generated > 0) {
          toast({
            title: 'Monthly payments processed',
            description: `System has generated ${forceResult.generated} new payments for active agreements.`
          });
        }
      });
    });
  }, [toast, systemDate]);

  const handleAddTransaction = () => {
    setCurrentTransaction(undefined);
    setDialogTitle('Add Transaction');
    setIsTransactionDialogOpen(true);
  };

  const handleEditTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setCurrentTransaction(transaction);
      setDialogTitle('Edit Transaction');
      setIsTransactionDialogOpen(true);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
    }
  };

  const handleTransactionSubmit = (data: Omit<FinancialTransaction, 'id'>) => {
    if (currentTransaction) {
      updateTransaction({ 
        id: currentTransaction.id, 
        data: data as Partial<FinancialTransaction> 
      });
    } else {
      addTransaction(data as Omit<FinancialTransaction, 'id'>);
    }
  };

  const handleExportData = () => {
    toast({
      title: 'Export initiated',
      description: 'Financial data export is being prepared.'
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: 'Report generation',
      description: 'Financial report is being generated.'
    });
  };

  // Handle filtering with the new filter values
  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    
    if (filters.transactionType && filters.transactionType !== 'all_types') {
      filtered = filtered.filter(t => t.type === filters.transactionType);
    }
    
    if (filters.category && filters.category !== 'all_categories') {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Get filtered transactions
  const filteredTransactions = getFilteredTransactions();

  return (
    <PageContainer
      title="Financial Management"
      description="Monitor and manage your financial transactions and reports"
      systemDate={systemDate}
    >
      <SectionHeader
        title="Financials"
        description={`Track your income, expenses, and financial performance`}
        icon={BarChart4}
        actions={
          <>
            <Button variant="outline" onClick={handleGenerateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={handleAddTransaction}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <FinancialSummary
          summary={financialSummary}
          isLoading={isLoadingSummary}
        />

        <Tabs 
          defaultValue="transactions" 
          className="space-y-6"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="installments">
              <Car className="h-4 w-4 mr-2" />
              Installment Contracts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="space-y-6">
            <FinancialTransactions
              transactions={filteredTransactions}
              isLoading={isLoadingTransactions}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              filters={filters}
              setFilters={setFilters}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialRevenueChart />
              <FinancialMetricsChart />
            </div>
          </TabsContent>
          
          <TabsContent value="installments" className="space-y-6">
            <CarInstallmentContracts />
          </TabsContent>
        </Tabs>

        <TransactionDialog
          open={isTransactionDialogOpen}
          onOpenChange={setIsTransactionDialogOpen}
          onSubmit={handleTransactionSubmit}
          transaction={currentTransaction}
          title={dialogTitle}
        />
      </div>
    </PageContainer>
  );
};

export default Financials;
