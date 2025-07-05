import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wrench, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Activity,
  BarChart3
} from 'lucide-react';
import { VehicleData } from '@/types/vehicle.types';

interface VehicleMaintenanceOverviewProps {
  vehicle: VehicleData;
  onScheduleMaintenance?: () => void;
  onViewHistory?: () => void;
  onGenerateReport?: () => void;
}

export const VehicleMaintenanceOverview: React.FC<VehicleMaintenanceOverviewProps> = ({
  vehicle,
  onScheduleMaintenance,
  onViewHistory,
  onGenerateReport
}) => {
  // إحصائيات مؤقتة للعرض
  const stats = {
    totalCost: 15750,
    totalJobs: 8,
    pendingJobs: 2,
    overdueJobs: 0,
    efficiency: 92
  };

  const formatCurrencySimple = (amount: number): string => {
    return `${amount.toLocaleString()} ر.ق`;
  };

  const getHealthStatus = () => {
    if (stats.overdueJobs > 0) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'حرجة'
      };
    }
    if (stats.pendingJobs > 2) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'تحتاج انتباه'
      };
    }
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'جيدة'
    };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Card */}
      <Card className={`${healthStatus.bgColor} ${healthStatus.borderColor} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-row-reverse text-right">
            <div className="flex items-center gap-2 flex-row-reverse">
              <Wrench className="h-5 w-5" />
              حالة الصيانة
            </div>
            <Badge className={`${healthStatus.color} bg-transparent border-current`}>
              {healthStatus.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-right">
            <div className="text-center">
              <div className={`text-2xl font-bold ${healthStatus.color}`}>{stats.totalJobs}</div>
              <div className="text-sm text-gray-600">إجمالي المهام</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.pendingJobs > 0 ? 'text-orange-600' : 'text-gray-600'}`}>{stats.pendingJobs}</div>
              <div className="text-sm text-gray-600">قيد الانتظار</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.overdueJobs > 0 ? 'text-red-600' : 'text-gray-600'}`}>{stats.overdueJobs}</div>
              <div className="text-sm text-gray-600">متأخرة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.efficiency}%</div>
              <div className="text-sm text-gray-600">الكفاءة</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {stats.overdueJobs > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            لديك {stats.overdueJobs} مهام صيانة متأخرة تحتاج لمتابعة عاجلة
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm text-gray-600">إجمالي التكلفة</p>
                <p className="text-2xl font-bold">{formatCurrencySimple(stats.totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm text-gray-600">متوسط التكلفة</p>
                <p className="text-2xl font-bold">{formatCurrencySimple(stats.totalJobs > 0 ? Math.round(stats.totalCost / stats.totalJobs) : 0)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm text-gray-600">آخر صيانة</p>
                <p className="text-lg font-semibold">2024/03/15</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-row-reverse">
        <Button onClick={onScheduleMaintenance} className="flex-1 flex-row-reverse">
          <Calendar className="h-4 w-4 ml-2" />
          جدولة صيانة
        </Button>
        <Button variant="outline" onClick={onViewHistory} className="flex-1 flex-row-reverse">
          <Clock className="h-4 w-4 ml-2" />
          عرض التاريخ
        </Button>
        <Button variant="outline" onClick={onGenerateReport} className="flex-row-reverse">
          <Activity className="h-4 w-4 ml-2" />
          تقرير
        </Button>
      </div>
    </div>
  );
}; 