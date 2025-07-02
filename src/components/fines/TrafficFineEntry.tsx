
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar } from 'lucide-react';
import { useTrafficFines, TrafficFineCreatePayload } from '@/hooks/use-traffic-fines';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

// Define the schema for traffic fine entry form
const trafficFineSchema = z.object({
  violationNumber: z.string().min(1, 'Violation number is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  violationDate: z.date({
    required_error: 'Violation date is required',
  }),
  fineAmount: z.coerce.number().min(0, 'Fine amount must be a positive number'),
  violationCharge: z.string().optional(),
  location: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'disputed']).default('pending'),
});

type TrafficFineFormData = z.infer<typeof trafficFineSchema>;

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const TrafficFineEntry: React.FC<TrafficFineEntryProps> = ({ onFineSaved }) => {
  const { createTrafficFine } = useTrafficFines();
  const { language } = useLanguage();

  const form = useForm<TrafficFineFormData>({
    resolver: zodResolver(trafficFineSchema),
    defaultValues: {
      violationNumber: `TF-${Math.floor(Math.random() * 10000)}`,
      licensePlate: '',
      violationDate: new Date(),
      fineAmount: 0,
      violationCharge: '',
      location: '',
      paymentStatus: 'pending',
    },
  });

  const onSubmit = async (data: TrafficFineFormData) => {
    try {
      await createTrafficFine.mutate(data as TrafficFineCreatePayload);
      toast.success(language === 'ar' ? 'تم إنشاء المخالفة المرورية بنجاح' : 'Traffic fine created successfully');
      form.reset();
      if (onFineSaved) {
        onFineSaved();
      }
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في إنشاء المخالفة المرورية' : 'Failed to create traffic fine', {
        description: error instanceof Error ? error.message : (language === 'ar' ? 'حدث خطأ غير معروف' : 'An unknown error occurred')
      });
    }
  };

  return (
    <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'تسجيل مخالفة مرورية جديدة' : 'Record New Traffic Fine'}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Alert dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
                {language === 'ar' ? 'مهم' : 'Important'}
              </AlertTitle>
              <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
                {language === 'ar' 
                  ? 'تأكد من إدخال لوحة الترخيص الصحيحة لضمان تخصيص العميل المناسب.'
                  : 'Make sure to enter the correct license plate to ensure proper customer assignment.'}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'رقم المخالفة' : 'Violation Number'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'ar' ? 'مثال: TF-12345' : 'e.g., TF-12345'}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'لوحة الترخيص *' : 'License Plate *'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'ar' ? 'مثال: أ ب ج 123' : 'e.g., ABC123'}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </FormControl>
                    <FormDescription className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' 
                        ? 'لوحة الترخيص مطلوبة لربط المخالفة بالمركبة'
                        : 'License plate is required to match the fine to a vehicle'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'تاريخ المخالفة' : 'Violation Date'}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full font-normal ${!field.value && "text-muted-foreground"} ${language === 'ar' ? 'text-right flex-row-reverse' : 'pl-3 text-left'}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{language === 'ar' ? 'اختيار التاريخ' : 'Pick a date'}</span>
                            )}
                            <Calendar className={`h-4 w-4 opacity-50 ${language === 'ar' ? 'mr-auto' : 'ml-auto'}`} />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fineAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'مبلغ المخالفة' : 'Fine Amount'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                        placeholder="0.00"
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'نوع المخالفة' : 'Violation Charge'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'ar' ? 'مثال: تجاوز السرعة' : 'e.g., Speeding'}
                        className={language === 'ar' ? 'text-right' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                      {language === 'ar' ? 'حالة الدفع' : 'Payment Status'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                          <SelectValue placeholder={language === 'ar' ? 'اختيار حالة الدفع' : 'Select payment status'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{language === 'ar' ? 'معلقة' : 'Pending'}</SelectItem>
                        <SelectItem value="paid">{language === 'ar' ? 'مدفوعة' : 'Paid'}</SelectItem>
                        <SelectItem value="disputed">{language === 'ar' ? 'متنازع عليها' : 'Disputed'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={language === 'ar' ? 'text-right' : ''}>
                    {language === 'ar' ? 'الموقع' : 'Location'}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder={language === 'ar' ? 'أدخل تفاصيل موقع المخالفة' : 'Enter violation location details'}
                      className={language === 'ar' ? 'text-right' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full">
              {language === 'ar' ? 'إنشاء مخالفة مرورية' : 'Create Traffic Fine'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default TrafficFineEntry;
