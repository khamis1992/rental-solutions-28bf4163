import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgreements } from '@/hooks/use-agreements';
import { usePayments } from '@/hooks/use-payments';
import { formatCurrency } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownToLine, ArrowUpRight, CreditCard, DollarSign, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useVehicles } from '@/hooks/use-vehicles';
import { useCustomers } from '@/hooks/use-customers';
import { FinancialReport } from '@/components/reports/FinancialReport';
import { VehicleReport } from '@/components/reports/VehicleReport';
import { CustomerReport } from '@/components/reports/CustomerReport';
import { useTranslation } from 'react-i18next';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';
import PageContainer from '@/components/layout/PageContainer';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('financial');
  const [timeRange, setTimeRange] = useState('30');
  const { t } = useTranslation();
  const { isRTL } = useContextTranslation();
  
  const { agreements = [], isLoading: isLoadingAgreements } = useAgreements();
  const { vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
  const { customers = [], isLoading: isLoadingCustomers } = useCustomers();
  
  const { getPaymentsForAgreement, getTotalBalanceForAgreement } = usePayments();
  
  // Calculate summary metrics
  const totalRevenue = useMemo(() => {
    return agreements.reduce((sum, agreement) => {
      return sum + (agreement.total_amount || 0);
    }, 0);
  }, [agreements]);
  
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'available' || v.status === 'rented').length;
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  
  // Calculate outstanding balances
  const balances = useMemo(() => {
    if (!agreements) return [];
    return agreements.map(agreement => {
      const result: Record<string, any> = {};
      
      // Copy existing properties
      if (agreement && typeof agreement === 'object') {
        Object.entries(agreement).forEach(([key, value]) => {
          result[key] = value;
        });
      }
      
      // Add the calculated properties
      result.agreement_id = agreement.id;
      result.agreement_balance = getTotalBalanceForAgreement(agreement.id);
      result.rentals_revenue = agreement.total_amount;
      
      return result;
    });
  }, [agreements, getTotalBalanceForAgreement]);
  
  const totalOutstanding = useMemo(() => {
    return balances.reduce((sum, item) => sum + (item.agreement_balance || 0), 0);
  }, [balances]);
  
  const collectionRate = useMemo(() => {
    if (totalRevenue === 0) return 100;
    return Math.round(((totalRevenue - totalOutstanding) / totalRevenue) * 100);
  }, [totalRevenue, totalOutstanding]);
  
  // Generate chart data
  const chartData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = subMonths(currentDate, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthName = format(date, 'MMM');
      
      const monthRevenue = agreements
        .filter(a => {
          const createdAt = new Date(a.created_at || '');
          return createdAt >= monthStart && createdAt <= monthEnd;
        })
        .reduce((sum, a) => sum + (a.total_amount || 0), 0);
      
      months.unshift({
        name: monthName,
        revenue: monthRevenue
      });
    }
    
    return months;
  }, [agreements]);
  
  return (
    <PageContainer
      title={t('reports.title')}
      description={t('reports.description')}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('reports.totalRevenue')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingAgreements ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  formatCurrency(totalRevenue)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reports.fromAllAgreements')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('reports.outstandingBalance')}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingAgreements ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  formatCurrency(totalOutstanding)
                )}
              </div>
              <div className="flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3 text-red-500" />
                <p className="text-xs text-muted-foreground">
                  {t('reports.collectionRate')}: {collectionRate}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('reports.activeVehicles')}
              </CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingVehicles ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${activeVehicles} / ${totalVehicles}`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reports.vehiclesInFleet')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('reports.activeCustomers')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingCustomers ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${activeCustomers} / ${totalCustomers}`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reports.totalCustomers')}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('reports.revenueOverTime')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `QAR ${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <Bar
                  dataKey="revenue"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
                <Tooltip
                  formatter={(value: number) => [`QAR ${value.toLocaleString()}`, t('reports.revenue')]}
                  labelFormatter={(label) => `${label} ${new Date().getFullYear()}`}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="financial" value={activeTab} onValueChange={setActiveTab}>
          <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "")}>
            <TabsList>
              <TabsTrigger value="financial">{t('reports.financial')}</TabsTrigger>
              <TabsTrigger value="vehicles">{t('reports.vehicles')}</TabsTrigger>
              <TabsTrigger value="customers">{t('reports.customers')}</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('reports.selectTimeRange')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('reports.last7Days')}</SelectItem>
                  <SelectItem value="30">{t('reports.last30Days')}</SelectItem>
                  <SelectItem value="90">{t('reports.last90Days')}</SelectItem>
                  <SelectItem value="365">{t('reports.lastYear')}</SelectItem>
                  <SelectItem value="all">{t('reports.allTime')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                {t('reports.export')}
              </Button>
            </div>
          </div>
          
          <TabsContent value="financial" className="mt-4">
            <FinancialReport 
              agreements={agreements} 
              isLoading={isLoadingAgreements} 
              timeRange={parseInt(timeRange) || 30} 
            />
          </TabsContent>
          
          <TabsContent value="vehicles" className="mt-4">
            <VehicleReport 
              vehicles={vehicles} 
              isLoading={isLoadingVehicles} 
              timeRange={parseInt(timeRange) || 30} 
            />
          </TabsContent>
          
          <TabsContent value="customers" className="mt-4">
            <CustomerReport 
              customers={customers} 
              isLoading={isLoadingCustomers} 
              timeRange={parseInt(timeRange) || 30} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Reports;
