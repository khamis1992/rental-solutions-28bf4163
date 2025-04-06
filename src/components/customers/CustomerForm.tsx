
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from 'react-i18next';
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
import { useTranslation as useAppTranslation } from "@/contexts/TranslationContext";
import { getDirectionalClasses } from "@/utils/rtl-utils";

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Customer) => void;
  isLoading?: boolean;
}

export function CustomerForm({ initialData, onSubmit, isLoading }: CustomerFormProps) {
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();
  const navigate = useNavigate();
  const formInitialized = useRef(false);
  
  const defaultValues: Partial<Customer> = {
    full_name: "",
    email: "",
    phone: "",
    address: "",
    driver_license: "",
    nationality: "",
    notes: "",
    status: "active" as const,
  };

  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  useEffect(() => {
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
      
      console.log("Resetting form with initialData:", safeInitialData);
      form.reset(safeInitialData);
      formInitialized.current = true;
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 max-w-2xl ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('customers.name')} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('customers.emailAddress')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="customer@example.com" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('customers.phoneNumber')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('common.phone')} {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  {t('customers.phoneNumber')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="driver_license"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('customers.driverLicense')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('customers.license')} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.nationality')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('common.nationality')} {...field} value={field.value || ''} />
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
                <FormLabel>{t('common.status')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'active'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('customers.selectStatus')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent align={isRTL ? "end" : "start"}>
                    <SelectItem value="active">{t('customers.status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('customers.status.inactive')}</SelectItem>
                    <SelectItem value="blacklisted">{t('customers.status.blacklisted')}</SelectItem>
                    <SelectItem value="pending_review">{t('customers.status.pendingreview')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('common.status')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
          
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customers.address')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('customers.address')} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('customers.additionalNotes')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('customers.additionalNotes')} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className={`flex items-center ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'} space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/customers")}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : initialData ? t('customers.editCustomer') : t('customers.addCustomer')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
