
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { useMaintenance } from '@/hooks/use-maintenance';
import PageContainer from '@/components/layout/PageContainer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Wrench } from 'lucide-react';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomButton } from '@/components/ui/custom-button';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

const AddMaintenance = () => {
  const navigate = useNavigate();
  const { create } = useMaintenance();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  // Ensure the maintenance type is a valid enum value
  const validateMaintenanceType = (type: string): keyof typeof MaintenanceType => {
    if (Object.values(MaintenanceType).includes(type as any)) {
      return type as keyof typeof MaintenanceType;
    }
    return MaintenanceType.REGULAR_INSPECTION;
  };
  
  // Ensure the status is a valid enum value
  const validateMaintenanceStatus = (status: string): "scheduled" | "in_progress" | "completed" | "cancelled" => {
    const validStatus = ["scheduled", "in_progress", "completed", "cancelled"];
    if (validStatus.includes(status)) {
      return status as "scheduled" | "in_progress" | "completed" | "cancelled";
    }
    return MaintenanceStatus.SCHEDULED;
  };

  const handleSubmit = async (formData: any) => {
    console.log("Form submitted with data:", formData);
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert dates to ISO strings for API and ensure valid values for enum fields
      const preparedData = {
        ...formData,
        // Ensure these fields are never empty strings
        maintenance_type: validateMaintenanceType(formData.maintenance_type || MaintenanceType.REGULAR_INSPECTION),
        status: validateMaintenanceStatus(formData.status || MaintenanceStatus.SCHEDULED),
        // Ensure vehicle_id is never empty
        vehicle_id: formData.vehicle_id || null,
        // Ensure cost is a number
        cost: typeof formData.cost === 'number' ? formData.cost : parseFloat(formData.cost) || 0,
      };
      
      // Log the data we're about to submit to help debug any issues
      console.log("Prepared data for submission:", preparedData);
      
      await create.mutateAsync(preparedData);
      
      toast({
        title: t('common.success'),
        description: t('maintenance.createSuccess')
      });
      
      navigate('/maintenance');
    } catch (err) {
      console.error('Error creating maintenance record:', err);
      setError(t('maintenance.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title={t('maintenance.add')}
      description={t('maintenance.description')}
      backLink="/maintenance"
    >
      <SectionHeader
        title={t('maintenance.add')}
        description={t('maintenance.description')}
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
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </PageContainer>
  );
};

export default AddMaintenance;
