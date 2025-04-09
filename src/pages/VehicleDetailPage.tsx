
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, Edit, Trash2, AlertOctagon, Loader2, MapPin, Save, X, CheckCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { VehicleDetail } from '@/components/vehicles/VehicleDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { useVehicle, useDelete, useUpdate } = useVehicles();
  const { data: vehicle, isLoading, error } = useVehicle(id || '');
  const { mutate: deleteVehicle, isPending: isDeleting } = useDelete();
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState<string>(vehicle?.location || '');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusValue, setStatusValue] = useState<string>(vehicle?.status || 'available');
  
  // Update location and status state when vehicle data is loaded
  React.useEffect(() => {
    if (vehicle) {
      setLocationValue(vehicle.location || '');
      setStatusValue(vehicle.status || 'available');
    }
  }, [vehicle]);
  
  const handleDelete = () => {
    if (id) {
      deleteVehicle(id, {
        onSuccess: () => {
          navigate('/vehicles');
        }
      });
    }
  };

  const handleLocationEdit = () => {
    setIsEditingLocation(true);
  };

  const handleLocationCancel = () => {
    setLocationValue(vehicle?.location || '');
    setIsEditingLocation(false);
  };

  const handleLocationSave = () => {
    if (id) {
      updateVehicle(
        { 
          id, 
          data: { 
            location: locationValue 
          } 
        },
        {
          onSuccess: () => {
            toast.success('Vehicle location updated successfully');
            setIsEditingLocation(false);
          },
          onError: (error) => {
            toast.error(`Failed to update location: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      );
    }
  };

  const handleStatusEdit = () => {
    setIsEditingStatus(true);
  };

  const handleStatusCancel = () => {
    setStatusValue(vehicle?.status || 'available');
    setIsEditingStatus(false);
  };

  const handleStatusSave = () => {
    if (id) {
      console.log('Updating vehicle status to:', statusValue);
      updateVehicle(
        { 
          id, 
          data: { 
            status: statusValue 
          } 
        },
        {
          onSuccess: () => {
            toast.success('Vehicle status updated successfully');
            setIsEditingStatus(false);
          },
          onError: (error) => {
            toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Status update error:', error);
          }
        }
      );
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

      {/* Vehicle Status Edit Section */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Status</h3>
          </div>
          
          {!isEditingStatus ? (
            <CustomButton 
              size="sm" 
              variant="ghost" 
              onClick={handleStatusEdit}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </CustomButton>
          ) : (
            <div className="flex items-center space-x-2">
              <CustomButton 
                size="sm" 
                variant="ghost" 
                onClick={handleStatusCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </CustomButton>
              <CustomButton 
                size="sm" 
                variant="default" 
                onClick={handleStatusSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </CustomButton>
            </div>
          )}
        </div>
        
        <div className="mt-2">
          {isEditingStatus ? (
            <Select value={statusValue} onValueChange={setStatusValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center">
              <span className="inline-block px-2 py-1 text-sm rounded-md capitalize bg-blue-100 text-blue-800">
                {vehicle.status || 'Available'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Location Edit Section */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Location</h3>
          </div>
          
          {!isEditingLocation ? (
            <CustomButton 
              size="sm" 
              variant="ghost" 
              onClick={handleLocationEdit}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </CustomButton>
          ) : (
            <div className="flex items-center space-x-2">
              <CustomButton 
                size="sm" 
                variant="ghost" 
                onClick={handleLocationCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </CustomButton>
              <CustomButton 
                size="sm" 
                variant="default" 
                onClick={handleLocationSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </CustomButton>
            </div>
          )}
        </div>
        
        <div className="mt-2">
          {isEditingLocation ? (
            <Input
              value={locationValue}
              onChange={(e) => setLocationValue(e.target.value)}
              placeholder="Enter vehicle location"
              className="w-full"
            />
          ) : (
            <p className="text-lg">{vehicle.location || 'No location specified'}</p>
          )}
        </div>
      </div>
      
      <div className="section-transition">
        <VehicleDetail vehicle={vehicle} />
      </div>
    </PageContainer>
  );
};

export default VehicleDetailPage;
