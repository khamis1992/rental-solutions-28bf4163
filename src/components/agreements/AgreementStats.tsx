import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { asTableStatus } from '@/utils/type-casting';

export function AgreementStats() {
  const [stats, setStats] = useState({
    totalAgreements: 0,
    activeAgreements: 0,
    pendingAgreements: 0,
    avgRent: 0,
    overduePayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Total agreements count
        const { count: totalCount, error: totalError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true });
          
        if (totalError) throw totalError;
        
        // Active agreements count
        const { count: activeCount, error: activeError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asTableStatus('leases', 'active'));
          
        if (activeError) throw activeError;
        
        // Pending agreements count
        const { count: pendingCount, error: pendingError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asTableStatus('leases', 'pending'));
          
        if (pendingError) throw pendingError;
        
        // Average rent amount
        const { data: rentData, error: rentError } = await supabase
          .from('leases')
          .select('rent_amount')
          .eq('status', asTableStatus('leases', 'active'));
          
        if (rentError) throw rentError;
        
        let avgRent = 0;
        if (rentData && rentData.length > 0) {
          const sum = rentData.reduce((acc, lease) => {
            const rentAmount = lease?.rent_amount || 0;
            return acc + rentAmount;
          }, 0);
          avgRent = sum / rentData.length;
        }
        
        // Overdue payments count
        const { count: overdueCount, error: overdueError } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', asTableStatus('unified_payments', 'pending'))
          .gt('days_overdue', 0);
          
        if (overdueError) throw overdueError;
        
        setStats({
          totalAgreements: totalCount || 0,
          activeAgreements: activeCount || 0,
          pendingAgreements: pendingCount || 0,
          avgRent,
          overduePayments: overdueCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard 
        title="Total Agreements" 
        value={stats.totalAgreements}
        isLoading={isLoading}
      />
      <StatsCard 
        title="Active Rentals" 
        value={stats.activeAgreements} 
        description={`${Math.round((stats.activeAgreements / (stats.totalAgreements || 1)) * 100)}% of total`}
        isLoading={isLoading}
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-0"
      />
      <StatsCard 
        title="Average Monthly Rent" 
        value={formatCurrency(stats.avgRent)}
        isLoading={isLoading}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0"
      />
      <StatsCard 
        title="Overdue Payments" 
        value={stats.overduePayments}
        description={stats.overduePayments > 0 ? "Requires attention" : "All payments up to date"}
        isLoading={isLoading}
        className={stats.overduePayments > 0 ? "bg-gradient-to-br from-amber-50 to-orange-50 border-0" : "bg-gradient-to-br from-green-50 to-emerald-50 border-0"}
      />
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  isLoading?: boolean;
  className?: string;
}

function StatsCard({ title, value, description, isLoading = false, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
          ) : (
            value
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? (
              <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
            ) : (
              description
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
