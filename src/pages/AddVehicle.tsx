import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { VehicleOnboardingWizard } from '@/components/vehicles/VehicleOnboardingWizard';
import PageContainer from '@/components/layout/PageContainer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleService } from '@/services/VehicleService';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';
import { VehicleInsert } from '@/types/vehicle';

const vehicleService = new VehicleService();

const AddVehicle = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { mutate: createVehicle, isPending } = useMutation({
    mutationFn: (vehicle: VehicleInsert) => vehicleService.createVehicle(vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle added successfully');
      navigate('/vehicles');
    },
    onError: (error: Error) => {
      toast.error('Failed to add vehicle', {
        description: error.message
      });
    }
  });
  
  const handleSubmit = (formData: any) => {
    createVehicle(formData);
  };
  
  return (
    <PageContainer>
      <SectionHeader
        title="Add New Vehicle"
        description="Add a new vehicle to your fleet"
        icon={Car}
        actions={
          <CustomButton 
            size="sm" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </CustomButton>
        }
      />
      
      <div className="section-transition">
        <VehicleOnboardingWizard
          open={true}
          onClose={() => navigate('/vehicles')}
          onComplete={handleSubmit}
        />
      </div>
    </PageContainer>
  );
};

export default AddVehicle;
