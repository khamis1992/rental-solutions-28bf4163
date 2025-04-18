
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
  CircleOff, 
  PenTool
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { VehicleStatus } from '@/types/vehicle';

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

const statusConfig = [
  { 
    key: 'available', 
    name: 'Available', 
    color: '#22c55e', 
    icon: ShieldCheck,
    description: 'Ready for rental',
    filterValue: 'available' as VehicleStatus
  },
  { 
    key: 'rented', 
    name: 'Rented Out', 
    color: '#3b82f6', 
    icon: Car,
    description: 'Currently with customer',
    filterValue: 'rented' as VehicleStatus
  },
  { 
    key: 'maintenance', 
    name: 'In Maintenance', 
    color: '#f59e0b', 
    icon: WrenchIcon,
    description: 'Undergoing service or repair',
    filterValue: 'maintenance' as VehicleStatus
  },
  { 
    key: 'reserved', 
    name: 'Reserved', 
    color: '#8b5cf6', 
    icon: Clock,
    description: 'Reserved for future rental',
    filterValue: 'reserved' as VehicleStatus
  },
  { 
    key: 'attention', 
    name: 'Needs Attention', 
    color: '#ec4899', 
    icon: AlertTriangle,
    description: 'Requires review',
    filterValue: 'maintenance' as VehicleStatus
  },
  { 
    key: 'police_station', 
    name: 'At Police Station', 
    color: '#64748b', 
    icon: ShieldAlert,
    description: 'Held at police station',
    filterValue: 'police_station' as VehicleStatus
  },
  { 
    key: 'accident', 
    name: 'In Accident', 
    color: '#ef4444', 
    icon: CircleOff,
    description: 'Involved in accident',
    filterValue: 'accident' as VehicleStatus
  },
  { 
    key: 'stolen', 
    name: 'Reported Stolen', 
    color: '#dc2626', 
    icon: ShieldX,
    description: 'Vehicle reported stolen',
    filterValue: 'stolen' as VehicleStatus
  },
  { 
    key: 'critical', 
    name: 'Critical Issues', 
    color: '#b91c1c', 
    icon: CircleDashed,
    description: 'Critical issues pending',
    filterValue: 'maintenance' as VehicleStatus
  }
];

const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({ data }) => {
  const navigate = useNavigate();
  
  if (!data) return null;
  
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
  
  const handleStatusClick = (status: { filterValue: VehicleStatus }) => {
    navigate(`/vehicles?status=${status.filterValue}`);
  };

  return (
    <Card className="col-span-full card-transition">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Vehicle Status Overview</span>
          {hasCriticalVehicles && (
            <Badge variant="destructive" className="text-xs">
              {criticalVehicles} {criticalVehicles === 1 ? 'vehicle' : 'vehicles'} need attention
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                      index
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs font-medium"
                        >
                          {chartData[index].name} ({value})
                        </text>
                      );
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} vehicles`, 'Count']} 
                    contentStyle={{ 
                      borderRadius: '0.375rem', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No vehicle status data available
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {statusConfig
                .filter(status => normalizedData[status.key as keyof typeof normalizedData] > 0)
                .map((status) => {
                  const count = normalizedData[status.key as keyof typeof normalizedData];
                  const percentage = data.total ? Math.round((count / data.total) * 100) : 0;
                  const StatusIcon = status.icon;
                  
                  return (
                    <div
                      key={status.key}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-shadow hover:shadow-md",
                        status.key === 'stolen' || status.key === 'accident' || status.key === 'critical'
                          ? "border-l-4 border-l-red-500"
                          : ""
                      )}
                      onClick={() => handleStatusClick(status)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="p-2 rounded-full"
                          style={{ backgroundColor: `${status.color}20` }}
                        >
                          <StatusIcon
                            size={16}
                            style={{ color: status.color }}
                          />
                        </div>
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${status.color}20`, color: status.color }}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <h4 className="text-sm font-medium">{status.name}</h4>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-2xl font-bold">{count}</span>
                        <span className="text-xs text-muted-foreground">{status.description}</span>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusChart;
