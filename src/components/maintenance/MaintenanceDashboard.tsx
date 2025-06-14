
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const MaintenanceDashboard = () => {
  const { useUpcomingMaintenance } = useMaintenance();
  const { data: upcomingMaintenance, isLoading: isLoadingUpcoming } = useUpcomingMaintenance();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicleService({
    statuses: ['maintenance', 'accident']
  });

  // Count maintenance records by status
  const getStatusCounts = () => {
    if (!upcomingMaintenance) return { 
      scheduled: 0, 
      in_progress: 0, 
      completed: 0, 
      total: 0 
    };

    return upcomingMaintenance.reduce((acc: Record<string, number>, record: any) => {
      const status = record.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, { scheduled: 0, in_progress: 0, completed: 0, total: 0 });
  };

  const statusCounts = getStatusCounts();
  const inMaintenanceCount = vehicles?.length || 0;

  const statCards = [
    {
      title: 'Total In Maintenance',
      value: inMaintenanceCount,
      icon: Wrench,
      color: 'text-blue-500'
    },
    {
      title: 'Scheduled',
      value: statusCounts.scheduled,
      icon: Clock,
      color: 'text-amber-500'
    },
    {
      title: 'In Progress',
      value: statusCounts.in_progress,
      icon: AlertTriangle,
      color: 'text-orange-500'
    },
    {
      title: 'Completed',
      value: statusCounts.completed,
      icon: CheckCircle,
      color: 'text-green-500'
    }
  ];

  if (isLoadingUpcoming || isLoadingVehicles) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-gray-100">
            <CardContent className="p-6 h-24"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MaintenanceDashboard;
