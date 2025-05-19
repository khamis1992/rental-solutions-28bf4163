
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useMaintenance } from '@/hooks/use-maintenance';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { vehicleRepository } from '@/lib/database/vehicle-repository';
import { useQuery } from '@tanstack/react-query';

const MaintenanceJobCard = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { useMaintenanceList } = useMaintenance();

  // Fetch maintenance records for the vehicle
  const { data: records = [], isLoading: isLoadingMaintenance } = useMaintenanceList(vehicleId);

  // Fetch vehicle details
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await vehicleRepository.findById(vehicleId);
      return result?.data || null;
    },
    enabled: !!vehicleId
  });

  const record = records?.[0];
  const isLoading = isLoadingMaintenance || isLoadingVehicle;

  const handleCreateMaintenance = () => {
    navigate(`/maintenance/add?vehicle_id=${vehicleId}`);
  };

  const handleBack = () => {
    navigate('/maintenance');
  };

  if (isLoading) {
    return (
      <PageContainer title="Job Card" backLink="/maintenance">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-48 w-full" />
      </PageContainer>
    );
  }

  // No maintenance record exists
  if (!record) {
    return (
      <PageContainer title="Job Card" backLink="/maintenance">
        <Card>
          <CardHeader>
            <CardTitle>
              {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'Vehicle Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-6">
              No maintenance record found for this vehicle.
            </p>
            {vehicle && (
              <div className="flex flex-col items-center space-y-2">
                <Button 
                  onClick={handleCreateMaintenance} 
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Maintenance Record
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Maintenance
            </Button>
          </CardFooter>
        </Card>
      </PageContainer>
    );
  }

  // Maintenance record exists
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
          <CardTitle>
            {vehicle 
              ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` 
              : record.maintenance_type?.replace(/_/g, ' ') || 'Maintenance'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Type:</strong> {record.maintenance_type?.replace(/_/g, ' ') || 'General Maintenance'}
          </div>
          <div>
            <strong>Status:</strong> {record.status?.replace(/_/g, ' ')}
          </div>
          <div>
            <strong>Scheduled:</strong> {formatDate(record.scheduled_date)}
          </div>
          {record.completed_date && (
            <div>
              <strong>Completed:</strong> {formatDate(record.completed_date)}
            </div>
          )}
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
          {record.cost !== undefined && (
            <div>
              <strong>Cost:</strong> ${record.cost.toFixed(2)}
            </div>
          )}
          {record.performed_by && (
            <div>
              <strong>Performed by:</strong> {record.performed_by}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Maintenance
          </Button>
          <Button onClick={() => navigate(`/maintenance/${record.id}/edit`)}>
            Edit Record
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  );
};

export default MaintenanceJobCard;
