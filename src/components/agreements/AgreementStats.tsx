
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, FileText, BanknoteIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { asTableId } from '@/utils/type-casting';

/**
 * AgreementStats component shows statistics about agreements
 */
export function AgreementStats() {
  const [stats, setStats] = useState({
    totalActiveAgreements: 0,
    totalPendingAgreements: 0,
    overduePayments: 0,
    totalRevenue: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get active agreements count
        const { count: activeCount, error: activeError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asTableId('leases', AgreementStatus.ACTIVE));
          
        if (activeError) throw activeError;
        
        // Get pending agreements count
        const { count: pendingCount, error: pendingError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asTableId('leases', AgreementStatus.PENDING));
          
        if (pendingError) throw pendingError;
        
        // Get overdue payments count
        const { count: overdueCount, error: overdueError } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'overdue');
          
        if (overdueError) throw overdueError;
        
        // Get total revenue (from active agreements)
        const { data: activeAgreements, error: revenueError } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('status', asTableId('leases', AgreementStatus.ACTIVE));
          
        if (revenueError) throw revenueError;
        
        const totalRevenue = activeAgreements?.reduce((sum, agreement) => sum + (agreement.rent_amount || 0), 0) || 0;
        
        setStats({
          totalActiveAgreements: activeCount || 0,
          totalPendingAgreements: pendingCount || 0,
          overduePayments: overdueCount || 0,
          totalRevenue
        });
      } catch (error) {
        console.error('Error fetching agreement stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const statItems = [
    {
      title: "Active Agreements",
      value: stats.totalActiveAgreements,
      icon: <CheckCircle className="text-green-500" />,
      loading: isLoading,
    },
    {
      title: "Pending Agreements",
      value: stats.totalPendingAgreements,
      icon: <Clock className="text-yellow-500" />,
      loading: isLoading,
    },
    {
      title: "Overdue Payments",
      value: stats.overduePayments,
      icon: <AlertTriangle className="text-red-500" />,
      loading: isLoading,
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: <BanknoteIcon className="text-green-700" />,
      loading: isLoading,
      isMonetary: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {item.title}
              </p>
              <p className="text-2xl font-bold">
                {item.loading ? "..." : item.value}
              </p>
            </div>
            <div className="rounded-full bg-muted p-3">
              {item.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
