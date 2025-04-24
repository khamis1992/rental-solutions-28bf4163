
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FileCheck, FileText, FileClock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { asTableId } from '@/lib/database-helpers';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total agreements count
        const { count: totalCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true });
        
        // Get active agreements count
        const { count: activeCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asTableId('leases', 'active'));
          
        // Get pending payments count
        const { count: pendingPaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', asTableId('unified_payments', 'pending'));
          
        // Get overdue payments count
        const { count: overduePaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .gt('days_overdue', 0);
          
        // Get active agreements total value
        const { data: activeAgreements } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('status', asTableId('leases', 'active'));
          
        const activeValue = activeAgreements?.reduce((sum, agreement) => 
          sum + (agreement?.rent_amount || 0), 0) || 0;
        
        setStats({
          totalAgreements: totalCount || 0,
          activeAgreements: activeCount || 0,
          pendingPayments: pendingPaymentsCount || 0,
          overduePayments: overduePaymentsCount || 0,
          activeValue
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Total Agreements"
        value={stats.totalAgreements}
        icon={<FileText className="h-5 w-5 text-blue-500" />}
        isLoading={isLoading}
      />
      <StatCard 
        title="Active Agreements"
        value={stats.activeAgreements}
        subtitle={`Value: ${formatCurrency(stats.activeValue)}`}
        icon={<FileCheck className="h-5 w-5 text-green-500" />}
        isLoading={isLoading}
      />
      <StatCard 
        title="Pending Payments"
        value={stats.pendingPayments}
        icon={<FileClock className="h-5 w-5 text-amber-500" />}
        isLoading={isLoading}
      />
      <StatCard 
        title="Overdue Payments"
        value={stats.overduePayments}
        icon={<AlertCircle className="h-5 w-5 text-red-500" />}
        highlight={stats.overduePayments > 0}
        isLoading={isLoading}
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  highlight?: boolean;
}

function StatCard({ title, value, subtitle, icon, isLoading = false, highlight = false }: StatCardProps) {
  return (
    <Card className={`p-5 dashboard-card ${highlight ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1"></div>
          ) : (
            <h3 className={`text-2xl font-bold ${highlight ? 'text-red-600' : ''}`}>
              {value}
            </h3>
          )}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div>
          {icon}
        </div>
      </div>
    </Card>
  );
}
