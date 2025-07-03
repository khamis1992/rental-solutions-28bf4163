import React, { memo, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, Customer } from "@/lib/validation-schemas/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

// Component Communication
import { 
  useComponentMessaging, 
  useDataSync,
  useComponentLifecycle 
} from '@/components/providers/CommunicationProvider';
import { EVENTS } from '@/utils/component-communication';
import { useFormOptimization } from '@/hooks/use-performance-optimization';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Customer) => void;
  isLoading?: boolean;
}

// Memoized select options to prevent recreations
const STATUS_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "blacklisted", label: "محظور" },
  { value: "pending_review", label: "قيد المراجعة" }
] as const;

// Memoized nationality options
const NATIONALITY_OPTIONS = [
  "قطري", "سعودي", "إماراتي", "كويتي", "بحريني", "عماني",
  "مصري", "أردني", "لبناني", "سوري", "عراقي", "يمني",
  "مغربي", "تونسي", "جزائري", "ليبي", "سوداني", "أخرى"
] as const;

// Memoized form field component
const MemoizedFormField = memo(({ 
  control, 
  name, 
  label, 
  placeholder, 
  type = "text",
  description,
  options,
  isTextarea = false
}: {
  control: any;
  name: keyof Customer;
  label: string;
  placeholder: string;
  type?: string;
  description?: string;
  options?: readonly { value: string; label: string }[];
  isTextarea?: boolean;
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-right">{label}</FormLabel>
        <FormControl>
          {options ? (
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : isTextarea ? (
            <Textarea 
              placeholder={placeholder} 
              {...field} 
              value={field.value || ''} 
              className="text-right"
              dir="rtl"
            />
          ) : (
            <Input 
              type={type}
              placeholder={placeholder} 
              {...field} 
              value={field.value || ''} 
              className="text-right"
              dir="rtl"
            />
          )}
        </FormControl>
        {description && (
          <FormDescription className="text-right">
            {description}
          </FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
));

MemoizedFormField.displayName = 'MemoizedFormField';

export const CustomerForm = memo(({ initialData, onSubmit, isLoading }: CustomerFormProps) => {
  const navigate = useNavigate();
  const formInitialized = useRef(false);
  
  // Memoized default values
  const defaultValues = useMemo((): Partial<Customer> => ({
    full_name: "",
    email: "",
    phone: "",
    address: "الدوحة - قطر",
    driver_license: "",
    nationality: "",
    notes: "",
    status: "active" as const,
  }), []);

  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  // Memoized form reset logic
  const resetFormWithInitialData = useCallback(() => {
    if (initialData && Object.keys(initialData).length > 0 && !formInitialized.current) {
      const safeInitialData: Partial<Customer> = {
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        driver_license: initialData.driver_license || "",
        nationality: initialData.nationality || "",
        notes: initialData.notes || "",
        status: initialData.status || "active",
      };
      
      form.reset(safeInitialData);
      formInitialized.current = true;
    }
  }, [initialData, form]);

  useEffect(() => {
    resetFormWithInitialData();
  }, [resetFormWithInitialData]);

  // Memoized submit handler
  const handleSubmit = useCallback((data: Customer) => {
    onSubmit(data);
  }, [onSubmit]);

  // Memoized cancel handler
  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 max-w-2xl" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MemoizedFormField
            control={form.control}
            name="full_name"
            label="الاسم الكامل"
            placeholder="أدخل الاسم الكامل للعميل"
          />
          
          <MemoizedFormField
            control={form.control}
            name="email"
            label="البريد الإلكتروني"
            placeholder="customer@example.com"
            type="email"
          />
          
          <MemoizedFormField
            control={form.control}
            name="phone"
            label="رقم الهاتف"
            placeholder="33123456"
            description="أدخل 8 أرقام فقط. سيتم إضافة رمز الدولة +974 تلقائياً"
          />
          
          <MemoizedFormField
            control={form.control}
            name="driver_license"
            label="رخصة القيادة"
            placeholder="رقم رخصة القيادة"
          />
          
          <MemoizedFormField
            control={form.control}
            name="nationality"
            label="الجنسية"
            placeholder="اختر الجنسية"
          />
          
          <MemoizedFormField
            control={form.control}
            name="status"
            label="الحالة"
            placeholder="اختر حالة العميل"
            options={STATUS_OPTIONS}
            description="الحالة الحالية للعميل في النظام"
          />
        </div>
          
        <MemoizedFormField
          control={form.control}
          name="address"
          label="العنوان"
          placeholder="عنوان العميل"
          isTextarea={true}
        />
        
        <MemoizedFormField
          control={form.control}
          name="notes"
          label="ملاحظات"
          placeholder="ملاحظات إضافية حول العميل"
          isTextarea={true}
        />

        {/* Action buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "جاري الحفظ..." : "حفظ العميل"}
          </Button>
        </div>
      </form>
    </Form>
  );
});

CustomerForm.displayName = 'CustomerForm';
