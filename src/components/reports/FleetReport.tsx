
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, CircleDollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTranslation as useAppTranslation } from '@/contexts/TranslationContext';

const FleetReport = () => {
  const { 
    vehicles, 
    fleetStats, 
    vehiclesByType, 
    isLoading,
    error
  } = useFleetReport();

  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-7 w-48 bg-gray-100 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="p-6">
          <div className="text-center text-red-500">
            <p>{t('common.error')} {t('common.loading')}</p>
            <p className="text-sm mt-2">{String(error)}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t('reports.totalVehicles')} 
          value={fleetStats.totalVehicles.toString()} 
          trend={5} // This would come from comparing with previous period
          trendLabel={t('reports.vsLastMonth')}
          icon={Car}
          iconColor="text-blue-500"
        />
        <StatCard 
          title={t('reports.activeRentals')} 
          value={fleetStats.activeRentals.toString()} 
          trend={12} // This would come from comparing with previous period
          trendLabel={t('reports.vsLastMonth')}
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title={t('reports.averageDailyRate')} 
          value={formatCurrency(fleetStats.averageDailyRate)} 
          trend={3} // This would come from comparing with previous period
          trendLabel={t('reports.vsLastMonth')}
          icon={CircleDollarSign}
          iconColor="text-indigo-500"
        />
        <StatCard 
          title={t('reports.maintenanceRequired')} 
          value={fleetStats.maintenanceRequired.toString()} 
          trend={-2} // This would come from comparing with previous period
          trendLabel={t('reports.vsLastMonth')}
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.fleetUtilization')}</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.vehicle')}</TableHead>
                  <TableHead>{t('reports.licensePlate')}</TableHead>
                  <TableHead>{t('reports.status')}</TableHead>
                  <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('reports.dailyRate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.slice(0, 5).map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                    <TableCell>{vehicle.license_plate}</TableCell>
                    <TableCell>
                      <StatusBadge status={vehicle.status || 'available'} />
                    </TableCell>
                    <TableCell className={isRTL ? 'text-left' : 'text-right'}>{formatCurrency(vehicle.dailyRate || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>{t('reports.noVehicleData')}</p>
              <p className="text-sm mt-2">{t('reports.vehicleDataWillAppear')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.fleetPerformance')}</CardTitle>
        </CardHeader>
        <CardContent>
          {vehiclesByType.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehiclesByType.map(type => ({
                    name: type.type,
                    count: type.count,
                    avgRate: type.avgDailyRate
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  layout={isRTL ? "vertical" : "horizontal"}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ 
                      transform: 'rotate(-45)',
                      textAnchor: isRTL ? 'start' : 'end',
                      dominantBaseline: 'auto'
                    }}
                    height={70}
                    reversed={isRTL}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation={isRTL ? "right" : "left"} 
                    stroke="#8884d8" 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation={isRTL ? "left" : "right"} 
                    stroke="#82ca9d"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'avgRate') {
                        return [formatCurrency(Number(value)), t('reports.averageDailyRate')];
                      }
                      return [value, name === 'count' ? t('reports.vehicleCount') : name];
                    }}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="count" fill="#8884d8" yAxisId="left" name={t('reports.vehicleCount')} />
                  <Bar dataKey="avgRate" fill="#82ca9d" yAxisId="right" name={t('reports.averageDailyRate')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>{t('reports.noPerformanceData')}</p>
              <p className="text-sm mt-2">{t('reports.performanceDataWillAppear')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  
  const variants: Record<string, string> = {
    'available': 'bg-green-100 text-green-800',
    'rented': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-amber-100 text-amber-800',
    'repair': 'bg-red-100 text-red-800',
    'reserved': 'bg-purple-100 text-purple-800',
  };

  // Translate the status using vehicles.status.[statusKey]
  const translatedStatus = t(`vehicles.status.${status}`, status);

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {translatedStatus}
    </Badge>
  );
};

export default FleetReport;
