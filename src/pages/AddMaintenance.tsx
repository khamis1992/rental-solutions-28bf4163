import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import PageContainer from '@/components/layout/PageContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const PENDING_KEY = 'pendingMaintenance';

// Save a pending maintenance record to localStorage
function savePendingMaintenance(data: any) {
  const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  existing.push(data);
  localStorage.setItem(PENDING_KEY, JSON.stringify(existing));
}

// Sync pending maintenance records from localStorage to Supabase
async function syncPendingMaintenance(create: any) {
  if (!navigator.onLine) return;
  const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  if (!pending.length) return;
  for (const item of pending) {
    try {
      await create.mutateAsync(item);
    } catch {}
  }
  localStorage.removeItem(PENDING_KEY);
}

const AddMaintenance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledVehicleId = searchParams.get('vehicle_id') || '';
  const prefilledAgreementId = searchParams.get('agreement_id') || '';
  const { create } = useMaintenance();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Ensure the maintenance type is a valid enum value
  const validateMaintenanceType = (type: string): keyof typeof MaintenanceType => {
    if (Object.values(MaintenanceType).includes(type as any)) {
      return type as keyof typeof MaintenanceType;
    }
    return 'REGULAR_INSPECTION';
  };
  
  // Ensure the status is a valid enum value
  const validateMaintenanceStatus = (status: string): "scheduled" | "in_progress" | "completed" | "cancelled" => {
    const validStatus = ["scheduled", "in_progress", "completed", "cancelled"];
    if (validStatus.includes(status)) {
      return status as "scheduled" | "in_progress" | "completed" | "cancelled";
    }
    return 'scheduled';
  };

  useEffect(() => {
    // Try to sync on mount and when online
    const sync = () => syncPendingMaintenance(create);
    window.addEventListener('online', sync);
    sync();
    return () => window.removeEventListener('online', sync);
  }, [create]);

  const handleSubmit = async (formData: any) => {
    console.log("Form submitted with data:", formData);
    
    setIsSubmitting(true);
    setError(null);
    
    let preparedData;
    try {
      // Prepare data for API submission
      preparedData = {
        ...formData,
        // Ensure these fields are properly validated
        maintenance_type: validateMaintenanceType(formData.maintenance_type || MaintenanceType.REGULAR_INSPECTION),
        status: validateMaintenanceStatus(formData.status || MaintenanceStatus.SCHEDULED),
        // Ensure vehicle_id is never empty
        vehicle_id: formData.vehicle_id || null,
        agreement_id: formData.agreement_id || null,
        // Ensure cost is a number
        cost: typeof formData.cost === 'number' ? formData.cost : parseFloat(formData.cost) || 0,
      };
      
      console.log("Prepared data for submission:", preparedData);
      
      await create.mutateAsync(preparedData);
      setSubmitted(true);
      toast({
        title: "Success",
        description: "Maintenance record created successfully",
        variant: "default"
      });
    } catch (err: any) {
      console.error('Error creating maintenance record:', err);
      setError(err.message || 'Failed to create maintenance record. Please try again.');
      savePendingMaintenance(preparedData);
      toast({
        title: "Offline",
        description: "You are offline or the request failed. The record will be synced when you are back online.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageContainer title="Maintenance Submitted">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-green-100 p-4 mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Maintenance record submitted!</h2>
          <p className="mb-6 text-gray-600">Thank you. The record has been saved.</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/maintenance')}>Back to Maintenance</Button>
            <Button variant="outline" onClick={() => { setSubmitted(false); }}>Add Another</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Add Maintenance Record" 
      description="Create a new maintenance record for a vehicle"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <MaintenanceForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        initialData={{ vehicle_id: prefilledVehicleId, agreement_id: prefilledAgreementId }}
      />
    </PageContainer>
  );
};

export default AddMaintenance;
