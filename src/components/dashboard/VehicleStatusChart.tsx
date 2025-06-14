
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statusConfig } from './vehicle-status/status-config';
import { VehicleStatusData } from './vehicle-status/types';
import { StatusListItem } from './vehicle-status/StatusListItem';
import { StatusChart } from './vehicle-status/StatusChart';
import { ChartControls } from './vehicle-status/ChartControls';

interface VehicleStatusChartProps {
  data?: VehicleStatusData;
}

const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({ data }) => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<'pie' | 'donut'>('donut');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  if (!data) return null;
  
  const normalizedData = { ...data };
  
  statusConfig.forEach(status => {
    if (normalizedData[status.key as keyof typeof normalizedData] === undefined) {
      normalizedData[status.key as keyof typeof normalizedData] = 0;
    }
  });
  
  const chartData = statusConfig
    .filter(status => normalizedData[status.key as keyof typeof normalizedData] > 0)
    .filter(status => selectedFilter === 'all' || 
           (selectedFilter === 'issues' && 
            ['maintenance', 'attention', 'accident', 'stolen', 'critical'].includes(status.key)) ||
           (selectedFilter === 'available' && 
            ['available', 'reserved'].includes(status.key)) ||
           (selectedFilter === 'rented' && 
            status.key === 'rented'))
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

  const handleFilterChange = useCallback((value: string) => {
    setSelectedFilter(value);
  }, []);

  return (
    <Card className="col-span-full lg:col-span-4 card-transition dashboard-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <CardTitle>Fleet Status Overview</CardTitle>
          <ChartControls 
            selectedFilter={selectedFilter}
            chartType={chartType}
            onFilterChange={handleFilterChange}
            onChartTypeChange={setChartType}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-start justify-between h-auto lg:h-96">
          <div className="w-full lg:w-2/3 h-72 lg:h-full">
            <StatusChart 
              data={chartData}
              chartType={chartType}
              onSegmentClick={handleStatusClick}
            />
          </div>
          
          <div className="w-full lg:w-1/3 mt-4 lg:mt-0 pl-0 lg:pl-4 flex flex-col h-full">
            <div className="text-sm text-center lg:text-left text-muted-foreground mb-4">
              <div className="text-lg font-semibold text-foreground">
                Total Fleet: {data.total} vehicles
              </div>
              {hasCriticalVehicles && (
                <Badge variant="destructive" className="mt-2 text-xs px-3 py-1">
                  {criticalVehicles} vehicle{criticalVehicles !== 1 ? 's' : ''} requiring immediate attention
                </Badge>
              )}
            </div>
            
            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
              {statusConfig.map((status) => {
                const count = normalizedData[status.key as keyof typeof normalizedData] || 0;
                if (count === 0) return null;
                
                const isVisible = selectedFilter === 'all' || 
                  (selectedFilter === 'issues' && 
                   ['maintenance', 'attention', 'accident', 'stolen', 'critical'].includes(status.key)) ||
                  (selectedFilter === 'available' && 
                   ['available', 'reserved'].includes(status.key)) ||
                  (selectedFilter === 'rented' && 
                   status.key === 'rented');
                
                if (!isVisible) return null;
                
                return (
                  <StatusListItem 
                    key={status.key}
                    status={status}
                    count={count}
                    onClick={() => navigate(`/vehicles?status=${status.filterValue}`)}
                  />
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
