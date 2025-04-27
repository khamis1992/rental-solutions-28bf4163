
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FileCheck, FileText, FileClock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { asLeaseStatus, asPaymentStatus } from '@/utils/database-type-helpers';
import { StatCard as UIStatCard } from '@/components/ui/stat-card';
import { useTypedSupabase } from '@/hooks/use-typed-supabase';
import { ErrorBoundary } from '@/utils/error-boundary';

interface AgreementStats {
  totalAgreements: number;
  activeAgreements: number;
  pendingPayments: number;
  overduePayments: number;
  activeValue: number;
}

export function AgreementStats() {
  const [stats, setStats] = useState<AgreementStats>({
    totalAgreements: 0,
    activeAgreements: 0,
    pendingPayments: 0,
    overduePayments: 0,
    activeValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useTypedSupabase();

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
          .eq('status', asLeaseStatus('active'));
          
        const { count: pendingPaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', asPaymentStatus('pending'));
          
        const { count: overduePaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .gt('days_overdue', 0);
          
        const { data: activeAgreements } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('status', asLeaseStatus('active'));

        let activeValue = 0;
        if (activeAgreements) {
          activeValue = activeAgreements.reduce((sum, agreement) => 
            sum + (agreement?.rent_amount || 0), 0);
        }
        
        setStats({
          totalAgreements: totalCount || 0,
          activeAgreements: activeCount || 0,
          pendingPayments: pendingPaymentsCount || 0,
          overduePayments: overduePaymentsCount || 0,
          activeValue: activeValue || 0
        });
      } catch (error) {
        console.error('Error fetching agreement stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UIStatCard 
          title="Total Agreements"
          value={stats.totalAgreements}
          icon={FileText}
          iconColor="text-blue-500"
          isLoading={isLoading}
        />
        <UIStatCard 
          title="Active Agreements"
          value={stats.activeAgreements}
          subtitle={`Value: ${formatCurrency(stats.activeValue)}`}
          icon={FileCheck}
          iconColor="text-green-500"
          isLoading={isLoading}
        />
        <UIStatCard 
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={FileClock}
          iconColor="text-amber-500"
          isLoading={isLoading}
        />
        <UIStatCard 
          title="Overdue Payments"
          value={stats.overduePayments}
          icon={AlertCircle}
          iconColor="text-red-500"
          highlight={stats.overduePayments > 0}
          isLoading={isLoading}
        />
      </div>
    </ErrorBoundary>
  );
}
