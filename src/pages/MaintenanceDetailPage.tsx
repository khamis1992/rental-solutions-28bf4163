import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Button } from '@/components/ui/button';

const MaintenanceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { maintenanceRecords, deleteMaintenanceRecord } = useMaintenance();

  const maintenanceRecord = maintenanceRecords.find(record => record.id === id);

  const handleDelete = async () => {
    await deleteMaintenanceRecord(id);
    navigate('/maintenance');
  };

  if (!maintenanceRecord) {
    return (
      <PageContainer title="Maintenance Detail" description="Maintenance record not found">
        <div>Maintenance record not found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Maintenance Detail" description="View maintenance record details">
      <div>
        <h3>Maintenance Record Details</h3>
        <p>ID: {maintenanceRecord.id}</p>
        <p>Vehicle ID: {maintenanceRecord.vehicleId}</p>
        <p>Description: {maintenanceRecord.description}</p>
        <Button onClick={handleDelete}>Delete</Button>
      </div>
    </PageContainer>
  );
};

export default MaintenanceDetailPage;
