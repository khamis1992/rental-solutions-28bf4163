

// @ts-nocheck
/* eslint-disable */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, CircleDollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FleetReport = () => {
  const { 
    reportData, 
    loading: isLoading,
    error
  } = useFleetReport();
  
  // Extract data from reportData
  const vehicles = reportData?.vehicles || [];
  const report = reportData?.report || {
    totalVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    averageRentAmount: 0,
    vehiclesByType: {}
  };

  if (isLoading) {
    return (
      <div className="space-y-8" dir="rtl">
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
      <div className="space-y-8" dir="rtl">
        <Card className="p-6">
          <div className="text-center text-red-500">
            <p>خطأ في تحميل بيانات الأسطول</p>
            <p className="text-sm mt-2">{String(error)}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Extract stats from report
  const fleetStats = {
    totalVehicles: report.totalVehicles,
    activeRentals: report.rentedVehicles,
    averageDailyRate: report.averageRentAmount,
    maintenanceRequired: report.maintenanceVehicles
  };

  // Create vehicle type data for the chart
  const vehiclesByTypeData = Object.entries(report.vehiclesByType || {}).map(([type, count]) => {
    // Filter vehicles of this type to calculate average rate
    const vehiclesOfType = vehicles.filter(v => v && v.vehicle_type === type);
    const totalRate = vehiclesOfType.reduce((sum, v) => sum + (v?.rent_amount || 0), 0);
    const avgRate = vehiclesOfType.length > 0 ? totalRate / vehiclesOfType.length : 0;
    
    return {
      type,
      count,
      avgDailyRate: avgRate
    };
  });

  return (
    <div className="space-y-8" dir="rtl">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="إجمالي المركبات" 
          value={fleetStats.totalVehicles.toString()} 
          trend={5} // This would come from comparing with previous period
          trendLabel="مقارنة بالشهر الماضي"
          icon={Car}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="الإيجارات النشطة" 
          value={fleetStats.activeRentals.toString()} 
          trend={12} // This would come from comparing with previous period
          trendLabel="مقارنة بالشهر الماضي"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title="متوسط السعر اليومي" 
          value={formatCurrency(fleetStats.averageDailyRate)} 
          trend={3} // This would come from comparing with previous period
          trendLabel="مقارنة بالشهر الماضي"
          icon={CircleDollarSign}
          iconColor="text-indigo-500"
        />
        <StatCard 
          title="تحتاج صيانة" 
          value={fleetStats.maintenanceRequired.toString()} 
          trend={-2} // This would come from comparing with previous period
          trendLabel="مقارنة بالشهر الماضي"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">استغلال الأسطول</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المركبة</TableHead>
                  <TableHead className="text-right">لوحة الترخيص</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">العميل الحالي</TableHead>
                  <TableHead className="text-right">السعر اليومي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.slice(0, 5).map((vehicle) => {
                  if (!vehicle) return null; // Skip null vehicles
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium text-right">{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell className="text-right">{vehicle.license_plate}</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={vehicle.status || 'available'} />
                      </TableCell>
                      <TableCell className="text-right">
                        {vehicle.status === 'rented' && vehicle.currentCustomer ? 
                          vehicle.currentCustomer : 
                          <span className="text-muted-foreground italic">غير محدد</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(vehicle.rent_amount || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>لا توجد بيانات مركبات متاحة</p>
              <p className="text-sm mt-2">ستظهر بيانات المركبات هنا عندما تصبح متاحة</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">أداء الأسطول حسب نوع المركبة</CardTitle>
        </CardHeader>
        <CardContent>
          {vehiclesByTypeData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={vehiclesByTypeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'count') return [value, 'عدد المركبات'];
                      if (name === 'avgDailyRate') return [formatCurrency(value as number), 'متوسط السعر اليومي'];
                      return [value, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="count" name="عدد المركبات" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="avgDailyRate" name="متوسط السعر اليومي" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>لا توجد بيانات أنواع المركبات متاحة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for status badges
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return { label: 'متاحة', color: 'bg-green-100 text-green-800' };
      case 'rented':
        return { label: 'مؤجرة', color: 'bg-blue-100 text-blue-800' };
      case 'maintenance':
        return { label: 'في الصيانة', color: 'bg-amber-100 text-amber-800' };
      case 'repair':
        return { label: 'في الإصلاح', color: 'bg-red-100 text-red-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const { label, color } = getStatusDetails(status);
  return <Badge className={color}>{label}</Badge>;
};

export default FleetReport;
