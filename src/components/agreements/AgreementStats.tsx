
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LEASE_STATUSES, PAYMENT_STATUSES } from '@/types/database-common';
import { safeAsync, isApiError, isDatabaseError } from '@/utils/error-handling';

interface Stats {
  activeAgreements: number;
  pendingPayments: number;
  expiredAgreements: number;
  averageRentAmount: string;
}

interface CountResult {
  count: number;
}

interface AvgRentResult {
  rent_amount: number;
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

        // Create the queries first
        const activeAgreementsPromise = supabase
          .from('leases')
          .select('count', { count: 'exact', head: true })
          .eq('status', LEASE_STATUSES.ACTIVE);

        const pendingPaymentsPromise = supabase
          .from('unified_payments')
          .select('count', { count: 'exact', head: true })
          .eq('status', PAYMENT_STATUSES.PENDING);

        const expiredAgreementsPromise = supabase
          .from('leases')
          .select('count', { count: 'exact', head: true })
          .eq('status', LEASE_STATUSES.EXPIRED);

        const avgRentPromise = supabase.rpc('get_average_rent_amount');

        // Use safeAsync to handle each query individually
        const [activeResult, pendingResult, expiredResult, avgRentResult] = await Promise.all([
          safeAsync<CountResult>(activeAgreementsPromise),
          safeAsync<CountResult>(pendingPaymentsPromise),
          safeAsync<CountResult>(expiredAgreementsPromise),
          safeAsync<AvgRentResult>(avgRentPromise)
        ]);

        // Handle errors individually with proper type checking
        if (activeResult.error) {
          console.error('Error fetching active agreements count:', 
            isApiError(activeResult.error) 
              ? `API error: ${activeResult.error.statusCode} - ${activeResult.error.message}`
              : isDatabaseError(activeResult.error)
              ? `DB error: ${activeResult.error.operation} on ${activeResult.error.table}`
              : activeResult.error.message
          );
        }

        if (pendingResult.error) {
          console.error('Error fetching pending payments count:', 
            isApiError(pendingResult.error)
              ? `API error: ${pendingResult.error.statusCode} - ${pendingResult.error.message}`
              : isDatabaseError(pendingResult.error)
              ? `DB error: ${pendingResult.error.operation} on ${pendingResult.error.table}`
              : pendingResult.error.message
          );
        }

        if (expiredResult.error) {
          console.error('Error fetching expired agreements count:', 
            isApiError(expiredResult.error)
              ? `API error: ${expiredResult.error.statusCode} - ${expiredResult.error.message}`
              : isDatabaseError(expiredResult.error)
              ? `DB error: ${expiredResult.error.operation} on ${expiredResult.error.table}`
              : expiredResult.error.message
          );
        }

        if (avgRentResult.error) {
          console.error('Error fetching average rent amount:', 
            isApiError(avgRentResult.error)
              ? `API error: ${avgRentResult.error.statusCode} - ${avgRentResult.error.message}`
              : isDatabaseError(avgRentResult.error)
              ? `DB error: ${avgRentResult.error.operation} on ${avgRentResult.error.table}`
              : avgRentResult.error.message
          );
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
