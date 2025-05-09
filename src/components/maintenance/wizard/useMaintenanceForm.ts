
import { useState } from 'react';
import { MaintenanceFormData } from '@/lib/validation-schemas/maintenance';

export type MaintenanceFormErrors = {
  maintenance_type?: string;
  description?: string;
  scheduled_date?: string;
  estimated_cost?: string;
  assigned_to?: string;
  notes?: string;
  vehicle_id?: string;
  status?: string;
};

export const useMaintenanceForm = (vehicleId: string | undefined) => {
  const [formData, setFormData] = useState<{
    maintenance_type: string;
    description?: string;
    scheduled_date: string;
    estimated_cost: string;
    assigned_to?: string;
    notes?: string;
    vehicle_id?: string;
    status?: string;
  }>({
    maintenance_type: '',
    description: '',
    scheduled_date: new Date().toISOString().substring(0, 10),
    estimated_cost: '0',
    assigned_to: '',
    notes: '',
    vehicle_id: vehicleId,
    status: 'scheduled'
  });

  const [errors, setErrors] = useState<MaintenanceFormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof MaintenanceFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof MaintenanceFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: MaintenanceFormErrors = {};
    
    if (!formData.maintenance_type) {
      newErrors.maintenance_type = "Maintenance type is required";
    }
    
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = "Scheduled date is required";
    }
    
    if (formData.estimated_cost && (isNaN(parseFloat(formData.estimated_cost)) || parseFloat(formData.estimated_cost) < 0)) {
      newErrors.estimated_cost = "Estimated cost must be a valid number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSubmitData = () => {
    return {
      maintenance_type: formData.maintenance_type,
      description: formData.description || '',
      scheduled_date: formData.scheduled_date,
      cost: parseFloat(formData.estimated_cost || '0'),
      assigned_to: formData.assigned_to,
      notes: formData.notes,
      vehicle_id: formData.vehicle_id || vehicleId,
      status: formData.status || 'scheduled'
    };
  };

  return {
    formData,
    errors,
    handleInputChange,
    handleSelectChange,
    validateForm,
    getSubmitData
  };
};
