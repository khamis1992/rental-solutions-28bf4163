
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { asLeaseStatus, asPaymentStatus } from '@/lib/database/type-utils';

export function AgreementStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pendingPayments: 0,
    expiringSoon: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total count
        const { count: totalCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true });

        // Get active agreements
        const { count: activeCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asLeaseStatus('active'));

        // Get agreements with pending payments
        const { count: pendingPaymentsCount } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', asPaymentStatus('pending'));

        // Get agreements expiring within 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { count: expiringSoonCount } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asLeaseStatus('active'))
          .lt('end_date', thirtyDaysFromNow.toISOString());

        setStats({
          total: totalCount || 0,
          active: activeCount || 0,
          pendingPayments: pendingPaymentsCount || 0,
          expiringSoon: expiringSoonCount || 0
        });
      } catch (error) {
        console.error('Error fetching agreement stats:', error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard title="Total Agreements" value={stats.total} />
      <StatCard title="Active Agreements" value={stats.active} />
      <StatCard title="Pending Payments" value={stats.pendingPayments} />
      <StatCard title="Expiring in 30 days" value={stats.expiringSoon} />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
