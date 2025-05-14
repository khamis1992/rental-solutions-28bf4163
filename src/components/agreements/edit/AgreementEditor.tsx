// Import necessary dependencies
import { useState } from 'react';
import { Agreement } from '@/types/agreement';

// Define the component properties here
interface AgreementEditorProps {
  agreement?: Agreement;
  onSave?: (agreement: Agreement) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function AgreementEditor({ 
  agreement, 
  onSave, 
  onCancel, 
  isLoading = false 
}: AgreementEditorProps) {
  const [formData, setFormData] = useState<Agreement>(agreement || {
    id: '',
    status: 'draft',
    customer_id: '',
    vehicle_id: '',
    start_date: new Date(),
    end_date: new Date(),
    total_amount: 0
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (field: keyof Agreement, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.vehicle_id) {
      newErrors.vehicle_id = 'Vehicle is required';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    
    if (formData.start_date && formData.end_date && 
        new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }
    
    if (!formData.total_amount || formData.total_amount <= 0) {
      newErrors.total_amount = 'Total amount must be greater than zero';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (onSave) {
        const updatedAgreement: Agreement = {
          ...formData,
          // Ensure dates are properly formatted
          start_date: formData.start_date instanceof Date 
            ? formData.start_date 
            : new Date(formData.start_date),
          end_date: formData.end_date instanceof Date 
            ? formData.end_date 
            : new Date(formData.end_date)
        };
        
        await onSave(updatedAgreement);
      }
    } catch (error) {
      console.error('Error saving agreement:', error);
      setErrors({
        submit: 'Failed to save agreement. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields would go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer selection */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">
            Customer
          </label>
          {/* Customer select component */}
          {errors.customer_id && (
            <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>
          )}
        </div>
        
        {/* Vehicle selection */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">
            Vehicle
          </label>
          {/* Vehicle select component */}
          {errors.vehicle_id && (
            <p className="text-sm text-red-500 mt-1">{errors.vehicle_id}</p>
          )}
        </div>
        
        {/* Date fields */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">
            Start Date
          </label>
          {/* Date picker component */}
          {errors.start_date && (
            <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>
          )}
        </div>
        
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">
            End Date
          </label>
          {/* Date picker component */}
          {errors.end_date && (
            <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>
          )}
        </div>
        
        {/* Amount fields */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">
            Total Amount
          </label>
          <input
            type="number"
            value={formData.total_amount || ''}
            onChange={(e) => handleChange('total_amount', parseFloat(e.target.value))}
            className="w-full p-2 border rounded"
          />
          {errors.total_amount && (
            <p className="text-sm text-red-500 mt-1">{errors.total_amount}</p>
          )}
        </div>
        
        {/* Status selection */}
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      
      {/* Notes field */}
      <div className="form-group">
        <label className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full p-2 border rounded"
          rows={4}
        />
      </div>
      
      {/* Error message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}
      
      {/* Form actions */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded shadow-sm"
            disabled={submitting || isLoading}
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700"
          disabled={submitting || isLoading}
        >
          {submitting || isLoading ? 'Saving...' : 'Save Agreement'}
        </button>
      </div>
    </form>
  );
}
