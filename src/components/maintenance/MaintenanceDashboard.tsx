
import { Card, CardContent } from '@/components/ui/card';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Wrench, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

const MaintenanceDashboard = () => {
  const { useUpcomingMaintenance } = useMaintenance();
  const { data: upcomingMaintenance, isLoading: isLoadingUpcoming } = useUpcomingMaintenance();

  // Query for maintenance vehicles count
  const { data: maintenanceCount, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['vehicles-maintenance-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'maintenance');
      return count || 0;
    }
  });

  // Query for accident vehicles count
  const { data: accidentCount, isLoading: isLoadingAccidents } = useQuery({
    queryKey: ['vehicles-accident-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accident');
      return count || 0;
    }
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

  const statCards = [
    {
      id: 'completed',
      title: 'مكتملة',
      value: statusCounts.completed,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      id: 'in-progress',
      title: 'قيد التنفيذ',
      value: maintenanceCount || 0,
      icon: AlertTriangle,
      color: 'text-orange-500'
    },
    {
      id: 'accidents',
      title: 'الحوادث',
      value: accidentCount || 0,
      icon: AlertOctagon,
      color: 'text-red-500'
    },
    {
      id: 'scheduled',
      title: 'مجدولة',
      value: statusCounts.scheduled,
      icon: Wrench,
      color: 'text-blue-500'
    }
  ];

  if (isLoadingUpcoming || isLoadingMaintenance || isLoadingAccidents) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-pulse" dir="rtl">
        {[1, 2, 3, 4].map(i => (
          <Card key={`loading-${i}`} className="bg-gray-100">
            <CardContent className="p-6 h-24"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" dir="rtl">
      {statCards.map((card) => (
        <Card key={card.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground text-right">{card.title}</p>
                <p className="text-2xl font-bold text-right">{card.value}</p>
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
