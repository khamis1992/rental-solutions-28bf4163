
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Card, CardContent } from '@/components/ui/card';
import { useMaintenance } from '@/hooks/use-maintenance';

const AddMaintenance: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { create } = useMaintenance('');

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      await create.mutateAsync(formData);
      toast.success('Maintenance record created successfully');
      navigate('/maintenance');
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      toast.error('Failed to create maintenance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer title="Add Maintenance Record" description="Create a new maintenance record">
      <Card>
        <CardContent className="p-6">
          <MaintenanceForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AddMaintenance;
