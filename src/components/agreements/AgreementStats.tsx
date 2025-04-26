
import React, { useEffect, useState } from 'react';
import { useAgreementStats } from '@/hooks/use-agreement-stats';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { asStatusColumn } from '@/utils/database-type-helpers';

interface AgreementStatsCardProps {
  title: string;
  value: string | number | null;
  loading: boolean;
}

const AgreementStatsCard: React.FC<AgreementStatsCardProps> = ({ title, value, loading }) => {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-row items-center justify-between space-x-4 p-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface AgreementChartData {
  status: string;
  count: number;
}

export const AgreementStats: React.FC = () => {
  const { stats, isLoading } = useAgreementStats();
  const [agreementChartData, setAgreementChartData] = useState<AgreementChartData[]>([]);

  useEffect(() => {
    if (stats) {
      const chartData: AgreementChartData[] = Object.entries(stats.statusCounts).map(([status, count]) => ({
        status: status.replace(/_/g, ' '),
        count: count as number || 0,
      }));
      setAgreementChartData(chartData);
    }
  }, [stats]);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <AgreementStatsCard
        title="Total Agreements"
        value={stats?.totalAgreements}
        loading={isLoading}
      />
      <AgreementStatsCard
        title="Total Active Agreements"
        value={stats?.activeAgreements}
        loading={isLoading}
      />
      <AgreementStatsCard
        title="Total Revenue"
        value={stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : null}
        loading={isLoading}
      />
      <AgreementStatsCard
        title="Average Monthly Revenue"
        value={stats?.averageMonthlyRevenue ? formatCurrency(stats.averageMonthlyRevenue) : null}
        loading={isLoading}
      />

      <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadow-sm">
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Agreement Status Distribution</h3>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Skeleton className="h-6 w-48" />
            </div>
          ) : agreementChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agreementChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground">No agreement data available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
