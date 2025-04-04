
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  Car, 
  ShieldCheck, 
  Clock, 
  WrenchIcon, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldX, 
  CircleDashed, 
  CircleOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { VehicleStatus } from '@/types/vehicle';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalTextAlign, getDirectionalFlexClass } from '@/utils/rtl-utils';

interface VehicleStatusChartProps {
  data?: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    police_station?: number;
    accident?: number;
    stolen?: number;
    reserved?: number;
    attention?: number;
    critical?: number;
  };
}

const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({ data }) => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL, getNumberFormat } = useTranslation();
  
  if (!data) return null;
  
  // Define status config with translations
  const statusConfig = [
    { 
      key: 'available', 
      name: t('dashboard.vehicleStatusTypes.available'),
      color: '#22c55e', 
      icon: ShieldCheck,
      description: t('dashboard.readyForRental'),
      filterValue: 'available' as VehicleStatus
    },
    { 
      key: 'rented', 
      name: t('dashboard.vehicleStatusTypes.rented'), 
      color: '#3b82f6', 
      icon: Car,
      description: t('dashboard.currentlyWithCustomer'),
      filterValue: 'rented' as VehicleStatus
    },
    { 
      key: 'maintenance', 
      name: t('dashboard.vehicleStatusTypes.maintenance'), 
      color: '#f59e0b', 
      icon: WrenchIcon,
      description: t('dashboard.undergoingService'),
      filterValue: 'maintenance' as VehicleStatus
    },
    { 
      key: 'reserved', 
      name: t('dashboard.vehicleStatusTypes.reserved'), 
      color: '#8b5cf6', 
      icon: Clock,
      description: t('dashboard.reservedForFuture'),
      filterValue: 'reserved' as VehicleStatus
    },
    { 
      key: 'attention', 
      name: t('dashboard.vehicleStatusTypes.attention'), 
      color: '#ec4899', 
      icon: AlertTriangle,
      description: t('dashboard.requiresReview'),
      filterValue: 'maintenance' as VehicleStatus
    },
    { 
      key: 'police_station', 
      name: t('dashboard.vehicleStatusTypes.police_station'), 
      color: '#64748b', 
      icon: ShieldAlert,
      description: t('dashboard.heldAtPolice'),
      filterValue: 'police_station' as VehicleStatus
    },
    { 
      key: 'accident', 
      name: t('dashboard.vehicleStatusTypes.accident'), 
      color: '#ef4444', 
      icon: CircleOff,
      description: t('dashboard.involvedInAccident'),
      filterValue: 'accident' as VehicleStatus
    },
    { 
      key: 'stolen', 
      name: t('dashboard.vehicleStatusTypes.stolen'), 
      color: '#dc2626', 
      icon: ShieldX,
      description: t('dashboard.vehicleReportedStolen'),
      filterValue: 'stolen' as VehicleStatus
    },
    { 
      key: 'critical', 
      name: t('dashboard.vehicleStatusTypes.critical'), 
      color: '#b91c1c', 
      icon: CircleDashed,
      description: t('dashboard.criticalIssuesPending'),
      filterValue: 'maintenance' as VehicleStatus
    }
  ];
  
  const normalizedData = { ...data };
  
  statusConfig.forEach(status => {
    if (normalizedData[status.key as keyof typeof normalizedData] === undefined) {
      normalizedData[status.key as keyof typeof normalizedData] = 0;
    }
  });
  
  const chartData = statusConfig
    .filter(status => normalizedData[status.key as keyof typeof normalizedData] > 0)
    .map(status => ({
      name: status.name,
      value: normalizedData[status.key as keyof typeof normalizedData],
      color: status.color,
      key: status.key,
      filterValue: status.filterValue
    }));
  
  const criticalVehicles = (normalizedData.stolen || 0) + 
                          (normalizedData.accident || 0) + 
                          (normalizedData.critical || 0);
  
  const hasCriticalVehicles = criticalVehicles > 0;
  
  const handleStatusClick = (data: any) => {
    navigate(`/vehicles?status=${data.filterValue}`);
  };

  // Format the donut chart labels based on language
  const formatDonutLabel = ({ name, value }: { name: string, value: number }) => {
    return `${name}: ${getNumberFormat(value)}`;
  };

  return (
    <Card className="col-span-full lg:col-span-4 card-transition">
      <CardHeader className="pb-2">
        <CardTitle className={getDirectionalTextAlign()}>{t('dashboard.fleetStatusOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-start justify-between h-auto lg:h-96">
          <div className="w-full lg:w-2/3 h-72 lg:h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={130}
                  paddingAngle={4}
                  dataKey="value"
                  label={formatDonutLabel}
                  labelLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                  onClick={handleStatusClick}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#ffffff" 
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [
                    `${getNumberFormat(value as number)} ${t('vehicles.title')}`, 
                    ''
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    textAlign: isRTL ? 'right' : 'left',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className={`w-full lg:w-1/3 mt-4 lg:mt-0 ${isRTL ? 'lg:pr-4' : 'lg:pl-4'} flex flex-col h-full`}>
            <div className={`text-sm ${isRTL ? 'text-right' : 'text-center lg:text-left'} text-muted-foreground mb-4`}>
              <div className="text-lg font-semibold text-foreground">
                {t('dashboard.totalFleet')}: {getNumberFormat(data.total)} {t('vehicles.title')}
              </div>
              {hasCriticalVehicles && (
                <Badge variant="destructive" className="mt-2 text-xs px-3 py-1">
                  {getNumberFormat(criticalVehicles)} {t('vehicles.title')}
                  {' '}{t('dashboard.vehiclesRequiringAttention')}
                </Badge>
              )}
            </div>
            
            <div className={`space-y-3 flex-grow overflow-y-auto pr-2 ${isRTL ? 'text-right' : ''}`}>
              {statusConfig.map((status) => {
                const count = normalizedData[status.key as keyof typeof normalizedData] || 0;
                if (count === 0) return null;
                
                const Icon = status.icon;
                const flexDirection = isRTL ? "flex-row-reverse" : "flex-row";
                const marginClass = isRTL ? "ml-2" : "mr-2";
                
                return (
                  <div 
                    key={status.key} 
                    className={cn(
                      `flex items-center p-2 rounded-md cursor-pointer transition-colors hover:bg-slate-100 ${flexDirection}`,
                      status.key === 'stolen' || status.key === 'accident' || status.key === 'critical' 
                        ? "bg-red-50 hover:bg-red-100" 
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                    onClick={() => navigate(`/vehicles?status=${status.filterValue}`)}
                  >
                    <div 
                      className={`p-1.5 rounded-md ${marginClass}`}
                      style={{ backgroundColor: `${status.color}20` }}
                    >
                      <Icon 
                        size={16} 
                        style={{ color: status.color }} 
                      />
                    </div>
                    <div className="flex-grow">
                      <div className={`flex ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'} items-center`}>
                        <span className="text-sm font-medium">{status.name}</span>
                        <span className="text-sm font-semibold">{getNumberFormat(count)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{status.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusChart;
