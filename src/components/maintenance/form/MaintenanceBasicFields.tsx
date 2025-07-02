
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

import { useLanguage } from '@/contexts/LanguageContext';

interface MaintenanceBasicFieldsProps {
  form: any;
}

export const MaintenanceBasicFields: React.FC<MaintenanceBasicFieldsProps> = ({ form }) => {
  const vehicleId = form.watch('vehicle_id');
  const agreementId = form.watch('agreement_id');
  const { language } = useLanguage();

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {(vehicleId || agreementId) && (
        <div className={`mb-4 p-2 bg-blue-50 border border-blue-200 rounded ${language === 'ar' ? 'text-right' : ''}`}>
          <div className="text-sm text-blue-900 font-medium">
            {language === 'ar' ? 'المعلومات المحددة مسبقاً:' : 'Prefilled Context:'}
          </div>
          {vehicleId && (
            <div className="text-xs text-blue-800">
              {language === 'ar' ? 'معرف المركبة:' : 'Vehicle ID:'} <span className="font-mono">{vehicleId}</span>
            </div>
          )}
          {agreementId && (
            <div className="text-xs text-blue-800">
              {language === 'ar' ? 'معرف الاتفاقية:' : 'Agreement ID:'} <span className="font-mono">{agreementId}</span>
            </div>
          )}
        </div>
      )}
      
      <FormField
        control={form.control}
        name="vehicle_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'معرف المركبة' : 'Vehicle ID'}
            </FormLabel>
            <FormControl>
              <Input 
                placeholder={language === 'ar' ? 'معرف المركبة' : 'Vehicle ID'} 
                {...field} 
                readOnly={!!field.value}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="agreement_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'معرف الاتفاقية' : 'Agreement ID'}
            </FormLabel>
            <FormControl>
              <Input 
                placeholder={language === 'ar' ? 'معرف الاتفاقية' : 'Agreement ID'} 
                {...field} 
                readOnly={!!field.value}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'نوع الخدمة' : 'Service Type'}
            </FormLabel>
            <FormControl>
              <Input 
                placeholder={language === 'ar' ? 'نوع الخدمة' : 'Service type'} 
                {...field}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
