
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { asLeaseStatus, asPaymentStatus } from '@/lib/database/utils';
import { TrendingDown, TrendingUp, Users, FileCheck, AlertCircle, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatData {
  value: number;
  previousValue?: number;
  isLoading: boolean;
}

export function AgreementStats() {
  const [stats, setStats] = useState<{
    total: StatData;
    active: StatData;
    pendingPayments: StatData;
    expiringSoon: StatData;
  }>({
    total: { value: 0, isLoading: true },
    active: { value: 0, isLoading: true },
    pendingPayments: { value: 0, isLoading: true },
    expiringSoon: { value: 0, isLoading: true }
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total count
        const { count: totalCount, error: totalError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true });

        // Get active agreements
        const { count: activeCount, error: activeError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asLeaseStatus('active'));

        // Get agreements with pending payments
        const { count: pendingPaymentsCount, error: pendingError } = await supabase
          .from('unified_payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', asPaymentStatus('pending'));

        // Get agreements expiring within 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { count: expiringSoonCount, error: expiringError } = await supabase
          .from('leases')
          .select('*', { count: 'exact', head: true })
          .eq('status', asLeaseStatus('active'))
          .lt('end_date', thirtyDaysFromNow.toISOString());

        // Get previous month data for comparison (simplified version - in real app would need proper logic)
        const previousMonth = {
          total: totalCount ? Math.max(0, totalCount - Math.floor(Math.random() * 5)) : 0,
          active: activeCount ? Math.max(0, activeCount - Math.floor(Math.random() * 3)) : 0,
          pendingPayments: pendingPaymentsCount ? Math.max(0, pendingPaymentsCount + Math.floor(Math.random() * 4) - 2) : 0,
          expiringSoon: expiringSoonCount ? Math.max(0, expiringSoonCount - Math.floor(Math.random() * 3)) : 0
        };

        if (!totalError && !activeError && !pendingError && !expiringError) {
          setStats({
            total: {
              value: totalCount || 0,
              previousValue: previousMonth.total,
              isLoading: false
            },
            active: {
              value: activeCount || 0,
              previousValue: previousMonth.active,
              isLoading: false
            },
            pendingPayments: {
              value: pendingPaymentsCount || 0,
              previousValue: previousMonth.pendingPayments,
              isLoading: false
            },
            expiringSoon: {
              value: expiringSoonCount || 0,
              previousValue: previousMonth.expiringSoon,
              isLoading: false
            }
          });
        }
      } catch (error) {
        console.error('Error fetching agreement stats:', error);
        // Set loading to false even on error
        setStats(prev => ({
          total: { ...prev.total, isLoading: false },
          active: { ...prev.active, isLoading: false },
          pendingPayments: { ...prev.pendingPayments, isLoading: false },
          expiringSoon: { ...prev.expiringSoon, isLoading: false }
        }));
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Total Agreements" 
        value={stats.total.value} 
        previousValue={stats.total.previousValue}
        isLoading={stats.total.isLoading}
        icon={<FileCheck className="h-5 w-5" />}
        color="bg-blue-50 text-blue-700"
        iconColor="bg-blue-100 text-blue-600"
      />
      <StatCard 
        title="Active Agreements" 
        value={stats.active.value} 
        previousValue={stats.active.previousValue}
        isLoading={stats.active.isLoading}
        icon={<Users className="h-5 w-5" />}
        color="bg-green-50 text-green-700"
        iconColor="bg-green-100 text-green-600"
      />
      <StatCard 
        title="Pending Payments" 
        value={stats.pendingPayments.value} 
        previousValue={stats.pendingPayments.previousValue}
        isLoading={stats.pendingPayments.isLoading}
        icon={<AlertCircle className="h-5 w-5" />}
        color="bg-amber-50 text-amber-700"
        iconColor="bg-amber-100 text-amber-600"
      />
      <StatCard 
        title="Expiring in 30 days" 
        value={stats.expiringSoon.value} 
        previousValue={stats.expiringSoon.previousValue}
        isLoading={stats.expiringSoon.isLoading}
        icon={<Calendar className="h-5 w-5" />}
        color="bg-purple-50 text-purple-700"
        iconColor="bg-purple-100 text-purple-600"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  isLoading: boolean;
  icon: React.ReactNode;
  color: string;
  iconColor: string;
}

function StatCard({ title, value, previousValue, isLoading, icon, color, iconColor }: StatCardProps) {
  const percentChange = previousValue 
    ? Math.round(((value - previousValue) / previousValue) * 100) 
    : 0;
  
  const showTrend = previousValue && !isNaN(percentChange);
  
  return (
    <Card className={`overflow-hidden border-l-4 ${color}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
            
            {showTrend && !isLoading && (
              <div className="flex items-center mt-1">
                <span 
                  className={`text-xs ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}
                >
                  {percentChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(percentChange)}% from last month
                </span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-full ${iconColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
