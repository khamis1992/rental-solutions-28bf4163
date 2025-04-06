
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMaintenance } from '@/hooks/use-maintenance';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Wrench } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PageContainer from '@/components/layout/PageContainer';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomButton } from '@/components/ui/custom-button';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

const EditMaintenance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAllRecords, update } = useMaintenance();
  const { toast } = useToast();
  const [maintenance, setMaintenance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();

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
          setError(t('maintenance.records'));
        }
      } catch (err) {
        console.error('Error fetching maintenance record:', err);
        setError(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaintenance();
  }, [id, getAllRecords, t]);

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
        title: t('common.success'),
        description: t('maintenance.records')
      });
      
      navigate('/maintenance');
    } catch (err) {
      console.error('Error updating maintenance record:', err);
      setError(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <SectionHeader
          title={t('maintenance.edit')}
          description={t('common.loading')}
          icon={Wrench}
        />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !maintenance) {
    return (
      <PageContainer>
        <SectionHeader
          title={t('maintenance.edit')}
          description={t('maintenance.details')}
          icon={Wrench}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            {error || t('maintenance.records')}
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
    completion_date: maintenance.completion_date ? new Date(maintenance.completion_date) : undefined,
    // Ensure vehicle_id is never an empty string
    vehicle_id: maintenance.vehicle_id || null,
  };

  console.log("Prepared maintenance record for form:", formattedMaintenance);

  return (
    <PageContainer>
      <SectionHeader
        title={t('maintenance.edit')}
        description={t('maintenance.details')}
        icon={Wrench}
        actions={
          <CustomButton
            size="sm"
            variant="outline"
            onClick={() => navigate('/maintenance')}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.back')}
          </CustomButton>
        }
      />
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <MaintenanceForm
        initialData={formattedMaintenance}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEditMode={true}
      />
    </PageContainer>
  );
};

export default EditMaintenance;
