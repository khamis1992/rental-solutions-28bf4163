
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LEASE_STATUSES, PAYMENT_STATUSES } from '@/types/database-common';
import { safeAsync } from '@/utils/error-handling';

interface Stats {
  activeAgreements: number;
  pendingPayments: number;
  expiredAgreements: number;
  averageRentAmount: string;
}

export default function AgreementStats() {
  const [stats, setStats] = React.useState<Stats>({
    activeAgreements: 0,
    pendingPayments: 0,
    expiredAgreements: 0,
    averageRentAmount: '$0'
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // Use safeAsync to handle each query individually
        const [activeResult, pendingResult, expiredResult, avgRentResult] = await Promise.all([
          // Fetch active agreement count
          safeAsync(supabase
            .from('leases')
            .select('count', { count: 'exact', head: true })
            .eq('status', LEASE_STATUSES.ACTIVE)),

          // Fetch pending payments count
          safeAsync(supabase
            .from('unified_payments')
            .select('count', { count: 'exact', head: true })
            .eq('status', PAYMENT_STATUSES.PENDING)),

          // Fetch expired agreements count
          safeAsync(supabase
            .from('leases')
            .select('count', { count: 'exact', head: true })
            .eq('status', LEASE_STATUSES.EXPIRED)),

          // Fetch average rent amount
          safeAsync(supabase.rpc('get_average_rent_amount'))
        ]);

        // Handle errors individually but continue processing
        if (activeResult.error) {
          console.error('Error fetching active agreements count:', activeResult.error);
        }

        if (pendingResult.error) {
          console.error('Error fetching pending payments count:', pendingResult.error);
        }

        if (expiredResult.error) {
          console.error('Error fetching expired agreements count:', expiredResult.error);
        }

        if (avgRentResult.error) {
          console.error('Error fetching average rent amount:', avgRentResult.error);
        }
        
        // Handle average rent amount if available
        let averageRent = '$0';
        if (avgRentResult.data && avgRentResult.data.rent_amount !== null) {
          averageRent = formatCurrency(avgRentResult.data.rent_amount || 0);
        }
        
        // Extract counts safely with fallbacks to 0
        const activeCount = activeResult.data?.count || 0;
        const pendingCount = pendingResult.data?.count || 0;
        const expiredCount = expiredResult.data?.count || 0;
        
        setStats({
          activeAgreements: activeCount,
          pendingPayments: pendingCount,
          expiredAgreements: expiredCount,
          averageRentAmount: averageRent
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Agreements</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.activeAgreements}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.pendingPayments}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expired Agreements</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.expiredAgreements}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Rent Amount</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.averageRentAmount}
        </CardContent>
      </Card>
    </div>
  );
}
