import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statusConfig } from './vehicle-status/status-config';
import { VehicleStatusData } from './vehicle-status/types';
import { StatusListItem } from './vehicle-status/StatusListItem';
import { StatusChart } from './vehicle-status/StatusChart';
import { ChartControls } from './vehicle-status/ChartControls';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleStatusChartProps {
  data?: VehicleStatusData;
}

const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({ data }) => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<'pie' | 'donut'>('donut');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  if (!data) return null;
  
  const normalizedData = { ...data };
  
  statusConfig.forEach(status => {
    const statusKey = status.key as keyof typeof normalizedData;
    if (normalizedData && normalizedData[statusKey] === undefined) {
      (normalizedData as any)[statusKey] = 0;
    }
  });
  
  const chartData = statusConfig
    .filter(status => {
      const statusKey = status.key as keyof typeof normalizedData;
      return normalizedData && normalizedData[statusKey] !== undefined && normalizedData[statusKey] > 0;
    })
    .filter(status => selectedFilter === 'all' || 
           (selectedFilter === 'issues' && 
            ['maintenance', 'attention', 'accident', 'stolen', 'critical'].includes(status.key)) ||
           (selectedFilter === 'available' && 
            ['available', 'reserved'].includes(status.key)) ||
           (selectedFilter === 'rented' && 
            status.key === 'rented'))
    .map(status => ({
      name: status.name,
      value: normalizedData[status.key as keyof typeof normalizedData] || 0,
      color: status.color,
      key: status.key,
      filterValue: status.filterValue
    }));
  
  const criticalVehicles = (normalizedData?.stolen || 0) + 
                          (normalizedData?.accident || 0) + 
                          (normalizedData?.critical || 0);
  
  const hasCriticalVehicles = (data?.stolen || 0) + (data?.accident || 0) + (data?.critical || 0) > 0;
  
  const handleStatusClick = (data: any) => {
    navigate(`/vehicles?status=${data.filterValue}`);
  };

  const handleFilterChange = useCallback((value: string) => {
    setSelectedFilter(value);
  }, []);

  return (
    <Card className="col-span-full lg:col-span-4 card-transition dashboard-card" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
          <ChartControls 
            selectedFilter={selectedFilter}
            chartType={chartType}
            onFilterChange={handleFilterChange}
            onChartTypeChange={setChartType}
          />
          <CardTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            نظرة عامة على حالة الأسطول
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col lg:flex-row items-start justify-between h-auto lg:h-96 gap-6 ${language === 'ar' ? 'lg:flex-row-reverse' : ''}`}>
          <div className="w-full lg:w-1/3 space-y-4">
            <div className={`text-sm text-muted-foreground mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="text-lg font-semibold text-foreground">
                إجمالي الأسطول: {data?.total || 0}
              </div>
              {hasCriticalVehicles && (
                <Badge variant="destructive" className="mt-2 text-xs px-3 py-1">
                  مركبات بحاجة لانتباه: {criticalVehicles}
                </Badge>
              )}
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
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
          
          <div className="w-full lg:w-2/3 h-72 lg:h-full min-h-[300px]">
            <StatusChart 
              data={chartData}
              chartType={chartType}
              onSegmentClick={handleStatusClick}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusChart;
