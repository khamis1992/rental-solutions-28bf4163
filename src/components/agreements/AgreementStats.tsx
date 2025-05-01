import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FileCheck, FileText, FileClock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { LEASE_STATUSES, PAYMENT_STATUSES } from '@/types/database-common';
import { AgreementStats as AgreementStatsType } from '@/types/agreement-stats.types';
import { hasResponseData } from '@/utils/response-handler';

export function AgreementStats() {
  const [stats, setStats] = useState<AgreementStatsType>({
    totalAgreements: 0,
    activeAgreements: 0,
    pendingPayments: 0,
    overduePayments: 0,
    activeValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Function to count agreements by status with proper type casting
  const countAgreementsByStatus = async (status: string) => {
    try {
      const { count } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('status', status as any); // Use type assertion to fix TypeScript error
      
      return count || 0;
    } catch (error) {
      console.error(`Error counting ${status} agreements:`, error);
      return 0;
    }
  };

  // Function to count payments by status with proper type casting
  const countPaymentsByStatus = async (status: string) => {
    try {
      const { count } = await supabase
        .from('unified_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', status as any); // Use type assertion to fix TypeScript error
      
      return count || 0;
    } catch (error) {
      console.error(`Error counting ${status} payments:`, error);
      return 0;
    }
  };

  // Function to count agreements by status for specific period with proper type casting
  const countAgreementsInPeriod = async (status: string, startDate: string, endDate: string) => {
    try {
      const { count } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('status', status as any) // Use type assertion to fix TypeScript error
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      return count || 0;
    } catch (error) {
      console.error(`Error counting ${status} agreements in period:`, error);
      return 0;
    }
  };

  // Function to get total rent amount with safe property access
  const getTotalRentAmount = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('rent_amount')
        .eq('status', 'active' as any); // Use type assertion to fix TypeScript error
      
      if (error || !data) {
        throw error || new Error('No data returned');
      }
      
      // Use safe property access
      const total = data.reduce((sum, lease) => {
        const amount = lease && typeof lease === 'object' && 'rent_amount' in lease ? 
          Number(lease.rent_amount || 0) : 0;
        return sum + amount;
      }, 0);
      
      return total;
    } catch (error) {
      console.error('Error calculating total rent amount:', error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        const { count: totalCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true });
        
        const { count: activeCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', LEASE_STATUSES.ACTIVE);
          
        const { count: pendingPaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', PAYMENT_STATUSES.PENDING);
          
        const { count: overduePaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .gt('days_overdue', 0);
          
        const response = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('status', LEASE_STATUSES.ACTIVE);

        // Calculate total active value safely
        let activeValue = 0;
        if (hasResponseData(response)) {
          activeValue = response.data.reduce((sum, agreement) => {
            const rentAmount = agreement?.rent_amount ? Number(agreement.rent_amount) : 0;
            return sum + rentAmount;
          }, 0);
        }
        
        setStats({
          totalAgreements: totalCount || 0,
          activeAgreements: activeCount || 0,
          pendingPayments: pendingPaymentsCount || 0,
          overduePayments: overduePaymentsCount || 0,
          activeValue
        });
      } catch (error) {
        console.error("Error fetching agreement stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 flex items-center space-x-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Agreements</p>
          <h3 className="text-2xl font-bold">
            {isLoading ? "..." : stats.totalAgreements}
          </h3>
        </div>
      </Card>
      
      <Card className="p-4 flex items-center space-x-4">
        <div className="bg-green-100 p-3 rounded-lg">
          <FileCheck className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active Agreements</p>
          <h3 className="text-2xl font-bold">
            {isLoading ? "..." : stats.activeAgreements}
          </h3>
        </div>
      </Card>
      
      <Card className="p-4 flex items-center space-x-4">
        <div className="bg-yellow-100 p-3 rounded-lg">
          <FileClock className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <h3 className="text-2xl font-bold">
            {isLoading ? "..." : stats.pendingPayments}
          </h3>
        </div>
      </Card>
      
      <Card className="p-4 flex items-center space-x-4">
        <div className="bg-red-100 p-3 rounded-lg">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          <h3 className="text-2xl font-bold">
            {isLoading ? "..." : formatCurrency(stats.activeValue)}
          </h3>
        </div>
      </Card>
    </div>
  );
}
