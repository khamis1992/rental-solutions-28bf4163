import { supabase } from '@/lib/supabase';
import { CarInstallmentContract, CarInstallmentPayment } from '@/types/car-installment';

export interface CollectionReport {
  period: string;
  totalCollections: number;
  expectedCollections: number;
  collectionRate: number;
  overdueAmount: number;
  numberOfContracts: number;
  averagePaymentAmount: number;
}

export interface InstallmentAnalytics {
  totalPortfolioValue: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  activeContracts: number;
  completedContracts: number;
  averageContractValue: number;
  collectionTrend: Array<{
    month: string;
    collected: number;
    expected: number;
  }>;
  topPerformingContracts: Array<{
    contractId: string;
    carType: string;
    collectionRate: number;
    totalValue: number;
  }>;
  overdueAnalysis: {
    totalOverdueAmount: number;
    overdueContracts: number;
    averageDaysOverdue: number;
    overdueByAge: Array<{
      ageRange: string;
      count: number;
      amount: number;
    }>;
  };
}

export class InstallmentReportingService {
  
  // Generate monthly collection report
  async generateMonthlyReport(year: number, month: number): Promise<CollectionReport> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Get all payments for the month
      const { data: payments, error: paymentsError } = await supabase
        .from('car_installment_payments')
        .select('*')
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString());

      if (paymentsError) {
        throw paymentsError;
      }

      // Calculate metrics
      const totalCollections = payments?.reduce((sum, payment) => 
        sum + (payment.paid_amount || 0), 0) || 0;
      
      const expectedCollections = payments?.reduce((sum, payment) => 
        sum + payment.amount, 0) || 0;

      const overdueAmount = payments?.filter(p => p.status === 'overdue')
        .reduce((sum, payment) => sum + payment.amount, 0) || 0;

      const uniqueContracts = new Set(payments?.map(p => p.contract_id)).size;

      return {
        period: `${year}-${month.toString().padStart(2, '0')}`,
        totalCollections,
        expectedCollections,
        collectionRate: expectedCollections > 0 ? (totalCollections / expectedCollections) * 100 : 0,
        overdueAmount,
        numberOfContracts: uniqueContracts,
        averagePaymentAmount: payments?.length ? totalCollections / payments.length : 0
      };

    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  // Generate quarterly collection report
  async generateQuarterlyReport(year: number, quarter: number): Promise<CollectionReport> {
    try {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      
      const monthlyReports = await Promise.all([
        this.generateMonthlyReport(year, startMonth),
        this.generateMonthlyReport(year, startMonth + 1),
        this.generateMonthlyReport(year, endMonth)
      ]);

      // Aggregate quarterly data
      const totalCollections = monthlyReports.reduce((sum, report) => sum + report.totalCollections, 0);
      const expectedCollections = monthlyReports.reduce((sum, report) => sum + report.expectedCollections, 0);
      const overdueAmount = monthlyReports.reduce((sum, report) => sum + report.overdueAmount, 0);
      const numberOfContracts = Math.max(...monthlyReports.map(r => r.numberOfContracts));

      return {
        period: `Q${quarter}-${year}`,
        totalCollections,
        expectedCollections,
        collectionRate: expectedCollections > 0 ? (totalCollections / expectedCollections) * 100 : 0,
        overdueAmount,
        numberOfContracts,
        averagePaymentAmount: totalCollections / (monthlyReports.reduce((sum, r) => sum + r.numberOfContracts, 0) || 1)
      };

    } catch (error) {
      console.error('Error generating quarterly report:', error);
      throw error;
    }
  }

  // Generate comprehensive analytics
  async generateInstallmentAnalytics(): Promise<InstallmentAnalytics> {
    try {
      // Get all contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('car_installment_contracts')
        .select('*');

      if (contractsError) {
        throw contractsError;
      }

      // Debug logging
      console.log('Contracts loaded for analytics:', {
        totalContracts: contracts?.length || 0,
        sampleContract: contracts?.[0] || null
      });

      // Get all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('car_installment_payments')
        .select('*');

      if (paymentsError) {
        throw paymentsError;
      }

      // Calculate basic metrics
      const totalPortfolioValue = contracts?.reduce((sum, contract) => 
        sum + contract.total_contract_value, 0) || 0;
      
      const totalCollected = payments?.reduce((sum, payment) => 
        sum + (payment.paid_amount || 0), 0) || 0;
      
      const totalPending = payments?.filter(p => p.status === 'pending')
        .reduce((sum, payment) => sum + payment.amount, 0) || 0;
      
      const totalOverdue = payments?.filter(p => p.status === 'overdue')
        .reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Since there's no status field in contracts, consider contracts with remaining installments as active
      const activeContracts = contracts?.filter(c => 
        (c.remaining_installments > 0 && c.amount_pending > 0)
      ).length || 0;
      
      // Consider contracts with no remaining installments as completed
      const completedContracts = contracts?.filter(c => 
        (c.remaining_installments === 0 || c.amount_pending === 0)
      ).length || 0;

      // Generate collection trend (last 12 months)
      const collectionTrend = await this.generateCollectionTrend();

      // Get top performing contracts
      const topPerformingContracts = await this.getTopPerformingContracts();

      // Analyze overdue payments
      const overdueAnalysis = await this.analyzeOverduePayments();

      return {
        totalPortfolioValue,
        totalCollected,
        totalPending,
        totalOverdue,
        activeContracts,
        completedContracts,
        averageContractValue: contracts?.length ? totalPortfolioValue / contracts.length : 0,
        collectionTrend,
        topPerformingContracts,
        overdueAnalysis
      };

    } catch (error) {
      console.error('Error generating installment analytics:', error);
      throw error;
    }
  }

  private async generateCollectionTrend(): Promise<Array<{month: string, collected: number, expected: number}>> {
    try {
      const trend = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const report = await this.generateMonthlyReport(year, month);
        trend.push({
          month: `${year}-${month.toString().padStart(2, '0')}`,
          collected: report.totalCollections,
          expected: report.expectedCollections
        });
      }
      
      return trend;
    } catch (error) {
      console.error('Error generating collection trend:', error);
      return [];
    }
  }

  private async getTopPerformingContracts(): Promise<Array<{contractId: string, carType: string, collectionRate: number, totalValue: number}>> {
    try {
      const { data: contractsWithPayments, error } = await supabase
        .from('car_installment_contracts')
        .select(`
          id,
          car_type,
          total_contract_value,
          car_installment_payments (
            amount,
            paid_amount,
            status
          )
        `);

      if (error) {
        throw error;
      }

      const contractPerformance = contractsWithPayments?.map(contract => {
        const payments = contract.car_installment_payments || [];
        const totalExpected = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const totalCollected = payments.reduce((sum: number, p: any) => sum + (p.paid_amount || 0), 0);
        const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

        return {
          contractId: contract.id,
          carType: contract.car_type,
          collectionRate,
          totalValue: contract.total_contract_value
        };
      }).sort((a, b) => b.collectionRate - a.collectionRate).slice(0, 10) || [];

      return contractPerformance;
    } catch (error) {
      console.error('Error getting top performing contracts:', error);
      return [];
    }
  }

  private async analyzeOverduePayments(): Promise<{
    totalOverdueAmount: number;
    overdueContracts: number;
    averageDaysOverdue: number;
    overdueByAge: Array<{ageRange: string, count: number, amount: number}>;
  }> {
    try {
      const { data: overduePayments, error } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('status', 'overdue');

      if (error) {
        throw error;
      }

      const totalOverdueAmount = overduePayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const overdueContracts = new Set(overduePayments?.map(p => p.contract_id)).size;

      // Calculate average days overdue
      const today = new Date();
      const totalDaysOverdue = overduePayments?.reduce((sum, payment) => {
        const paymentDate = new Date(payment.payment_date);
        const daysOverdue = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(0, daysOverdue);
      }, 0) || 0;

      const averageDaysOverdue = overduePayments?.length ? totalDaysOverdue / overduePayments.length : 0;

      // Group by age ranges
      const ageRanges = [
        { range: '1-30 days', min: 1, max: 30 },
        { range: '31-60 days', min: 31, max: 60 },
        { range: '61-90 days', min: 61, max: 90 },
        { range: '90+ days', min: 91, max: Infinity }
      ];

      const overdueByAge = ageRanges.map(ageRange => {
        const paymentsInRange = overduePayments?.filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          const daysOverdue = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysOverdue >= ageRange.min && daysOverdue <= ageRange.max;
        }) || [];

        return {
          ageRange: ageRange.range,
          count: paymentsInRange.length,
          amount: paymentsInRange.reduce((sum, payment) => sum + payment.amount, 0)
        };
      });

      return {
        totalOverdueAmount,
        overdueContracts,
        averageDaysOverdue,
        overdueByAge
      };

    } catch (error) {
      console.error('Error analyzing overdue payments:', error);
      return {
        totalOverdueAmount: 0,
        overdueContracts: 0,
        averageDaysOverdue: 0,
        overdueByAge: []
      };
    }
  }

  // Export report to CSV
  async exportCollectionReport(report: CollectionReport): Promise<string> {
    try {
      const csvContent = [
        'Period,Total Collections,Expected Collections,Collection Rate,Overdue Amount,Number of Contracts,Average Payment',
        `${report.period},${report.totalCollections},${report.expectedCollections},${report.collectionRate.toFixed(2)}%,${report.overdueAmount},${report.numberOfContracts},${report.averagePaymentAmount.toFixed(2)}`
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
}

export const installmentReportingService = new InstallmentReportingService(); 