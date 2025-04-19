
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';
import FinancialExpensesBreakdown from '@/components/financials/FinancialExpensesBreakdown';
import { useAgreements } from '@/hooks/use-agreements';
import { usePayments } from '@/hooks/use-payments';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

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
  
  const { agreements, isLoading: isLoadingAgreements } = useAgreements();
  const { trafficFines, isLoading: isLoadingFines } = useTrafficFines();
  
  const [filter, setFilter] = useState({
    status: 'active',
    search: '',
    startDate: undefined,
    endDate: undefined
  });
  
  // Filter agreements based on current filter settings
  const filteredAgreements = React.useMemo(() => {
    if (!agreements) return [];
    
    return agreements.filter(agreement => {
      // Filter by status
      if (filter.status && filter.status !== 'all') {
        if (filter.status !== agreement.status) return false;
      }
      
      // Filter by search term (customer name or agreement number)
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const customerName = agreement.customers?.full_name?.toLowerCase() || '';
        const agreementNumber = agreement.agreement_number?.toLowerCase() || '';
        
        if (!customerName.includes(searchTerm) && !agreementNumber.includes(searchTerm)) {
          return false;
        }
      }
      
      // Filter by date range
      if (filter.startDate && agreement.start_date) {
        const startDate = new Date(agreement.start_date);
        if (startDate < filter.startDate) return false;
      }
      
      if (filter.endDate && agreement.start_date) {
        const startDate = new Date(agreement.start_date);
        if (startDate > filter.endDate) return false;
      }
      
      return true;
    });
  }, [agreements, filter]);
  
  // Get traffic fines by agreement
  const getTrafficFinesForAgreement = (agreementId) => {
    if (!trafficFines) return [];
    return trafficFines.filter(fine => fine.leaseId === agreementId);
  };
  
  // Load all required data
  const [agreementPaymentsMap, setAgreementPaymentsMap] = useState<Record<string, any>>({});
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  
  useEffect(() => {
    const fetchPaymentsForAgreements = async () => {
      if (!filteredAgreements || filteredAgreements.length === 0) return;
      
      setIsLoadingPayments(true);
      const paymentsMap = {};
      
      // For each agreement, fetch its payments
      for (const agreement of filteredAgreements) {
        try {
          const { data, error } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('lease_id', agreement.id);
            
          if (!error && data) {
            paymentsMap[agreement.id] = data;
          }
        } catch (err) {
          console.error(`Error fetching payments for agreement ${agreement.id}:`, err);
        }
      }
      
      setAgreementPaymentsMap(paymentsMap);
      setIsLoadingPayments(false);
    };
    
    fetchPaymentsForAgreements();
  }, [filteredAgreements]);
  
  // Calculate payment status and totals for each agreement
  const agreementFinancialData = React.useMemo(() => {
    if (!filteredAgreements) return [];
    
    return filteredAgreements.map(agreement => {
      const payments = agreementPaymentsMap[agreement.id] || [];
      const fines = getTrafficFinesForAgreement(agreement.id);
      
      const totalPaid = payments.reduce((sum, payment) => 
        payment.status === 'paid' ? sum + (payment.amount_paid || 0) : sum, 0);
        
      const outstandingBalance = (agreement.total_amount || 0) - totalPaid;
      
      const totalFinesAmount = fines.reduce((sum, fine) => 
        sum + (fine.fineAmount || 0), 0);
        
      const paidFinesAmount = fines.reduce((sum, fine) => 
        fine.paymentStatus === 'paid' ? sum + (fine.fineAmount || 0) : sum, 0);
        
      const outstandingFines = totalFinesAmount - paidFinesAmount;
      
      // Determine overall payment status
      let paymentStatus = 'Paid';
      if (outstandingBalance > 0) {
        paymentStatus = 'Partially Paid';
      } 
      if (totalPaid === 0) {
        paymentStatus = 'Unpaid';
      }
      
      // Get most recent payment date
      const lastPayment = payments.length > 0 ? 
        payments.sort((a, b) => 
          new Date(b.payment_date || '1970-01-01').getTime() - 
          new Date(a.payment_date || '1970-01-01').getTime()
        )[0] : null;
      
      return {
        ...agreement,
        payments,
        fines,
        totalPaid,
        outstandingBalance,
        totalFinesAmount,
        paidFinesAmount,
        outstandingFines,
        paymentStatus,
        lastPaymentDate: lastPayment?.payment_date || null
      };
    });
  }, [filteredAgreements, agreementPaymentsMap, trafficFines]);
  
  if (isLoadingSummary || isLoadingTransactions || isLoadingAgreements || isLoadingFines || isLoadingPayments) {
    return <div>Loading financial data...</div>;
  }

  // For the original analytics card
  const categoryTotals = transactions.reduce<Record<string, CategoryTotal>>((acc, transaction) => {
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
          value={formatCurrency(financialSummary?.overdueExpenses || 0)} 
          trend={financialSummary?.overdueExpenses > 0 ? 100 : 0}
          trendLabel="requires attention"
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      {/* Financial Agreements Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Financial Agreements Report</CardTitle>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 mr-1" />
            <span>Filters:</span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="w-full md:w-48">
              <Select
                value={filter.status}
                onValueChange={(value) => setFilter({...filter, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <DatePicker 
                date={filter.startDate} 
                setDate={(date) => setFilter({...filter, startDate: date})} 
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <DatePicker 
                date={filter.endDate} 
                setDate={(date) => setFilter({...filter, endDate: date})} 
                className="w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <Input
                placeholder="Search by customer or agreement #"
                value={filter.search}
                onChange={(e) => setFilter({...filter, search: e.target.value})}
                className="w-full"
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => setFilter({
                status: 'active',
                search: '',
                startDate: undefined,
                endDate: undefined
              })}
            >
              Reset
            </Button>
          </div>
          
          {/* Agreements Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Agreement #</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Outstanding Balance</TableHead>
                  <TableHead>Traffic Fines</TableHead>
                  <TableHead>Last Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreementFinancialData.length > 0 ? (
                  agreementFinancialData.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-medium">
                        {agreement.customers?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{agreement.agreement_number || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(agreement.total_amount || 0)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            agreement.paymentStatus === 'Paid' 
                              ? "bg-green-100 text-green-800" 
                              : agreement.paymentStatus === 'Partially Paid'
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {agreement.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(agreement.totalPaid || 0)}</TableCell>
                      <TableCell>{formatCurrency(agreement.outstandingBalance || 0)}</TableCell>
                      <TableCell>
                        {agreement.fines.length > 0 ? (
                          <div>
                            <span className="font-semibold">{agreement.fines.length} fines</span>
                            <div className="text-xs text-muted-foreground">
                              Total: {formatCurrency(agreement.totalFinesAmount || 0)}
                              {agreement.outstandingFines > 0 && (
                                <span className="text-red-600 ml-1">
                                  (Outstanding: {formatCurrency(agreement.outstandingFines)})
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No fines</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {agreement.lastPaymentDate ? 
                          new Date(agreement.lastPaymentDate).toLocaleDateString() : 
                          'No payments'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No agreements found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
