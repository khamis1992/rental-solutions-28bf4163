
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { FileCheck, FileText, FileClock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { castAgreementStatus, castPaymentStatus } from '@/types/database-types';

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
          .eq('status', castAgreementStatus('active'));
          
        // Get pending payments count
        const { count: pendingPaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', castPaymentStatus('pending'));
          
        // Get overdue payments count
        const { count: overduePaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .gt('days_overdue', 0);
          
        // Get active agreements total value
        const { data: activeAgreements } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('status', castAgreementStatus('active'));
          
        const activeValue = activeAgreements 
          ? activeAgreements.reduce((sum, agreement) => sum + (agreement?.rent_amount || 0), 0)
          : 0;
        
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
