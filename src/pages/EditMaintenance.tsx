
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Card, CardContent } from '@/components/ui/card';
import { useMaintenance } from '@/hooks/use-maintenance';
import { supabase } from '@/lib/supabase';
import { MaintenanceRecord } from '@/types/maintenance';

const EditMaintenance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceRecord | null>(null);
  const { update } = useMaintenance('');

  useEffect(() => {
    const fetchMaintenanceRecord = async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        setMaintenanceData(data);
      } catch (error) {
        console.error('Error fetching maintenance record:', error);
        toast.error('Failed to fetch maintenance record');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMaintenanceRecord();
    }
  }, [id]);

  const handleSubmit = async (formData: any) => {
    try {
      if (!id) {
        throw new Error('Missing maintenance record ID');
      }

      await update.mutateAsync({
        id,
        ...formData,
      });

      toast.success('Maintenance record updated successfully');
      navigate('/maintenance');
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      toast.error('Failed to update maintenance record');
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Edit Maintenance Record">
        <Card>
          <CardContent className="flex justify-center items-center p-6 min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!maintenanceData) {
    return (
      <PageContainer title="Edit Maintenance Record">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">Maintenance record not found</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Maintenance Record" description="Update maintenance record details">
      <Card>
        <CardContent className="p-6">
          <MaintenanceForm 
            initialData={maintenanceData} 
            onSubmit={handleSubmit} 
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default EditMaintenance;
