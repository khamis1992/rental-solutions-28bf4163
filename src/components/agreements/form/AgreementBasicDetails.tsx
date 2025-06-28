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
}

export const AgreementBasicDetails: React.FC<AgreementBasicDetailsProps> = ({
  form,
  isEdit = false,
  onVehicleChange,
  onCustomerChange
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const handleCustomerSelect = (customer: CustomerInfo) => {
    console.log('تم اختيار العميل:', customer);
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer.id);
    onCustomerChange?.(customer);
  };

  const handleVehicleSelect = (vehicle: any) => {
    console.log('تم اختيار المركبة:', vehicle);
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
      'draft': 'مسودة',
      'active': 'نشط',
      'pending': 'معلق',
      'completed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    return translations[status] || status;
  };

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

          <FormField
            control={form.control}
            name="agreement_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">نوع الاتفاقية</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                  <FormControl>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر نوع الاتفاقية" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent align="start">
                    <SelectItem value="short_term" className="text-right">قصير المدى</SelectItem>
                    <SelectItem value="lease_to_own" className="text-right">إيجار منتهي بالتملك</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">الحالة</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                  <FormControl>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent align="start">
                    <SelectItem value="draft" className="text-right">مسودة</SelectItem>
                    <SelectItem value="active" className="text-right">نشط</SelectItem>
                    <SelectItem value="pending" className="text-right">معلق</SelectItem>
                    <SelectItem value="completed" className="text-right">مكتمل</SelectItem>
                    <SelectItem value="cancelled" className="text-right">ملغي</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />

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
                        الهاتف: {selectedCustomer.phone_number}
                      </span>
                    )}
                  </div>
                )}
              </FormItem>
            )}
          />

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
                <FormLabel className="text-right">تاريخ البداية</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    setDate={(date) => {
                      if (date) {
                        field.onChange(date.toISOString().split('T')[0]);
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
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-right">تاريخ النهاية</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    setDate={(date) => {
                      if (date) {
                        field.onChange(date.toISOString().split('T')[0]);
                      } else {
                        field.onChange('');
                      }
                    }}
                    placeholder="اختر تاريخ النهاية"
                    className="text-right"
                  />
                </FormControl>
                <FormMessage className="text-right" />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
