
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
  
  // Make sure all statuses have values
  const normalizedData = { ...data };
  
  // Set default values for all statuses if they don't exist
  statusConfig.forEach(status => {
    if (normalizedData[status.key as keyof typeof normalizedData] === undefined) {
      normalizedData[status.key as keyof typeof normalizedData] = 0;
    }
  });
  
  // Create chart data from real vehicle stats
  const chartData = statusConfig
    .filter(status => normalizedData[status.key as keyof typeof normalizedData] > 0)
    .map(status => ({
      name: status.name,
      value: normalizedData[status.key as keyof typeof normalizedData],
      color: status.color,
      key: status.key,
      filterValue: status.filterValue
    }));
  
  // Calculate the total count of critical vehicles (stolen, accident, critical)
  const criticalVehicles = (normalizedData.stolen || 0) + 
                          (normalizedData.accident || 0) + 
                          (normalizedData.critical || 0);
  
  const hasCriticalVehicles = criticalVehicles > 0;
  
  const handleStatusClick = (data: any) => {
    // Navigate to vehicles page filtered by status
    navigate(`/vehicles?status=${data.filterValue}`);
  };

  return (
    <Card className="col-span-full lg:col-span-4 card-transition">
      <CardHeader className="pb-2">
        <CardTitle>Fleet Status Overview</CardTitle>
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
                  label={({ name, value }) => `${name}: ${value}`}
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
                  formatter={(value) => [`${value} vehicles`, '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full lg:w-1/3 mt-4 lg:mt-0 pl-0 lg:pl-4 flex flex-col h-full">
            <div className="text-sm text-center lg:text-left text-muted-foreground mb-4">
              <div className="text-lg font-semibold text-foreground">Total Fleet: {data.total} vehicles</div>
              {hasCriticalVehicles && (
                <Badge variant="danger" className="mt-2 text-xs px-3 py-1">
                  {criticalVehicles} vehicle{criticalVehicles !== 1 ? 's' : ''} requiring immediate attention
                </Badge>
              )}
            </div>
            
            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
              {statusConfig.map((status) => {
                const count = normalizedData[status.key as keyof typeof normalizedData] || 0;
                if (count === 0) return null;
                
                const Icon = status.icon;
                return (
                  <div 
                    key={status.key} 
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-slate-100",
                      status.key === 'stolen' || status.key === 'accident' || status.key === 'critical' 
                        ? "bg-red-50 hover:bg-red-100" 
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                    onClick={() => navigate(`/vehicles?status=${status.filterValue}`)}
                  >
                    <div 
                      className="p-1.5 rounded-md" 
                      style={{ backgroundColor: `${status.color}20` }}
                    >
                      <Icon 
                        size={16} 
                        style={{ color: status.color }} 
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{status.name}</span>
                        <span className="text-sm font-semibold">{count}</span>
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
