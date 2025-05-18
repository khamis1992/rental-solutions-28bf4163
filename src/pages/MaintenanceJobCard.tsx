import React from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMaintenance } from '@/hooks/use-maintenance';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const MaintenanceJobCard = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { useMaintenanceList } = useMaintenance();

  // Fetch maintenance records for the vehicle
  const { data: records = [], isLoading } = useMaintenanceList(vehicleId);

  const record = records?.[0];

  if (isLoading) {
    return (
      <PageContainer title="Job Card" backLink="/maintenance">
        <Skeleton className="h-8 w-1/3" />
      </PageContainer>
    );
  }

  if (!record) {
    return (
      <PageContainer title="Job Card" backLink="/maintenance">
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No maintenance record found for this vehicle.
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not specified';
    try {
      return format(new Date(date), 'PPP');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <PageContainer title="Job Card" backLink="/maintenance">
      <Card>
        <CardHeader>
          <CardTitle>{record.maintenance_type?.replace(/_/g, ' ') || 'Maintenance'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Status:</strong> {record.status?.replace(/_/g, ' ')}
          </div>
          <div>
            <strong>Scheduled:</strong> {formatDate(record.scheduled_date)}
          </div>
          {record.description && (
            <div>
              <strong>Description:</strong> {record.description}
            </div>
          )}
          {record.notes && (
            <div>
              <strong>Notes:</strong> {record.notes}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default MaintenanceJobCard;
