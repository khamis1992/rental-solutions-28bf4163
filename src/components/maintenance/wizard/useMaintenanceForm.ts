
import { useState } from 'react';
import { MaintenanceFormData, maintenanceFormSchema, transformFormData } from './schema';
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';

export const useMaintenanceForm = (vehicleId?: string) => {
  // Initialize form state with default values
  const [formData, setFormData] = useState<MaintenanceFormData>({
    maintenance_type: MaintenanceType.REGULAR_INSPECTION,
    description: '',
    scheduled_date: new Date().toISOString().slice(0, 16),
    estimated_cost: '',
    assigned_to: '',
    notes: '',
    vehicle_id: vehicleId || '',
    status: MaintenanceStatus.SCHEDULED
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MaintenanceFormData, string>>>({});

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for the field being changed
    if (errors[name as keyof MaintenanceFormData]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (field: keyof MaintenanceFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for the field being changed
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      maintenanceFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Partial<Record<keyof MaintenanceFormData, string>> = {};
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            const field = err.path[0] as keyof MaintenanceFormData;
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Prepare data for submission
  const getSubmitData = () => {
    return transformFormData(formData);
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
