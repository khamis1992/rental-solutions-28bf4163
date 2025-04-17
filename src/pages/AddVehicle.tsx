
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Car } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { SectionHeader } from '@/components/ui/section-header';
import { useVehicles } from '@/hooks/use-vehicles';

const AddVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addVehicle } = useVehicles();
  
  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      // Call the mutation function
      await addVehicle(formData);
      
      toast.success('Vehicle added successfully');
      navigate('/vehicles');
    } catch (error: any) {
      toast.error('Failed to add vehicle', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageContainer title="Add New Vehicle">
      <SectionHeader 
        title="Add New Vehicle"
        description="Enter the details of the new vehicle"
        icon={Car}
      />
      
      <div className="section-transition">
        <VehicleForm 
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </PageContainer>
  );
};

export default AddVehicle;
