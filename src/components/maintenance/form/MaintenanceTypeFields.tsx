
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import { typeGuards } from '@/lib/database';

interface MaintenanceTypeFieldsProps {
  form: UseFormReturn<any>;
  categories?: any[];
}

export const MaintenanceTypeFields: React.FC<MaintenanceTypeFieldsProps> = ({ 
  form, 
  categories = [] 
}) => {
  // Safely filter categories
  const filteredCategories = typeGuards.isArray(categories) 
    ? categories.filter((cat: any) => cat?.is_active !== false)
    : [];

  // Arabic translations for maintenance types
  const getMaintenanceTypeLabel = (type: string) => {
    const translations: { [key: string]: string } = {
      'REGULAR_INSPECTION': 'فحص دوري',
      'OIL_CHANGE': 'تغيير زيت',
      'BRAKE_SERVICE': 'خدمة الفرامل',
      'TIRE_ROTATION': 'تدوير الإطارات',
      'ENGINE_REPAIR': 'إصلاح المحرك',
      'TRANSMISSION_SERVICE': 'خدمة ناقل الحركة',
      'AC_SERVICE': 'خدمة التكييف',
      'BATTERY_REPLACEMENT': 'استبدال البطارية',
      'BODY_WORK': 'أعمال الهيكل',
      'ELECTRICAL_REPAIR': 'إصلاح كهربائي',
      'SUSPENSION_REPAIR': 'إصلاح نظام التعليق',
      'EXHAUST_REPAIR': 'إصلاح العادم',
      'COOLING_SYSTEM': 'نظام التبريد',
      'FUEL_SYSTEM': 'نظام الوقود',
      'STEERING_REPAIR': 'إصلاح نظام القيادة',
      'WINDSHIELD_REPAIR': 'إصلاح الزجاج الأمامي',
      'PAINT_WORK': 'أعمال الطلاء',
      'INTERIOR_REPAIR': 'إصلاح الداخلية',
      'GENERAL_MAINTENANCE': 'صيانة عامة',
      'EMERGENCY_REPAIR': 'إصلاح طارئ'
    };
    return translations[type] || type.replace(/_/g, ' ');
  };

  // Arabic translations for maintenance status
  const getMaintenanceStatusLabel = (status: string) => {
    const translations: { [key: string]: string } = {
      'scheduled': 'مجدول',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'pending': 'معلق',
      'delayed': 'متأخر',
      'on_hold': 'في الانتظار'
    };
    return translations[status] || status;
  };

  return (
    <div dir="rtl" className="space-y-4">
      <FormField
        control={form.control}
        name="maintenance_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              نوع الصيانة
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => field.onChange(value)}
                value={field.value || 'none'}
                dir="rtl"
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-right">
                    اختر النوع
                  </SelectItem>
                  {Object.values(MaintenanceType).map((type) => (
                    <SelectItem key={type} value={type} className="text-right">
                      {getMaintenanceTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              الحالة
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => field.onChange(value)}
                value={field.value || 'none'}
                dir="rtl"
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-right">
                    اختر الحالة
                  </SelectItem>
                  {Object.values(MaintenanceStatus).map((status) => (
                    <SelectItem key={status} value={status} className="text-right">
                      {getMaintenanceStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              الفئة
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => field.onChange(value)}
                value={field.value || 'none'}
                dir="rtl"
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-right">
                    بلا
                  </SelectItem>
                  {filteredCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-right">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
