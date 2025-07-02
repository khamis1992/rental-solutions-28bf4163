import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMaintenance } from '@/hooks/use-maintenance';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const EditMaintenance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAllRecords, update } = useMaintenance();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [maintenance, setMaintenance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch maintenance record
  useEffect(() => {
    const fetchMaintenance = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const records = await getAllRecords();
        const record = records.find(r => r.id === id);
        
        if (record) {
          console.log("Found maintenance record:", record);
          setMaintenance(record);
        } else {
          console.error("Maintenance record not found for ID:", id);
          setError(language === 'ar' ? 'لم يتم العثور على سجل الصيانة' : 'Maintenance record not found');
        }
      } catch (err) {
        console.error('Error fetching maintenance record:', err);
        setError(language === 'ar' ? 'فشل في تحميل سجل الصيانة' : 'Failed to load maintenance record');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaintenance();
  }, [id, getAllRecords, language]);

  // Convert string maintenance type to enum with default fallback
  const mapStringToMaintenanceType = (typeString: string): keyof typeof MaintenanceType => {
    if (typeString && Object.values(MaintenanceType).includes(typeString as any)) {
      return typeString as keyof typeof MaintenanceType;
    }
    return MaintenanceType.REGULAR_INSPECTION;
  };

  // Convert string status to enum with default fallback
  const mapStringToMaintenanceStatus = (statusString: string): "scheduled" | "in_progress" | "completed" | "cancelled" => {
    const validStatus = ["scheduled", "in_progress", "completed", "cancelled"];
    if (statusString && validStatus.includes(statusString)) {
      return statusString as "scheduled" | "in_progress" | "completed" | "cancelled";
    }
    return MaintenanceStatus.SCHEDULED;
  };

  const handleSubmit = async (formData: any) => {
    if (!id) return;
    
    console.log("Form submitted with data:", formData);
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Ensure types match what's expected in the backend and provide fallbacks for invalid values
      const preparedData = {
        ...formData,
        maintenance_type: mapStringToMaintenanceType(formData.maintenance_type),
        status: mapStringToMaintenanceStatus(formData.status),
        // Ensure vehicle_id is never empty
        vehicle_id: formData.vehicle_id || null,
        // Ensure cost is a number
        cost: typeof formData.cost === 'number' ? formData.cost : parseFloat(formData.cost) || 0,
      };
      
      console.log("Prepared data for update:", preparedData);
      
      await update.mutateAsync({ 
        id, 
        data: preparedData 
      });
      
      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description: language === 'ar' ? 'تم تحديث سجل الصيانة بنجاح' : 'Maintenance record updated successfully',
        variant: "default"
      });
      
      navigate('/maintenance');
    } catch (err) {
      console.error('Error updating maintenance record:', err);
      setError(language === 'ar' ? 'فشل في تحديث سجل الصيانة. يرجى المحاولة مرة أخرى.' : 'Failed to update maintenance record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer 
        title={language === 'ar' ? 'تحرير سجل الصيانة' : 'Edit Maintenance Record'} 
        description={language === 'ar' ? 'جاري تحميل تفاصيل الصيانة...' : 'Loading maintenance details...'}
      >
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !maintenance) {
    return (
      <PageContainer 
        title={language === 'ar' ? 'تحرير سجل الصيانة' : 'Edit Maintenance Record'} 
        description={language === 'ar' ? 'خطأ في تحميل تفاصيل الصيانة' : 'Error loading maintenance details'}
      >
        <Alert variant="destructive" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'خطأ' : 'Error'}
          </AlertTitle>
          <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
            {error || (language === 'ar' ? 'غير قادر على تحميل سجل الصيانة' : 'Unable to load maintenance record')}
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // Prepare the data for the form, ensuring correct types and providing fallbacks
  const formattedMaintenance = {
    ...maintenance,
    maintenance_type: mapStringToMaintenanceType(maintenance.maintenance_type),
    status: mapStringToMaintenanceStatus(maintenance.status),
    // Convert string dates to Date objects if they exist, otherwise use current date
    scheduled_date: maintenance.scheduled_date ? new Date(maintenance.scheduled_date) : new Date(),
    completed_date: maintenance.completed_date ? new Date(maintenance.completed_date) : // undefined - removed unused variable// Ensure vehicle_id is never an empty string
    vehicle_id: maintenance.vehicle_id || null,
  };

  console.log("Prepared maintenance record for form:", formattedMaintenance);

  return (
    <PageContainer 
      title={language === 'ar' ? 'تحرير سجل الصيانة' : 'Edit Maintenance Record'} 
      description={language === 'ar' ? 'تحديث تفاصيل سجل الصيانة' : 'Update maintenance record details'}
    >
      {error && (
        <Alert variant="destructive" className="mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'خطأ' : 'Error'}
          </AlertTitle>
          <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <MaintenanceForm
        initialData={formattedMaintenance}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEditMode={true}
      />
    </PageContainer>
  );
};

export default EditMaintenance;
