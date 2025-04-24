
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const AgreementStats = () => {
  const { toast } = useToast();

  // Fetch counts with properly typed parameters
  const fetchAgreementCounts = async () => {
    try {
      // Active agreements count
      const activeCountResponse = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const activeCount = activeCountResponse.count || 0;

      // Pending payments count
      const pendingCountResponse = await supabase
        .from('unified_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const pendingCount = pendingCountResponse.count || 0;

      // Overdue payments count
      const { data: overdueData } = await supabase
        .from('overdue_payments')
        .select('*');
        
      const overdueCount = overdueData?.length || 0;

      // Total value of active agreements
      const { data: activeAgreements } = await supabase
        .from('leases')
        .select('rental_rate, currency')
        .eq('status', 'active');

      // Calculate total value
      const totalValue = (activeAgreements || []).reduce((sum, agreement) => {
        const rate = parseFloat(agreement.rental_rate) || 0;
        return sum + rate;
      }, 0);

      return {
        activeCount,
        pendingCount,
        overdueCount,
        totalValue,
      };
    } catch (error: any) {
      toast({
        title: 'Error fetching statistics',
        description: error.message,
        variant: 'destructive',
      });
      return {
        activeCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        totalValue: 0,
      };
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['agreementStats'],
    queryFn: fetchAgreementCounts,
  });

  const activeCount = data?.activeCount || 0;
  const pendingCount = data?.pendingCount || 0;
  const overdueCount = data?.overdueCount || 0;
  const totalValue = data?.totalValue || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Agreements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-4 w-[80px]" />
          ) : (
            <div className="text-2xl font-bold">{activeCount}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-4 w-[80px]" />
          ) : (
            <div className="text-2xl font-bold">{pendingCount}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-4 w-[80px]" />
          ) : (
            <div className="text-2xl font-bold">{overdueCount}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Value (Active)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-4 w-[80px]" />
          ) : (
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementStats;
