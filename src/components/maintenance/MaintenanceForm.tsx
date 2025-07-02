import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import {
  MaintenanceBasicFields,
  MaintenanceTypeFields,
  MaintenanceDateFields,
  MaintenanceCostFields,
  MaintenanceDescriptionFields,
  MaintenanceFormActions,
  MaintenancePhotoUpload
} from './form';

interface MaintenanceFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  categories?: any[];
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  initialData,
  onSubmit,
  categories = [],
  isSubmitting = false,
  isEditMode = false,
}) => {
  const form = useForm({
    defaultValues: {
      ...initialData || {
        vehicle_id: '',
        agreement_id: '',
        service_type: '',
        maintenance_type: MaintenanceType.REGULAR_INSPECTION,
        status: MaintenanceStatus.SCHEDULED,
        description: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        completed_date: '',
        cost: 0,
        service_provider: '',
        invoice_number: '',
        odometer_reading: 0,
        notes: '',
        category_id: '',
        photos: []
      }
    }
  });

  useEffect(() => {
    if (!initialData) return;

    if (initialData.category_id) {
      form.setValue('category_id', initialData.category_id);
    }
    if (initialData.agreement_id) {
      form.setValue('agreement_id', initialData.agreement_id);
    }
    if (initialData.maintenance_type) {
      form.setValue('maintenance_type', initialData.maintenance_type);
    }
    if (initialData.status) {
      form.setValue('status', initialData.status);
    }
    if (initialData.completed_date) {
      form.setValue('completed_date', initialData.completed_date);
    }
    if (initialData.service_provider) {
      form.setValue('service_provider', initialData.service_provider);
    }
    if (initialData.invoice_number) {
      form.setValue('invoice_number', initialData.invoice_number);
    }
    if (initialData.odometer_reading) {
      form.setValue('odometer_reading', initialData.odometer_reading);
    }
    if (initialData.photos) {
      form.setValue('photos', initialData.photos);
    }
  }, [initialData, form]);

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('فشل في حفظ البيانات');
      console.error('Error in maintenance form:', error);
    }
  };

  return (
    <div dir="rtl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MaintenanceBasicFields form={form} />
            <MaintenanceTypeFields form={form} categories={categories} />
            <MaintenanceDateFields form={form} />
            <MaintenanceCostFields form={form} />
            <MaintenanceDescriptionFields form={form} />
            <div className="md:col-span-2">
              <MaintenancePhotoUpload form={form} />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'جاري الحفظ...' : (isEditMode ? 'تحديث' : 'حفظ')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MaintenanceForm;
