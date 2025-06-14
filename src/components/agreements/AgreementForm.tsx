import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Agreement } from '@/types/agreement';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { agreementSchema } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { AgreementBasicDetails } from './form/AgreementBasicDetails';
import { AgreementContractTerms } from './form/AgreementContractTerms';
import { VehicleDetailsCard } from './form/VehicleDetailsCard';
import CustomerSection from './CustomerSection';
import { CustomerInfo } from '@/types/customer';
import { agreementPaymentService } from '@/services/AgreementPaymentService';

interface AgreementFormProps {
  initialData?: Agreement;
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
}

const AgreementForm = ({
  initialData,
  onSubmit,
  isSubmitting = false
}: AgreementFormProps) => {
  const [termsAccepted, setTermsAccepted] = useState(initialData?.terms_accepted || false);
  const [selectedVehicle, setSelectedVehicle] = useState(null as any);
  const [selectedCustomer, setSelectedCustomer] = useState(null as CustomerInfo | null);

  // Initialize form with default values, ensuring proper date handling
  const form = useForm<Agreement>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      ...initialData || {
        customer_id: '',
        vehicle_id: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        status: 'draft',
        agreement_number: '',
        total_amount: 0,
        deposit_amount: 0,
        rent_amount: 0,
        daily_late_fee: 120,
        notes: '',
        additional_drivers: [],
        payment_frequency: 'monthly',
        payment_day: 1,
      }
    },
  });

  // Set initial selections if editing
  useEffect(() => {
    if (initialData?.customers) {
      setSelectedCustomer(initialData.customers);
    }
    if (initialData?.vehicles) {
      setSelectedVehicle(initialData.vehicles);
    }
  }, [initialData]);

  // Handle vehicle selection changes
  const handleVehicleChange = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    form.setValue('vehicle_id', vehicle?.id || '');
  };

  // Handle customer selection changes
  const handleCustomerChange = (customer: CustomerInfo) => {
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer?.id || '');
  };

  // Calculate total amount based on start/end dates and rent amount
  const calculateTotalAmount = () => {
    const startDate = form.getValues('start_date');
    const endDate = form.getValues('end_date');
    const rentAmount = form.getValues('rent_amount') || 0;

    if (startDate && endDate && rentAmount > 0) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = diffDays / 30; // Approximate
      const totalAmount = months * rentAmount;
      
      form.setValue('total_amount', parseFloat(totalAmount.toFixed(2)));
    }
  };

  // Recalculate total when relevant fields change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'start_date' || name === 'end_date' || name === 'rent_amount') {
        calculateTotalAmount();
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (data: Agreement) => {
    try {
      if (!termsAccepted) {
        toast.error("يجب موافقة على الشروط والأحكام");
        return;
      }
      
      const finalData = {
        ...data,
        terms_accepted: termsAccepted,
        id: initialData?.id
      };
      
      console.log('إرسال بيانات الاتفاقية:', finalData);
      
      // Call the parent onSubmit function first
      await onSubmit(finalData);

      // Only generate payment schedule for NEW agreements (not edits)
      if (!initialData?.id && finalData.id) {
        console.log('إنشاء جدولة الدفعات للاتفاقية الجديدة:', finalData.id);
        
        try {
          const result = await agreementPaymentService.createPaymentScheduleForAgreement(finalData);
          
          if (result.success) {
            console.log(`تم إنشاء جدولة الدفعات بنجاح: ${result.scheduleCount} بند جدولة، ${result.paymentCount} سجل دفع`);
            toast.success(`تم إنشاء الاتفاقية وجدولة الدفعات بنجاح (${result.paymentCount} دفعة)`);
          } else {
            console.error('فشل في إنشاء جدولة الدفعات:', result.error);
            toast.warning(`تم إنشاء الاتفاقية ولكن فشل في إنشاء جدولة الدفعات: ${result.error}`);
          }
        } catch (scheduleError) {
          console.error('خطأ في إنشاء جدولة الدفعات:', scheduleError);
          toast.warning(`تم إنشاء الاتفاقية ولكن فشل في إنشاء جدولة الدفعات: ${scheduleError instanceof Error ? scheduleError.message : 'خطأ غير معروف'}`);
        }
      }
    } catch (error) {
      console.error("خطأ في handleSubmit:", error);
      toast.error("فشل في حفظ الاتفاقية");
    }
  };

  const isEdit = !!initialData?.id;

  return (
    <div dir="rtl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-10">
          <AgreementBasicDetails 
            form={form} 
            isEdit={isEdit} 
            onVehicleChange={handleVehicleChange}
            onCustomerChange={handleCustomerChange} 
          />
          
          {selectedCustomer && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-right">معلومات العميل</h3>
              <CustomerSection customer={selectedCustomer} />
            </div>
          )}

          {selectedVehicle && (
            <VehicleDetailsCard vehicle={selectedVehicle} />
          )}

          <AgreementContractTerms 
            form={form} 
            termsAccepted={termsAccepted} 
            setTermsAccepted={setTermsAccepted} 
          />

          <div className="flex justify-start space-x-2 flex-row-reverse gap-2">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-primary" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ الاتفاقية"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AgreementForm;
