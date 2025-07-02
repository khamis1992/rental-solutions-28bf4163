
import { useNavigate } from 'react-router-dom';
import { Car, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { VehicleOnboardingWizard } from '@/components/vehicles/VehicleOnboardingWizard';
import PageContainer from '@/components/layout/PageContainer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleService } from '@/services/VehicleService';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';
import { VehicleInsert } from '@/types/vehicle';
import { useLanguage } from '@/contexts/LanguageContext';

const vehicleService = new VehicleService();

const AddVehicle = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { mutate: createVehicle, isPending } = useMutation({
    mutationFn: (vehicle: VehicleInsert) => vehicleService.createVehicle(vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(language === 'ar' ? 'تم إضافة المركبة بنجاح' : 'Vehicle added successfully');
      navigate('/vehicles');
    },
    onError: (error: Error) => {
      toast.error(language === 'ar' ? 'فشل في إضافة المركبة' : 'Failed to add vehicle', {
        description: error.message
      });
    }
  });
  
  const handleSubmit = (formData: any) => {
    createVehicle(formData);
  };
  
  return (
    <PageContainer>
      <PageHeader
        title="إضافة مركبة جديدة"
        subtitle="إضافة مركبة جديدة إلى أسطولك"
        icon={<Car className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <CustomButton 
          size="sm" 
          variant="outline" 
          onClick={() => navigate('/vehicles')}
          className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'العودة إلى المركبات' : 'Back to Vehicles'}
        </CustomButton>
      </PageHeader>
      
      <div className="section-transition mt-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <VehicleOnboardingWizard
          open={true}
          onClose={() => navigate('/vehicles')}
          onComplete={handleSubmit}
        />
      </div>
    </PageContainer>
  );
};

export default AddVehicle;
