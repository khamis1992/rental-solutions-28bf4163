
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LEASE_STATUSES, PAYMENT_STATUSES } from '@/types/database-common';
import { useTypedErrorHandling } from '@/hooks/use-typed-error-handling';
import { formatTypedErrorMessage } from '@/utils/type-safe-errors';

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
  
  const { 
    isLoading, 
    runWithErrorHandling, 
    errorState 
  } = useTypedErrorHandling({
    showToast: true,
    captureErrors: true
  });

  React.useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    await runWithErrorHandling(async () => {
      // Create the queries
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

      // Execute all queries in parallel and handle with type-safe error handling
      const [activeResult, pendingResult, expiredResult, avgRentResult] = await Promise.all([
        activeAgreementsPromise,
        pendingPaymentsPromise,
        expiredAgreementsPromise,
        avgRentPromise
      ]);

      // Handle errors and extract data safely
      if (activeResult.error) {
        console.error('Error fetching active agreements count:', formatTypedErrorMessage(activeResult.error));
      }

      if (pendingResult.error) {
        console.error('Error fetching pending payments count:', formatTypedErrorMessage(pendingResult.error));
      }

      if (expiredResult.error) {
        console.error('Error fetching expired agreements count:', formatTypedErrorMessage(expiredResult.error));
      }

      if (avgRentResult.error) {
        console.error('Error fetching average rent amount:', formatTypedErrorMessage(avgRentResult.error));
      }
      
      // Handle average rent amount if available
      let averageRent = '$0';
      if (avgRentResult.data && avgRentResult.data.rent_amount !== null) {
        averageRent = formatCurrency(avgRentResult.data.rent_amount || 0);
      }
      
      // Extract counts safely with fallbacks to 0
      const activeCount = activeResult.data?.[0]?.count || 0;
      const pendingCount = pendingResult.data?.[0]?.count || 0;
      const expiredCount = expiredResult.data?.[0]?.count || 0;
      
      setStats({
        activeAgreements: activeCount,
        pendingPayments: pendingCount,
        expiredAgreements: expiredCount,
        averageRentAmount: averageRent
      });

      // Return data for potential chaining
      return { activeCount, pendingCount, expiredCount, averageRent };
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Agreements</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.activeAgreements}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.pendingPayments}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expired Agreements</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.expiredAgreements}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Rent Amount</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.averageRentAmount}
        </CardContent>
      </Card>
    </div>
  );
}
