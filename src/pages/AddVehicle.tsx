
// This is a minimal version of the page just to fix the import error
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Car } from 'lucide-react';

const AddVehicle: React.FC = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Add New Vehicle"
        description="Enter the details for the new vehicle"
        icon={Car}
      />
      <div className="section-transition">
        {/* Vehicle form content will go here */}
        <div className="bg-muted/30 p-6 rounded-lg text-center">
          <p className="text-muted-foreground">Vehicle creation form will be displayed here.</p>
        </div>
      </div>
    </PageContainer>
  );
};

export default AddVehicle;
