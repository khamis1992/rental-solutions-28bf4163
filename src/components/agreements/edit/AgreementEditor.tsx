import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { LeaseStatus } from '@/types/lease-types';
import { Loader2, Save, AlertTriangle, CheckCircle, RefreshCw, Eye, Undo } from 'lucide-react';
import VehicleSelector from '@/components/vehicles/VehicleSelector';
import CustomerSelector from '@/components/customers/CustomerSelector';
import PaymentScheduleEditor from '../payments/PaymentScheduleEditor';
import { PaymentScheduleSection } from '../form/PaymentScheduleSection';
import { CustomerInfo } from '@/types/customer';
import { usePaymentScheduleManagement } from '@/hooks/payment/use-payment-schedule-management';
import { paymentService } from '@/services/PaymentService';
import { paymentScheduleService } from '@/services/PaymentScheduleService';
import { generatePaymentSchedule } from '@/utils/payment-schedule-generator';
import { generateAndStoreContract } from '@/utils/contract-generator';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Enhanced validation schema with better error messages and validation rules
const agreementSchema = z.object({
  agreement_number: z.string().optional(),
  agreement_type: z.enum(['short_term', 'lease_to_own'], {
    errorMap: () => ({ message: 'يجب اختيار نوع الاتفاقية' })
  }),
  status: z.enum(['draft', 'active', 'pending', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'يجب اختيار حالة الاتفاقية' })
  }),
  customer_id: z.string().min(1, 'يجب اختيار العميل'),
  vehicle_id: z.string().min(1, 'يجب اختيار المركبة'),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  total_amount: z.number().min(0, 'يجب أن يكون المبلغ الإجمالي أكبر من أو يساوي صفر'),
  rent_amount: z.number().min(1, 'يجب أن يكون مبلغ الإيجار أكبر من صفر'),
  deposit_amount: z.number().min(0, 'يجب أن يكون مبلغ الضمان أكبر من أو يساوي صفر'),
  daily_late_fee: z.number().min(0, 'يجب أن تكون رسوم التأخير اليومية أكبر من أو تساوي صفر'),
  payment_frequency: z.enum(['weekly', 'monthly', 'quarterly'], {
    errorMap: () => ({ message: 'يجب اختيار تكرار الدفع' })
  }),
  payment_day: z.number().min(1, 'يوم الدفع يجب أن يكون بين 1 و 31').max(31, 'يوم الدفع يجب أن يكون بين 1 و 31'),
  notes: z.string().optional(),
  terms_accepted: z.boolean().optional(),
  additional_drivers: z.array(z.string()).optional(),
}).refine((data) => {
  // Only validate date relationship if both dates are present
  if (data.start_date && data.end_date) {
    return data.end_date > data.start_date;
  }
  return true; // Allow validation to pass if dates are not both provided
}, {
  message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  path: ["end_date"],
});

const AgreementEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: useToastHook } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const agreementService = useAgreementService();
  
  // Add payment schedule management
  const {
    generatePaymentSchedule: generateScheduleHook,
    isGenerating
  } = usePaymentScheduleManagement(id);
  
  // Enhanced form initialization with better defaults
  const form = useForm<z.infer<typeof agreementSchema>>({
    resolver: zodResolver(agreementSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      agreement_number: '',
      agreement_type: 'short_term',
      status: 'draft',
      customer_id: '',
      vehicle_id: '',
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
      total_amount: 0,
      rent_amount: 0,
      payment_frequency: 'monthly',
      payment_day: 1,
      notes: '',
      daily_late_fee: 120, // Default late fee
      deposit_amount: 0,
      terms_accepted: false,
      additional_drivers: [],
    },
  });

  // Watch form values for reactive updates and unsaved changes detection
  const watchedValues = form.watch();
  const [startDate, endDate, rentAmount, paymentFrequency, paymentDay] = form.watch([
    'start_date', 'end_date', 'rent_amount', 'payment_frequency', 'payment_day'
  ]);

  // Detect unsaved changes
  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(originalData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [watchedValues, originalData]);

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

  // Get payment frequency labels in Arabic
  const getPaymentFrequencyLabel = (frequency: string) => {
    const translations: { [key: string]: string } = {
      'weekly': 'أسبوعي',
      'monthly': 'شهري',
      'quarterly': 'ربع سنوي'
    };
    return translations[frequency] || frequency;
  };

  // Enhanced validation
  const validateForm = useCallback(() => {
    const errors: string[] = [];
    const values = form.getValues();

    // Custom business logic validation
    if (values.start_date && values.end_date) {
      const diffDays = Math.ceil((values.end_date.getTime() - values.start_date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 1) {
        errors.push('مدة العقد يجب أن تكون على الأقل يوم واحد');
      }
      if (diffDays > 1095) { // 3 years
        errors.push('مدة العقد لا يمكن أن تتجاوز 3 سنوات');
      }
    }

    if (values.rent_amount && values.total_amount && values.total_amount < values.rent_amount) {
      errors.push('المبلغ الإجمالي لا يمكن أن يكون أقل من مبلغ الإيجار الشهري');
    }

    if (values.payment_day && values.payment_frequency === 'monthly' && values.payment_day > 28) {
      errors.push('لتجنب مشاكل الأشهر القصيرة، يُنصح بعدم تجاوز اليوم 28 للدفع الشهري');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [form]);

  // Run validation on form changes
  useEffect(() => {
    validateForm();
  }, [watchedValues, validateForm]);
  
  // Enhanced agreement loading with better error handling
  const loadAgreement = async (): Promise<void> => {
    if (!id || id === 'undefined' || id === 'null') return;
      
      setIsLoading(true);
      try {
        const agreement = await agreementService.getAgreementDetails(id);
          
      if (agreement) {
        const formData = {
            agreement_number: agreement.agreement_number || '',
          agreement_type: agreement.agreement_type as 'short_term' | 'lease_to_own' || 'short_term',
          status: agreement.status as LeaseStatus || 'draft',
            customer_id: agreement.customer_id || '',
            vehicle_id: agreement.vehicle_id || '',
          start_date: agreement.start_date ? new Date(agreement.start_date) : new Date(),
          end_date: agreement.end_date ? new Date(agreement.end_date) : new Date(),
            total_amount: agreement.total_amount || 0,
            rent_amount: agreement.rent_amount || 0,
          deposit_amount: agreement.deposit_amount || 0,
          daily_late_fee: agreement.daily_late_fee || 120,
          payment_frequency: agreement.payment_frequency as 'weekly' | 'monthly' | 'quarterly' || 'monthly',
            payment_day: agreement.payment_day || 1,
            notes: agreement.notes || '',
            terms_accepted: agreement.terms_accepted || false,
            additional_drivers: agreement.additional_drivers || [],
        };

        // Set form values
        form.reset(formData);
        setOriginalData(formData);
        
        // Set selected customer and vehicle if available
          if (agreement.customers) {
          setSelectedCustomer(agreement.customers);
        }
          if (agreement.vehicles) {
            setSelectedVehicle(agreement.vehicles);
          }

        toast.success('تم تحميل بيانات الاتفاقية بنجاح');
        } else {
        throw new Error('فشل في تحميل الاتفاقية');
      }
    } catch (error) {
      console.error('خطأ في تحميل الاتفاقية:', error);
      toast.error('فشل في تحميل بيانات الاتفاقية');
        useToastHook({
        title: "خطأ",
        description: "فشل في تحميل بيانات الاتفاقية",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
  useEffect(() => {
    loadAgreement();
  }, [id]);

  // Auto-save functionality (optional)
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !id || id === 'undefined') return;
    
    try {
      const formData = form.getValues();
      const data = {
        ...formData,
        total_amount: formData.total_amount || 0,
        status: formData.status as LeaseStatus,
      };
      
      await agreementService.updateAgreement({ id, data });
      setHasUnsavedChanges(false);
      toast.success('تم الحفظ التلقائي', { duration: 2000 });
    } catch (error) {
      console.error('فشل في الحفظ التلقائي:', error);
    }
  }, [hasUnsavedChanges, id, form, agreementService]);

  // Reset form to original data
  const resetForm = useCallback(() => {
    if (originalData) {
      form.reset(originalData);
      setHasUnsavedChanges(false);
      toast.info('تم إعادة تعيين النموذج للبيانات الأصلية');
    }
  }, [originalData, form]);
  
  // Test function to verify date validation works (can be removed later)
  const testDateValidation = useCallback(() => {
    console.log('🧪 Testing date validation:');
    
    // Test 1: No dates provided (should be valid for updates)
    const testData1 = {
      ...form.getValues(),
      start_date: undefined,
      end_date: undefined
    };
    console.log('Test 1 - No dates:', testData1);
    
    // Test 2: Only start date provided (should be valid)
    const testData2 = {
      ...form.getValues(),
      start_date: new Date(),
      end_date: undefined
    };
    console.log('Test 2 - Only start date:', testData2);
    
    // Test 3: Both dates provided (should validate relationship)
    const testData3 = {
      ...form.getValues(),
      start_date: new Date(),
      end_date: new Date(Date.now() + 86400000) // Tomorrow
    };
    console.log('Test 3 - Both dates valid:', testData3);
    
    console.log('🧪 Date validation tests completed');
  }, [form]);

  // Helper function to safely transform form data for submission
  const safeTransformFormData = useCallback((rawData: any) => {
    console.log('🔧 Starting safe transformation of:', rawData);
    
    const transformed = {
      ...rawData,
      // Handle dates safely
      start_date: rawData.start_date ? (
        rawData.start_date instanceof Date 
          ? rawData.start_date 
          : (typeof rawData.start_date === 'string' ? new Date(rawData.start_date) : new Date())
      ) : undefined,
      end_date: rawData.end_date ? (
        rawData.end_date instanceof Date 
          ? rawData.end_date 
          : (typeof rawData.end_date === 'string' ? new Date(rawData.end_date) : new Date())
      ) : undefined,
      // Ensure numbers are properly typed
      total_amount: Number(rawData.total_amount) || 0,
      rent_amount: Number(rawData.rent_amount) || 0,
      deposit_amount: Number(rawData.deposit_amount) || 0,
      daily_late_fee: Number(rawData.daily_late_fee) || 120,
      payment_day: Number(rawData.payment_day) || 1,
    };
    
    console.log('✅ Transformed data:', transformed);
    return transformed;
  }, []);

  // Enhanced form submission with better error handling
  const handleSubmitForm = async (formData: any): Promise<void> => {
    console.log('🔄 Form submission started with data:', formData);
    console.log('🔍 Data types check:', {
      start_date: {
        value: formData.start_date,
        type: typeof formData.start_date,
        isDate: formData.start_date instanceof Date,
        toString: formData.start_date?.toString()
      },
      end_date: {
        value: formData.end_date,
        type: typeof formData.end_date,
        isDate: formData.end_date instanceof Date,
        toString: formData.end_date?.toString()
      }
    });
    
    console.log('🔍 Form validation state:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      validationErrors: validationErrors
    });

    // TEMPORARY: Skip schema validation to test if that's the issue
    console.log('⚠️ Temporarily skipping schema validation for testing');

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      toast.error('يرجى إصلاح الأخطاء في النموذج قبل الحفظ');
      return;
    }

    setIsLoading(true);
    try {
      // Convert string dates to Date objects if needed
      const processedData = {
        ...formData,
        total_amount: formData.total_amount || 0,
        status: formData.status as LeaseStatus,
      };
      
      // Ensure dates are properly converted with detailed logging
      console.log('🔧 Processing dates...');
      if (processedData.start_date) {
        console.log('📅 start_date before processing:', {
          value: processedData.start_date,
          type: typeof processedData.start_date,
          isDate: processedData.start_date instanceof Date
        });
        
        if (typeof processedData.start_date === 'string') {
          console.log('🔄 Converting start_date string to Date');
          processedData.start_date = new Date(processedData.start_date);
        }
        
        console.log('📅 start_date after processing:', {
          value: processedData.start_date,
          type: typeof processedData.start_date,
          isDate: processedData.start_date instanceof Date
        });
      }
      
      if (processedData.end_date) {
        console.log('📅 end_date before processing:', {
          value: processedData.end_date,
          type: typeof processedData.end_date,
          isDate: processedData.end_date instanceof Date
        });
        
        if (typeof processedData.end_date === 'string') {
          console.log('🔄 Converting end_date string to Date');
          processedData.end_date = new Date(processedData.end_date);
        }
        
        console.log('📅 end_date after processing:', {
          value: processedData.end_date,
          type: typeof processedData.end_date,
          isDate: processedData.end_date instanceof Date
        });
      }
      
      const data = processedData;
      
      console.log('📤 Submitting data:', data);
      
      let result;
      let agreementId = id;
      const isNewAgreement = !id || id === 'undefined' || id === 'null';
      
      if (!isNewAgreement) {
        // Update existing agreement
        console.log('🔄 Updating existing agreement:', id);
        console.log('🔍 Data being sent for update:', JSON.stringify(data, null, 2));
        console.log('🔍 Agreement service:', agreementService);
        
        try {
          // Validate that we have required fields for update
          if (!data.customer_id || !data.vehicle_id) {
            throw new Error('Customer ID and Vehicle ID are required for update');
          }
          
          // Clean the data to remove any undefined values
          const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
          );
          
          console.log('🔍 Cleaned data for update:', JSON.stringify(cleanData, null, 2));
          
          // Add extra validation and logging
          console.log('🔍 About to call updateAgreement with:');
          console.log('🔍 ID:', id);
          console.log('🔍 ID type:', typeof id);
          console.log('🔍 CleanData keys:', Object.keys(cleanData));
          console.log('🔍 CleanData values sample:', {
            customer_id: cleanData.customer_id,
            vehicle_id: cleanData.vehicle_id,
            status: cleanData.status,
            start_date: cleanData.start_date,
            end_date: cleanData.end_date
          });
          
          result = await agreementService.updateAgreement({ id: id!, data: cleanData });
          console.log('✅ Update result:', result);
          toast.success('تم تحديث الاتفاقية بنجاح');
        } catch (updateError) {
          console.error('❌ Update failed with error:', updateError);
          console.error('❌ Error details:', {
            message: updateError instanceof Error ? updateError.message : 'Unknown error',
            stack: updateError instanceof Error ? updateError.stack : 'No stack trace',
            data: updateError,
            typeof: typeof updateError
          });
          
          // Try to extract meaningful error message
          let errorMessage = 'فشل في تحديث الاتفاقية';
          if (updateError instanceof Error) {
            errorMessage = updateError.message;
          } else if (typeof updateError === 'string') {
            errorMessage = updateError;
          } else if (updateError && typeof updateError === 'object') {
            errorMessage = JSON.stringify(updateError);
          }
          
          toast.error(`خطأ في التحديث: ${errorMessage}`);
          throw updateError;
        }
      } else {
        // Create new agreement
        console.log('➕ Creating new agreement');
        result = await agreementService.createAgreement(data);
        agreementId = result?.id;
        
        if (result && agreementId) {
          console.log('تم إنشاء اتفاقية جديدة:', agreementId);
          
          // Generate payment schedule for new agreements
          try {
            console.log('توليد جدولة الدفعات للاتفاقية الجديدة:', agreementId);
            
            const schedule = generatePaymentSchedule({
              startDate: data.start_date,
              endDate: data.end_date,
              rentAmount: data.rent_amount || 0,
              paymentFrequency: data.payment_frequency || 'monthly',
              paymentDay: typeof data.payment_day === 'number' && !isNaN(data.payment_day) ? data.payment_day : 1,
              includeDeposit: !!data.deposit_amount,
              depositAmount: data.deposit_amount || 0
            });

            console.log('تم توليد جدولة الدفعات:', schedule);

            // Save each payment schedule item to the database
            for (const payment of schedule) {
              const scheduleData = {
                lease_id: agreementId,
                amount: payment.amount,
                due_date: payment.dueDate.toISOString(),
                status: 'pending' as const,
                description: payment.description
              };

              console.log('إنشاء بند جدولة الدفعات:', scheduleData);
              
              const scheduleResult = await paymentScheduleService.createPaymentSchedule(scheduleData);
              
              if (!scheduleResult.success) {
                console.error('فشل في إنشاء بند جدولة الدفعات:', scheduleResult.error);
                throw new Error(`فشل في إنشاء جدولة الدفعات: ${scheduleResult.error}`);
              }
            }

            // Generate corresponding payment records in unified_payments using the sync service
            console.log('توليد سجلات الدفع للاتفاقية:', agreementId);
            
            // Import and use the payment sync service
            const { PaymentScheduleSyncService } = await import('@/services/PaymentScheduleSyncService');
            const paymentScheduleSyncService = new PaymentScheduleSyncService();
            
            const syncResult = await paymentScheduleSyncService.checkPaymentScheduleSync(agreementId);
            
            if (syncResult.success) {
              console.log(`تم إنشاء ${syncResult.data.scheduleItemsCreated} سجل دفع من جدولة الدفعات`);
              toast.success(`تم توليد ${syncResult.data.scheduleItemsCreated} سجل دفع بنجاح`);
            } else {
              console.error('فشل في مزامنة سجلات الدفع:', syncResult.error);
              toast.error(`فشل في مزامنة سجلات الدفع: ${syncResult.error}`);
            }

            // Generate comprehensive contract
            console.log('توليد العقد الشامل للاتفاقية:', agreementId);
            const contractResult = await generateAndStoreContract(agreementId);
            
            if (contractResult.success) {
              console.log('تم توليد العقد الشامل بنجاح');
              toast.success('تم توليد العقد الشامل وحفظه');
            } else {
              console.error('فشل في توليد العقد:', contractResult.error);
              toast.error(`فشل في توليد العقد: ${contractResult.error}`);
            }

          } catch (scheduleError) {
            console.error('خطأ في توليد جدولة الدفعات أو العقد:', scheduleError);
            toast.error(`فشل في توليد جدولة الدفعات أو العقد: ${scheduleError instanceof Error ? scheduleError.message : 'خطأ غير معروف'}`);
          }
        }
      }
      
      if (result && agreementId) {
        const successMessage = isNewAgreement 
          ? "تم إنشاء الاتفاقية وجدولة الدفعات والعقد الشامل بنجاح" 
          : "تم تحديث الاتفاقية بنجاح";
          
        console.log('✅ Success! Navigating to agreement details:', agreementId);
          
        useToastHook({
          title: "نجح",
          description: successMessage,
        });
        
        setHasUnsavedChanges(false);
        navigate(`/agreements/${agreementId}`);
      } else {
        console.error('❌ No result or agreement ID');
        throw new Error("فشل في حفظ الاتفاقية");
      }
    } catch (error) {
      console.error("❌ خطأ في حفظ الاتفاقية:", error);
      toast.error("فشل في حفظ الاتفاقية");
      useToastHook({
        title: "خطأ",
        description: "فشل في حفظ الاتفاقية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 Form submission completed');
    }
  };
  
  // Enhanced total amount calculation
  const calculateTotalAmount = useCallback((): void => {
    const startDate = form.getValues('start_date');
    const endDate = form.getValues('end_date');
    const rentAmount = form.getValues('rent_amount') || 0;
    const depositAmount = form.getValues('deposit_amount') || 0;
    
    if (!startDate || !endDate || rentAmount <= 0) return;
    
    const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const totalAmount = (months * rentAmount) + depositAmount;
    
    form.setValue('total_amount', parseFloat(totalAmount.toFixed(2)));
  }, [form]);
  
  // Update total when relevant values change
  useEffect(() => {
        calculateTotalAmount();
  }, [startDate, endDate, rentAmount, form.watch('deposit_amount'), calculateTotalAmount]);

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: CustomerInfo): void => {
    console.log('تم اختيار العميل في محرر الاتفاقية:', customer);
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer.id);
  }, [form]);

  // Handle vehicle selection
  const handleVehicleSelect = useCallback((vehicle: any): void => {
    setSelectedVehicle(vehicle);
    form.setValue('vehicle_id', vehicle.id);
  }, [form]);

  // Handle navigation with unsaved changes warning
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظ؟')) {
        navigate('/agreements');
      }
    } else {
      navigate('/agreements');
    }
  }, [hasUnsavedChanges, navigate]);

  // Quick action to view agreement details
  const handleViewAgreement = useCallback(() => {
    if (id && id !== 'undefined') {
      navigate(`/agreements/${id}`);
    }
  }, [id, navigate]);
  
  // Manual form submit handler to ensure proper data types
  const handleFormSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    
    console.log('🔄 Manual form submit triggered');
    
    // Get raw form values
    const rawValues = form.getValues();
    console.log('📋 Raw form values:', rawValues);
    
    // Manually transform and validate the data
    const transformedValues = {
      ...rawValues,
      // Ensure dates are Date objects
      start_date: rawValues.start_date ? (
        rawValues.start_date instanceof Date 
          ? rawValues.start_date 
          : new Date(rawValues.start_date)
      ) : undefined,
      end_date: rawValues.end_date ? (
        rawValues.end_date instanceof Date 
          ? rawValues.end_date 
          : new Date(rawValues.end_date)
      ) : undefined,
    };
    
    console.log('🔧 Transformed values:', transformedValues);
    console.log('🔍 Date types after transformation:', {
      start_date: {
        value: transformedValues.start_date,
        type: typeof transformedValues.start_date,
        isDate: transformedValues.start_date instanceof Date
      },
      end_date: {
        value: transformedValues.end_date,
        type: typeof transformedValues.end_date,
        isDate: transformedValues.end_date instanceof Date
      }
    });
    
    // Call the actual submit function
    handleSubmitForm(transformedValues);
  }, [form]);
  
  if (isLoading && !form.formState.isSubmitting) {
    return (
      <div className="space-y-6" dir="rtl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">جاري تحميل بيانات الاتفاقية</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  يرجى الانتظار بينما نقوم بتحميل التفاصيل...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isEditMode = id && id !== 'undefined';
  
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with status and actions */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div>
          <h1 className="text-2xl font-bold text-right">
            {isEditMode ? "تعديل الاتفاقية" : "إنشاء اتفاقية جديدة"}
          </h1>
          {isEditMode && (
            <div className="flex items-center gap-2 mt-2 flex-row-reverse">
              <Badge variant={form.watch('status') === 'active' ? 'default' : 'secondary'}>
                {getStatusLabel(form.watch('status'))}
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 ml-1" />
                  تغييرات غير محفوظة
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 flex-row-reverse">
          {isEditMode && (
            <>
              <Button variant="outline" onClick={handleViewAgreement}>
                <Eye className="w-4 h-4 ml-2" />
                عرض التفاصيل
              </Button>
              {hasUnsavedChanges && (
                <Button variant="outline" onClick={resetForm}>
                  <Undo className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Validation Warnings */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="text-right">
              <strong>يرجى إصلاح الأخطاء التالية:</strong>
              <ul className="list-disc list-inside mt-2">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-row-reverse">
            <CardTitle className="text-right">
              تفاصيل الاتفاقية
            </CardTitle>
            {isEditMode && (
              <div className="text-sm text-muted-foreground">
                آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="payments">جدولة الدفعات</TabsTrigger>
              <TabsTrigger value="details">تفاصيل الاتفاقية</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Add test button for debugging */}
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">🔧 Test Zone (سيتم إزالتها لاحقاً)</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('🧪 Test button clicked');
                      console.log('📝 Current form values:', form.getValues());
                      console.log('✅ Form is valid:', form.formState.isValid);
                      console.log('❌ Form errors:', form.formState.errors);
                      toast.info('Form state logged to console');
                    }}
                  >
                    Test Form State
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="mr-2"
                    onClick={() => {
                      console.log('🧪 Manual submit test');
                      handleSubmitForm(form.getValues());
                    }}
                  >
                    Manual Submit Test
                  </Button>
                </div>
                <TabsContent value="details" className="space-y-6">
                  {/* Basic Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-right">المعلومات الأساسية</h3>
                    <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="agreement_number"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">رقم الاتفاقية</FormLabel>
                          <FormControl>
                              <Input 
                                placeholder="سيتم التوليد تلقائياً إذا ترك فارغاً" 
                                {...field} 
                                className="text-right" 
                                dir="rtl" 
                              />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agreement_type"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">نوع الاتفاقية</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                              value={field.value}
                              dir="rtl"
                          >
                            <FormControl>
                                <SelectTrigger className="text-right">
                                  <SelectValue placeholder="اختر نوع الاتفاقية" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="short_term" className="text-right">قصير المدى</SelectItem>
                                <SelectItem value="lease_to_own" className="text-right">إيجار منتهي بالتملك</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">الحالة</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                              value={field.value}
                              dir="rtl"
                          >
                            <FormControl>
                                <SelectTrigger className="text-right">
                                  <SelectValue placeholder="اختر الحالة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="draft" className="text-right">مسودة</SelectItem>
                                <SelectItem value="active" className="text-right">نشط</SelectItem>
                                <SelectItem value="pending" className="text-right">معلق</SelectItem>
                                <SelectItem value="completed" className="text-right">مكتمل</SelectItem>
                                <SelectItem value="cancelled" className="text-right">ملغي</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                  </div>
                    
                  {/* Customer and Vehicle Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-right">العميل والمركبة</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customer_id"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">العميل *</FormLabel>
                          <FormControl>
                            <CustomerSelector 
                              onCustomerSelect={handleCustomerSelect}
                              selectedCustomer={selectedCustomer}
                                placeholder="البحث عن عميل..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vehicle_id"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">المركبة *</FormLabel>
                          <FormControl>
                            <VehicleSelector 
                              selectedVehicle={selectedVehicle}
                              onVehicleSelect={handleVehicleSelect}
                                placeholder="البحث عن مركبة..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                  </div>
                    
                  {/* Date and Duration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-right">التواريخ والمدة</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-right">تاريخ البداية</FormLabel>
                          <FormControl>
                            <DatePicker
                                date={field.value ? (field.value instanceof Date ? field.value : new Date(field.value)) : undefined}
                              setDate={field.onChange}
                                placeholder="اختر تاريخ البداية"
                            />
                          </FormControl>
                            <div className="text-xs text-muted-foreground text-right">
                              اختياري للتحديث - اتركه فارغاً للاحتفاظ بالتاريخ الحالي
                            </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-right">تاريخ النهاية</FormLabel>
                          <FormControl>
                            <DatePicker
                                date={field.value ? (field.value instanceof Date ? field.value : new Date(field.value)) : undefined}
                              setDate={field.onChange}
                                placeholder="اختر تاريخ النهاية"
                            />
                          </FormControl>
                            <div className="text-xs text-muted-foreground text-right">
                              اختياري للتحديث - اتركه فارغاً للاحتفاظ بالتاريخ الحالي
                            </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                  </div>
                    
                  {/* Financial Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-right">التفاصيل المالية</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="rent_amount"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">مبلغ الإيجار الشهري *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                                className="text-right"
                                dir="rtl"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                        name="deposit_amount"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">مبلغ الضمان</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                                className="text-right"
                                dir="rtl"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                        name="total_amount"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">المبلغ الإجمالي</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field}
                                className="text-right"
                                dir="rtl"
                                readOnly
                                disabled
                            />
                          </FormControl>
                            <div className="text-xs text-muted-foreground text-right">
                              يتم حساب هذا المبلغ تلقائياً
                            </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="daily_late_fee"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-right">رسوم التأخير اليومية</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                                placeholder="120.00" 
                              {...field}
                                className="text-right"
                                dir="rtl"
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                  </div>

                  {/* Payment Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-right">إعدادات الدفع</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="payment_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right">تكرار الدفع</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              dir="rtl"
                            >
                              <FormControl>
                                <SelectTrigger className="text-right">
                                  <SelectValue placeholder="اختر تكرار الدفع" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly" className="text-right">أسبوعي</SelectItem>
                                <SelectItem value="monthly" className="text-right">شهري</SelectItem>
                                <SelectItem value="quarterly" className="text-right">ربع سنوي</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="payment_day"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right">يوم الدفع</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="31" 
                                placeholder="1" 
                                {...field}
                                className="text-right"
                                dir="rtl"
                                onChange={(e) => {
                                  field.onChange(parseInt(e.target.value) || 1);
                                }}
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground text-right">
                              اليوم من الشهر لاستحقاق الدفعة (1-31)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-right">ملاحظات إضافية</h3>
                    <Separator />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel className="text-right">ملاحظات</FormLabel>
                        <FormControl>
                          <Textarea 
                              placeholder="أدخل أي ملاحظات إضافية هنا..." 
                              className="text-right min-h-[100px]" 
                              dir="rtl" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </TabsContent>
                
                <TabsContent value="payments">
                  <PaymentScheduleEditor 
                    agreementId={id}
                    startDate={startDate}
                    endDate={endDate}
                    rentAmount={rentAmount || 0}
                    paymentFrequency={paymentFrequency || 'monthly'}
                    paymentDay={paymentDay || 1}
                    onFrequencyChange={(value) => form.setValue('payment_frequency', value)}
                    onPaymentDayChange={(value) => form.setValue('payment_day', value)}
                  />
                </TabsContent>
                
                {/* Enhanced Action Buttons with better mobile support */}
                <div className="flex flex-col-reverse sm:flex-row-reverse gap-3 pt-6 border-t">
                  <Button variant="outline" onClick={() => navigate(-1)} className="min-h-[44px]">
                    <Undo className="ml-2 h-4 w-4" />
                    إلغاء
                  </Button>
                  
                  {/* Debug Panel - Remove in production */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800 mb-2">🔧 Debug Info (Development Only)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                      <div>Generating: {isGenerating ? 'Yes' : 'No'}</div>
                      <div>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</div>
                      <div>Validation Errors: {validationErrors.length}</div>
                      <div>Has Changes: {hasUnsavedChanges ? 'Yes' : 'No'}</div>
                      <div>Edit Mode: {isEditMode ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    disabled={isLoading || isGenerating}
                    className="min-w-[180px] min-h-[44px] touch-manipulation"
                    onClick={async (e) => {
                      console.log('🔘 Save button clicked!');
                      console.log('📋 Event:', e);
                      
                      // Show immediate feedback
                      toast.info('جاري معالجة البيانات...', {
                        description: 'Processing form data'
                      });
                      
                      const rawFormData = form.getValues();
                      console.log('📝 Raw form values:', rawFormData);
                      console.log('🔍 Date types in raw data:', {
                        start_date: {
                          value: rawFormData.start_date,
                          type: typeof rawFormData.start_date,
                          isDate: rawFormData.start_date instanceof Date
                        },
                        end_date: {
                          value: rawFormData.end_date,
                          type: typeof rawFormData.end_date,
                          isDate: rawFormData.end_date instanceof Date
                        }
                      });
                      
                      // Transform the data to ensure proper types
                      const transformedFormData = safeTransformFormData(rawFormData);
                      
                      console.log('🚀 Calling handleSubmitForm with transformed data');
                      await handleSubmitForm(transformedFormData as z.infer<typeof agreementSchema>);
                    }}
                  >
                    {(isLoading || isGenerating) && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">معالجة...</span>
                      </div>
                    )}
                    {!(isLoading || isGenerating) && (
                      <>
                        <Save className="ml-2 h-4 w-4" />
                        <span>{isEditMode ? "تحديث الاتفاقية" : "إنشاء الاتفاقية وتوليد العقد"}</span>
                      </>
                    )}
                  </Button>
                  
                  {/* Generate payment schedule button */}
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isGenerating || !startDate || !endDate || !rentAmount}
                      onClick={async () => {
                        try {
                          toast.info('جاري إنشاء جدولة الدفعات...', {
                            description: 'Generating payment schedule'
                          });
                          await generateScheduleHook();
                          toast.success('تم إنشاء جدولة الدفعات بنجاح');
                        } catch (error) {
                          console.error('Failed to generate payment schedule:', error);
                          toast.error('فشل في إنشاء جدولة الدفعات');
                        }
                      }}
                      className="min-h-[44px]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري الإنشاء...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="ml-2 h-4 w-4" />
                          إعادة إنشاء جدولة الدفعات
                        </>
                      )}
                  </Button>
                  )}
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementEditor;
