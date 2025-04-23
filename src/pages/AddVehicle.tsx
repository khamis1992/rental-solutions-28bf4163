
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleForm from '@/components/vehicles/VehicleForm';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicles } from '@/hooks/use-vehicles';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';

const AddVehicle = () => {
  const navigate = useNavigate();
  const { useCreate } = useVehicles();
  const { mutate: createVehicle, isPending } = useCreate();
  
  const handleSubmit = (formData: any) => {
    createVehicle(formData, {
      onSuccess: () => {
        navigate('/vehicles');
      },
      onError: (error) => {
        toast.error('Failed to add vehicle', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    });
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
        <VehicleForm 
          onSubmit={handleSubmit} 
          isLoading={isPending} 
        />
      </div>
    </PageContainer>
  );
};

export default AddVehicle;
