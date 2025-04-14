
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, Edit, Trash2, AlertOctagon, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleDetail from '@/components/vehicles/VehicleDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { useVehicle, useDelete } = useVehicles();
  const { data: vehicle, isLoading, error } = useVehicle(id || '');
  const { mutate: deleteVehicle, isPending: isDeleting } = useDelete();
  
  const handleDelete = async () => {
    if (id) {
      deleteVehicle(id, {
        onSuccess: () => {
          toast.success('Vehicle deleted successfully', {
            description: 'You have been redirected to the vehicles list'
          });
          navigate('/vehicles');
        },
        onError: (error) => {
          toast.error('Failed to delete vehicle', {
            description: error instanceof Error ? error.message : 'An unknown error occurred'
          });
        }
      });
    }
  };

  const handleScheduleMaintenance = () => {
    toast('Feature coming soon', {
      description: 'Maintenance scheduling will be available in a future update'
    });
  };
  
  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-5 w-1/4 mt-1" />
        </div>

        {/* Skeleton for header area */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <Skeleton className="w-full lg:w-1/3 h-64 rounded-lg" />
          <div className="w-full lg:w-2/3 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Skeleton className="h-16 rounded" />
              <Skeleton className="h-16 rounded" />
              <Skeleton className="h-16 rounded" />
            </div>
          </div>
        </div>

        {/* Skeleton for tabs */}
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </PageContainer>
    );
  }
  
  if (error || !vehicle) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <AlertOctagon className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Vehicle Not Found</h2>
          </div>
          <p>The vehicle you're looking for doesn't exist or has been removed.</p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Vehicles
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <SectionHeader
        title={`${vehicle.make} ${vehicle.model}`}
        description={`${vehicle.year} • ${vehicle.license_plate}`}
        icon={Car}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleScheduleMaintenance}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => navigate('/vehicles')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicles
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Vehicle
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vehicle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    {` ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`} from the fleet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />
      
      <div className="section-transition mt-6">
        <VehicleDetail vehicle={vehicle} />
      </div>
    </PageContainer>
  );
};

export default VehicleDetailPage;
