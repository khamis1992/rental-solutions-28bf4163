import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AGREEMENT_STATUSES, PAYMENT_STATUSES } from '@/types/database-common';

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

        // Fetch active agreement count
        const { data: activeAgreements, error: activeError } = await supabase
          .from('leases')
          .select('count', { count: 'exact', head: true })
          .eq('status', AGREEMENT_STATUSES.ACTIVE as string);

        // Fetch pending payments count
        const { data: pendingPayments, error: pendingError } = await supabase
          .from('unified_payments')
          .select('count', { count: 'exact', head: true })
          .eq('status', PAYMENT_STATUSES.PENDING as string);

        // Fetch expired agreements count
        const { data: expiredAgreements, error: expiredError } = await supabase
          .from('leases')
          .select('count', { count: 'exact', head: true })
          .eq('status', AGREEMENT_STATUSES.EXPIRED as string);

        // Fetch average rent amount
        const { data: avgRentResponse, error: avgRentError } = await supabase
          .rpc('get_average_rent_amount');

        if (activeError) {
          console.error('Error fetching active agreements count:', activeError);
        }

        if (pendingError) {
          console.error('Error fetching pending payments count:', pendingError);
        }

        if (expiredError) {
          console.error('Error fetching expired agreements count:', expiredError);
        }

        if (avgRentError) {
          console.error('Error fetching average rent amount:', avgRentError);
        }
        
        if (avgRentResponse !== null && 'rent_amount' in avgRentResponse) {
          const formattedRent = formatCurrency(avgRentResponse.rent_amount || 0);
          
          setStats({
            activeAgreements: activeAgreements?.count || 0,
            pendingPayments: pendingPayments?.count || 0,
            expiredAgreements: expiredAgreements?.count || 0,
            averageRentAmount: formattedRent
          });
        }
        else {
          setStats({
            activeAgreements: activeAgreements?.count || 0,
            pendingPayments: pendingPayments?.count || 0,
            expiredAgreements: expiredAgreements?.count || 0,
            averageRentAmount: '$0'
          });
        }

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
