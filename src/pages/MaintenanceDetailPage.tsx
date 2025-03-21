
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { useMaintenance } from '@/hooks/use-maintenance';
import { MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomButton } from '@/components/ui/custom-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SectionHeader } from '@/components/ui/section-header';
import { format } from 'date-fns';
import { 
  Wrench,
  Clock,
  CalendarCheck,
  Car,
  DollarSign,
  Store,
  FileText,
  Gauge,
  Edit,
  ArrowLeft,
  Clipboard,
  AlertTriangle
} from 'lucide-react';

const MaintenanceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { useOne, useDelete } = useMaintenance();
  const { data: maintenance, isLoading, error } = useOne(id);
  const { mutate: deleteMaintenance, isPending: isDeleting } = useDelete();

  // Format maintenance type
  const formatMaintenanceType = (type?: string) => {
    if (!type) return 'Unknown';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case MaintenanceStatus.SCHEDULED:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300">Scheduled</Badge>;
      case MaintenanceStatus.IN_PROGRESS:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300">In Progress</Badge>;
      case MaintenanceStatus.COMPLETED:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300">Completed</Badge>;
      case MaintenanceStatus.CANCELLED:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-300">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Handle deletion
  const handleDelete = () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      deleteMaintenance(id, {
        onSuccess: () => {
          navigate('/maintenance');
        }
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageContainer
        title="Maintenance Details"
        description="View vehicle maintenance record"
        backLink="/maintenance"
      >
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <Separator />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Error state
  if (error || !maintenance) {
    return (
      <PageContainer
        title="Maintenance Details"
        description="View vehicle maintenance record"
        backLink="/maintenance"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <h3 className="mt-2 text-lg font-semibold text-foreground">Maintenance Record Not Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error 
                    ? error.message 
                    : 'The maintenance record you are looking for does not exist or has been removed.'}
                </p>
                <div className="mt-6">
                  <CustomButton 
                    onClick={() => navigate('/maintenance')}
                    variant="outline"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Maintenance
                  </CustomButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Maintenance Details"
      description="View vehicle maintenance record"
      backLink="/maintenance"
    >
      <div className="space-y-6">
        <SectionHeader
          title={`${formatMaintenanceType(maintenance.maintenance_type)}`}
          description={`Maintenance record for ${maintenance.vehicles?.make} ${maintenance.vehicles?.model}`}
          icon={Wrench}
          actions={
            <div className="flex gap-2">
              <CustomButton
                variant="outline"
                onClick={() => navigate(`/maintenance/edit/${id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </CustomButton>
            </div>
          }
        />

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Status and dates section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">Status:</span>
                  {getStatusBadge(maintenance.status)}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Scheduled:</span> {format(new Date(maintenance.scheduled_date), 'MMMM d, yyyy')}
                    </span>
                  </div>
                  {maintenance.completion_date && (
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-5 w-5 text-green-600" />
                      <span className="text-sm">
                        <span className="font-medium">Completed:</span> {format(new Date(maintenance.completion_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Vehicle information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Car className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Vehicle</p>
                      {maintenance.vehicles ? (
                        <Link 
                          to={`/vehicles/${maintenance.vehicle_id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {`${maintenance.vehicles.make} ${maintenance.vehicles.model} - ${maintenance.vehicles.license_plate}`}
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground">Unknown Vehicle</p>
                      )}
                    </div>
                  </div>
                  {maintenance.odometer_reading !== undefined && (
                    <div className="flex items-start gap-2">
                      <Gauge className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">Odometer Reading</p>
                        <p className="text-sm">{maintenance.odometer_reading.toLocaleString()} km</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Service information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Service Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {maintenance.service_provider && (
                    <div className="flex items-start gap-2">
                      <Store className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">Service Provider</p>
                        <p className="text-sm">{maintenance.service_provider}</p>
                      </div>
                    </div>
                  )}
                  {maintenance.invoice_number && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">Invoice Number</p>
                        <p className="text-sm">{maintenance.invoice_number}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Cost</p>
                      <p className="text-sm">${maintenance.cost?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description and notes */}
              {(maintenance.description || maintenance.notes) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Details</h3>
                  
                  {maintenance.description && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clipboard className="h-5 w-5 text-muted-foreground" />
                        <p className="font-medium">Description</p>
                      </div>
                      <p className="text-sm bg-muted/40 p-3 rounded-md whitespace-pre-line">
                        {maintenance.description}
                      </p>
                    </div>
                  )}
                  
                  {maintenance.notes && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clipboard className="h-5 w-5 text-muted-foreground" />
                        <p className="font-medium">Additional Notes</p>
                      </div>
                      <p className="text-sm bg-muted/40 p-3 rounded-md whitespace-pre-line">
                        {maintenance.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-xs text-muted-foreground">
              {maintenance.created_at && (
                <p>Created: {format(new Date(maintenance.created_at), 'MMM d, yyyy')}</p>
              )}
              {maintenance.updated_at && maintenance.updated_at !== maintenance.created_at && (
                <p>Last updated: {format(new Date(maintenance.updated_at), 'MMM d, yyyy')}</p>
              )}
            </div>
            <CustomButton
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete Record
            </CustomButton>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
};

export default MaintenanceDetailPage;
