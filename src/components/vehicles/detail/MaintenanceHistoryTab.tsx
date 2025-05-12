
import React from 'react';
import { useVehicleMaintenanceHistory } from '@/hooks/use-vehicle-maintenance';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench } from 'lucide-react';

interface MaintenanceHistoryTabProps {
  vehicleId?: string;
}

export const MaintenanceHistoryTab: React.FC<MaintenanceHistoryTabProps> = ({ vehicleId }) => {
  const { maintenanceRecords, isLoading, error } = useVehicleMaintenanceHistory(vehicleId);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <p>Error loading maintenance history: {(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!maintenanceRecords || maintenanceRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <p>No maintenance records found for this vehicle.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {maintenanceRecords.map((record) => (
        <Card key={record.id} className="overflow-hidden">
          <div className="bg-muted p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-primary" />
              <div>
                <h3 className="font-medium">
                  {record.maintenance_type || record.service_type || 'Maintenance Record'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {record.performed_by || 'Not specified'}
                </p>
              </div>
            </div>
            <StatusBadge status={record.status || 'unknown'} />
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Service Date</p>
                <p>{record.scheduled_date ? formatDate(record.scheduled_date) : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Cost</p>
                <p>{record.cost ? formatCurrency(record.cost) : 'Not specified'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm">{record.description || 'No description provided'}</p>
              </div>
              {record.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm">{record.notes}</p>
                </div>
              )}
              {record.completed_date && (
                <div className="col-span-2">
                  <p className="text-sm font-medium">Completed Date</p>
                  <p className="text-sm">{formatDate(record.completed_date)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-600';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-700 border-blue-600';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-600';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-600';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-600';
    }
  };

  return (
    <Badge className={`${getStatusColor()} rounded-full px-3 py-1 font-medium text-xs`}>
      {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
