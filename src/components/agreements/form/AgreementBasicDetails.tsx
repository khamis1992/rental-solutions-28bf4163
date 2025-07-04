import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import CustomerSelector from '@/components/customers/CustomerSelector';
import VehicleSelector from '@/components/vehicles/VehicleSelector';
import { CustomerInfo } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface AgreementBasicDetailsProps {
  form: UseFormReturn<any>;
  isEdit?: boolean;
  onVehicleChange?: (vehicle: any) => void;
  onCustomerChange?: (customer: CustomerInfo) => void;
  hideCustomerSelector?: boolean; // إخفاء قسم اختيار العميل عند وجود بيانات مُحددة مسبقاً
  hideEntireSection?: boolean; // إخفاء القسم بالكامل عند مسح العقد (جميع البيانات تُعبأ تلقائياً)
}

export const AgreementBasicDetails: React.FC<AgreementBasicDetailsProps> = ({
  form,
  isEdit = false,
  onVehicleChange,
  onCustomerChange,
  hideCustomerSelector = false,
  hideEntireSection = false
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  // تعيين القيم الافتراضية للحقول المخفية
  useEffect(() => {
    form.setValue('agreement_type', 'lease_to_own'); // دائماً إيجار منتهي بالتملك
    form.setValue('status', 'active'); // دائماً نشط
  }, [form]);

  const handleCustomerSelect = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer.id);
    onCustomerChange?.(customer);
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    form.setValue('vehicle_id', vehicle.id);
    onVehicleChange?.(vehicle);
  };

  // Get agreement type labels in Arabic
  const getAgreementTypeLabel = (type: string) => {
    const translations: { [key: string]: string } = {
      'short_term': 'قصير المدى',
      'lease_to_own': 'إيجار منتهي بالتملك'
    };
    return translations[type] || type;
  };

  // Get status labels in Arabic
  const getStatusLabel = (status: string) => {
    const translations: { [key: string]: string } = {
      'active': 'نشط',
      'closed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    return translations[status] || status;
  };

  // إخفاء القسم بالكامل عند مسح العقد
  if (hideEntireSection) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">التفاصيل الأساسية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">
        {/* إرشادات للمستخدم */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-right">
            يرجى ملء جميع المعلومات المطلوبة لإنشاء اتفاقية الإيجار. ستتم إضافة جدولة الدفعات تلقائياً بناءً على المعلومات المدخلة.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="agreement_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">رقم الاتفاقية</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="سيتم التوليد تلقائياً..." 
                    {...field} 
                    className="text-right bg-gray-50"
                    dir="rtl"
                    readOnly
                    disabled
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  يتم توليد رقم الاتفاقية تلقائياً بتنسيق AGR_LTO###
                </div>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          {/* نوع الاتفاقية محدد تلقائياً: إيجار منتهي بالتملك */}
          {/* تم إخفاء هذا الحقل وتعيينه تلقائياً */}

          {/* الحالة محددة تلقائياً: نشط */}
          {/* تم إخفاء هذا الحقل وتعيينه تلقائياً */}

          {/* إخفاء قسم العميل عند وجود بيانات مُحددة مسبقاً */}
          {!hideCustomerSelector && (
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right flex items-center gap-2">
                    العميل
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="w-full">
                    <CustomerSelector
                      selectedCustomer={selectedCustomer}
                      onCustomerSelect={handleCustomerSelect}
                      placeholder="البحث عن عميل..."
                        inputClassName="text-right"
                    />
                    </div>
                  </FormControl>
                  <FormMessage className="text-right" />
                  {selectedCustomer && (
                    <div className="text-sm text-muted-foreground text-right bg-green-50 p-2 rounded">
                      تم اختيار العميل: <span className="font-medium">{selectedCustomer.full_name}</span>
                      {selectedCustomer.phone_number && (
                        <span className="block ltr-text" dir="ltr">
                          الهاتف: <span className="phone-number-ltr" dir="ltr">{selectedCustomer.phone_number}</span>
                        </span>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="vehicle_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right flex items-center gap-2">
                  المركبة
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="w-full">
                  <VehicleSelector
                    selectedVehicle={selectedVehicle}
                    onVehicleSelect={handleVehicleSelect}
                    placeholder="البحث عن مركبة..."
                    excludeMaintenanceVehicles={true}
                  />
                  </div>
                </FormControl>
                <FormMessage className="text-right" />
                {selectedVehicle && (
                  <div className="text-sm text-muted-foreground text-right bg-blue-50 p-2 rounded">
                    تم اختيار المركبة: <span className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</span>
                    <span className="block">
                      رقم اللوحة: {selectedVehicle.license_plate}
                    </span>
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">تاريخ بداية العقد</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    setDate={(date) => {
                      if (date) {
                        const startDate = date.toISOString().split('T')[0];
                        field.onChange(startDate);
                        
                        // حساب تاريخ النهاية تلقائياً بناءً على مدة العقد
                        const durationMonths = form.getValues('duration_months') || 12;
                        const endDate = new Date(date);
                        endDate.setMonth(endDate.getMonth() + durationMonths);
                        form.setValue('end_date', endDate.toISOString().split('T')[0]);
                      } else {
                        field.onChange('');
                      }
                    }}
                    placeholder="اختر تاريخ البداية"
                    className="text-right"
                  />
                </FormControl>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">مدة العقد (بالأشهر)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="20"
                    {...field}
                    className="text-right"
                    dir="rtl"
                    onChange={(e) => {
                      const months = parseInt(e.target.value) || 0;
                      field.onChange(months);
                      
                      // حساب تاريخ النهاية تلقائياً
                      const startDate = form.getValues('start_date');
                      if (startDate && months > 0) {
                        const start = new Date(startDate);
                        const end = new Date(start);
                        end.setMonth(end.getMonth() + months);
                        form.setValue('end_date', end.toISOString().split('T')[0]);
                      }
                    }}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  أدخل عدد الأشهر (مثال: 20 شهر) - سيتم حساب تاريخ النهاية تلقائياً
                </div>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">تاريخ نهاية العقد (محسوب تلقائياً)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="text-right bg-gray-50" 
                    dir="rtl"
                    readOnly
                    disabled
                    placeholder="سيتم الحساب تلقائياً"
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  يتم حساب تاريخ النهاية تلقائياً بناءً على تاريخ البداية ومدة العقد
                </div>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
