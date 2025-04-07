
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, Edit, Trash2, AlertOctagon, Loader2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { VehicleDetail } from '@/components/vehicles/VehicleDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
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

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { useVehicle, useDelete } = useVehicles();
  const { data: vehicle, isLoading, error } = useVehicle(id || '');
  const { mutate: deleteVehicle, isPending: isDeleting } = useDelete();
  
  const handleDelete = () => {
    if (id) {
      deleteVehicle(id, {
        onSuccess: () => {
          navigate('/vehicles');
        }
      });
    }
  };
  
  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-5 w-1/4 mt-1" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
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
          <CustomButton 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Vehicles
          </CustomButton>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <SectionHeader
        title={`${vehicle.make} ${vehicle.model}`}
        description={`${vehicle.year} • ${vehicle.licensePlate}`}
        icon={Car}
        actions={
          <>
            <CustomButton 
              size="sm" 
              variant="outline" 
              onClick={() => navigate('/vehicles')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicles
            </CustomButton>
            <CustomButton 
              size="sm" 
              variant="outline" 
              onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Vehicle
            </CustomButton>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <CustomButton 
                  size="sm" 
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vehicle
                </CustomButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    {` ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`} from the fleet.
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
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />
      
      <div className="section-transition">
        <VehicleDetail vehicle={vehicle} />
      </div>
    </PageContainer>
  );
};

export default VehicleDetailPage;
