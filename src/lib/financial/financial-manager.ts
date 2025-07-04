import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  reference_id?: string;
  reference_type?: 'agreement' | 'vehicle' | 'customer' | 'maintenance';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check';
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  created_by: string;
  approved_by?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface FinancialReport {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: Date;
  end_date: Date;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  transactions_count: number;
  categories: Record<string, number>;
  trends: {
    income_trend: number;
    expense_trend: number;
    profit_trend: number;
  };
}

export interface BudgetItem {
  id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  period: string;
  status: 'within_budget' | 'warning' | 'exceeded';
}

export interface CashFlowProjection {
  date: Date;
  projected_income: number;
  projected_expenses: number;
  projected_balance: number;
  actual_income?: number;
  actual_expenses?: number;
  actual_balance?: number;
}

export class FinancialManager {
  private static instance: FinancialManager;
  private exchangeRates: Map<string, number> = new Map();
  private baseCurrency = 'QAR';

  private constructor() {
    this.loadExchangeRates();
  }

  public static getInstance(): FinancialManager {
    if (!FinancialManager.instance) {
      FinancialManager.instance = new FinancialManager();
    }
    return FinancialManager.instance;
  }

  // Record financial transaction
  async recordTransaction(transaction: Omit<FinancialTransaction, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          currency: transaction.currency,
          date: transaction.date.toISOString(),
          description: transaction.description,
          reference_id: transaction.reference_id,
          reference_type: transaction.reference_type,
          payment_method: transaction.payment_method,
          status: transaction.status,
          created_by: transaction.created_by,
          approved_by: transaction.approved_by,
          tags: transaction.tags,
          metadata: transaction.metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Update related records
      await this.updateRelatedRecords(transaction);

      // Check budget limits
      await this.checkBudgetLimits(transaction.category, transaction.amount);

      toast.success('Transaction recorded successfully');
      return data.id;
    } catch (error) {
      console.error('Failed to record transaction:', error);
      toast.error('Failed to record transaction');
      throw error;
    }
  }

  // Generate financial report
  async generateReport(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    startDate: Date,
    endDate: Date
  ): Promise<FinancialReport> {
    try {
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      const income = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
      const netProfit = income - expenses;

      // Calculate category breakdown
      const categories: Record<string, number> = {};
      transactions?.forEach(t => {
        if (!categories[t.category]) categories[t.category] = 0;
        categories[t.category] += t.amount;
      });

      // Calculate trends
      const trends = await this.calculateTrends(period, startDate, endDate);

      return {
        period,
        start_date: startDate,
        end_date: endDate,
        total_income: income,
        total_expenses: expenses,
        net_profit: netProfit,
        transactions_count: transactions?.length || 0,
        categories,
        trends
      };
    } catch (error) {
      console.error('Failed to generate financial report:', error);
      throw error;
    }
  }

  // Calculate cash flow projection
  async calculateCashFlowProjection(days: number = 30): Promise<CashFlowProjection[]> {
    try {
      const projections: CashFlowProjection[] = [];
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const projection = await this.calculateDailyProjection(date);
        projections.push(projection);
      }

      return projections;
    } catch (error) {
      console.error('Failed to calculate cash flow projection:', error);
      throw error;
    }
  }

  // Manage budget
  async createBudget(category: string, amount: number, period: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('budgets')
        .insert({
          category,
          allocated_amount: amount,
          spent_amount: 0,
          remaining_amount: amount,
          period,
          status: 'within_budget'
        });

      if (error) throw error;
      toast.success('Budget created successfully');
    } catch (error) {
      console.error('Failed to create budget:', error);
      toast.error('Failed to create budget');
      throw error;
    }
  }

  // Get budget status
  async getBudgetStatus(): Promise<BudgetItem[]> {
    try {
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .order('category');

      if (error) throw error;

      return budgets?.map(budget => ({
        id: budget.id,
        category: budget.category,
        allocated_amount: budget.allocated_amount,
        spent_amount: budget.spent_amount,
        remaining_amount: budget.remaining_amount,
        period: budget.period,
        status: budget.status
      })) || [];
    } catch (error) {
      console.error('Failed to get budget status:', error);
      throw error;
    }
  }

  // Currency conversion
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = this.exchangeRates.get(fromCurrency) || 1;
    const toRate = this.exchangeRates.get(toCurrency) || 1;
    
    const baseAmount = amount / fromRate;
    return baseAmount * toRate;
  }

  // Financial analytics
  async getFinancialAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      const analytics = {
        totalTransactions: transactions?.length || 0,
        totalIncome: 0,
        totalExpenses: 0,
        averageTransactionAmount: 0,
        mostExpensiveTransaction: null,
        mostCommonCategory: null,
        paymentMethodBreakdown: {},
        dailyTrends: {},
        categoryBreakdown: {}
      };

      if (transactions && transactions.length > 0) {
        // Calculate totals
        analytics.totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        analytics.totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        analytics.averageTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;

        // Find most expensive transaction
        analytics.mostExpensiveTransaction = transactions.reduce((max, t) => t.amount > max.amount ? t : max, transactions[0]);

                 // Payment method breakdown
         const paymentMethods: Record<string, number> = {};
         transactions.forEach(t => {
           if (!paymentMethods[t.payment_method]) paymentMethods[t.payment_method] = 0;
           paymentMethods[t.payment_method]++;
         });
         analytics.paymentMethodBreakdown = paymentMethods;

         // Category breakdown
         const categories: Record<string, number> = {};
         transactions.forEach(t => {
           if (!categories[t.category]) categories[t.category] = 0;
           categories[t.category] += t.amount;
         });
         analytics.categoryBreakdown = categories;
         analytics.mostCommonCategory = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b) || null;

         // Daily trends
         const dailyTrends: Record<string, { income: number; expenses: number }> = {};
         transactions.forEach(t => {
           const date = new Date(t.date).toISOString().split('T')[0];
           if (!dailyTrends[date]) dailyTrends[date] = { income: 0, expenses: 0 };
           if (t.type === 'income') dailyTrends[date].income += t.amount;
           else if (t.type === 'expense') dailyTrends[date].expenses += t.amount;
         });
         analytics.dailyTrends = dailyTrends;
      }

      return analytics;
    } catch (error) {
      console.error('Failed to get financial analytics:', error);
      throw error;
    }
  }

  // Generate invoice
  async generateInvoice(agreementId: string, amount: number, dueDate: Date): Promise<string> {
    try {
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .select('*, customers:profiles(*), vehicles(*)')
        .eq('id', agreementId)
        .single();

      if (agreementError) throw agreementError;

      const invoiceNumber = `INV-${Date.now()}`;
      
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          agreement_id: agreementId,
          customer_id: agreement.customer_id,
          amount,
          due_date: dueDate.toISOString(),
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Generate PDF invoice
      await this.generateInvoicePDF(invoice, agreement);

      toast.success('Invoice generated successfully');
      return invoice.id;
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Failed to generate invoice');
      throw error;
    }
  }

  // Late payment management
  async calculateLateFees(): Promise<void> {
    try {
      const { data: overduePayments, error } = await supabase
        .from('unified_payments')
        .select('*, leases!inner(*)')
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString());

      if (error) throw error;

      for (const payment of overduePayments || []) {
        const daysLate = Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24));
        const dailyLateFee = payment.leases.daily_late_fee || 120;
        const lateFee = Math.min(daysLate * dailyLateFee, 3000); // Cap at 3000

        if (lateFee > 0) {
          await this.recordTransaction({
            type: 'income',
            category: 'Late Fees',
            amount: lateFee,
            currency: 'QAR',
            date: new Date(),
            description: `Late fee for payment ${payment.id}`,
            reference_id: payment.id,
            reference_type: 'agreement',
            payment_method: 'system',
            status: 'completed',
            created_by: 'system'
          });
        }
      }
    } catch (error) {
      console.error('Failed to calculate late fees:', error);
    }
  }

  // Private helper methods
  private async updateRelatedRecords(transaction: Omit<FinancialTransaction, 'id'>): Promise<void> {
    // Update related agreement, vehicle, or customer records based on transaction type
    if (transaction.reference_type === 'agreement' && transaction.reference_id) {
      // Update agreement financial status
      const { error } = await supabase
        .from('leases')
        .update({ last_payment_date: new Date().toISOString() })
        .eq('id', transaction.reference_id);

      if (error) console.error('Failed to update agreement:', error);
    }
  }

  private async checkBudgetLimits(category: string, amount: number): Promise<void> {
    try {
      const { data: budget, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('category', category)
        .single();

      if (error || !budget) return;

      const newSpentAmount = budget.spent_amount + amount;
      const newRemainingAmount = budget.allocated_amount - newSpentAmount;
      
      let status = 'within_budget';
      if (newRemainingAmount < 0) {
        status = 'exceeded';
        toast.warning(`Budget exceeded for ${category}`);
      } else if (newRemainingAmount < budget.allocated_amount * 0.1) {
        status = 'warning';
        toast.warning(`Budget warning for ${category}: ${newRemainingAmount.toFixed(2)} QAR remaining`);
      }

      await supabase
        .from('budgets')
        .update({
          spent_amount: newSpentAmount,
          remaining_amount: newRemainingAmount,
          status
        })
        .eq('id', budget.id);
    } catch (error) {
      console.error('Failed to check budget limits:', error);
    }
  }

  private async calculateTrends(period: string, startDate: Date, endDate: Date): Promise<any> {
    // Calculate previous period for comparison
    const periodDiff = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDiff);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const currentReport = await this.generateReport(period as any, startDate, endDate);
    const previousReport = await this.generateReport(period as any, prevStartDate, prevEndDate);

    return {
      income_trend: this.calculatePercentageChange(previousReport.total_income, currentReport.total_income),
      expense_trend: this.calculatePercentageChange(previousReport.total_expenses, currentReport.total_expenses),
      profit_trend: this.calculatePercentageChange(previousReport.net_profit, currentReport.net_profit)
    };
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private async calculateDailyProjection(date: Date): Promise<CashFlowProjection> {
    // This is a simplified projection - in a real system, you'd use more sophisticated algorithms
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const baseIncome = isWeekend ? 500 : 1500; // Lower income on weekends
    const baseExpenses = isWeekend ? 200 : 800;
    
    // Add some randomness to make it more realistic
    const incomeVariation = Math.random() * 0.3 - 0.15; // ±15%
    const expenseVariation = Math.random() * 0.2 - 0.1; // ±10%
    
    const projectedIncome = baseIncome * (1 + incomeVariation);
    const projectedExpenses = baseExpenses * (1 + expenseVariation);
    
    return {
      date,
      projected_income: projectedIncome,
      projected_expenses: projectedExpenses,
      projected_balance: projectedIncome - projectedExpenses
    };
  }

  private async generateInvoicePDF(invoice: any, agreement: any): Promise<void> {
    // PDF generation logic would go here
    // For now, just a placeholder
    console.log('Generating PDF for invoice:', invoice.id);
  }

  private async loadExchangeRates(): Promise<void> {
    try {
      // In a real system, you'd fetch these from an API
      this.exchangeRates.set('QAR', 1);
      this.exchangeRates.set('USD', 3.64);
      this.exchangeRates.set('EUR', 4.12);
      this.exchangeRates.set('GBP', 4.75);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  }
}

export const financialManager = FinancialManager.getInstance();