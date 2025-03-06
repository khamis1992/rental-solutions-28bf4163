
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleGrid from '@/components/vehicles/VehicleGrid';
import { Car, Plus, Filter } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';

const Vehicles = () => {
  const handleSelectVehicle = (id: string) => {
    toast.info(`Vehicle ${id} selected`, {
      description: "Vehicle details feature coming soon!"
    });
  };

  const handleAddVehicle = () => {
    toast.info("Add Vehicle", {
      description: "This feature is coming soon!"
    });
  };
  
  return (
    <PageContainer>
      <SectionHeader
        title="Vehicle Management"
        description="Manage your fleet inventory"
        icon={Car}
        actions={
          <>
            <CustomButton size="sm" variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </CustomButton>
            <CustomButton size="sm" glossy onClick={handleAddVehicle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </CustomButton>
          </>
        }
      />
      
      <VehicleGrid onSelectVehicle={handleSelectVehicle} />
    </PageContainer>
  );
};

export default Vehicles;
