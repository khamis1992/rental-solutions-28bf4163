import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Vehicle, VehicleStatus, VehicleFormData, VehicleType } from '@/types/vehicle';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/custom-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';
import VehicleImageUpload from './VehicleImageUpload';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@/components/ui/date-picker';
import { format, isValid } from 'date-fns';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';

// Create a more robust schema with better validations
const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900, 'Year must be after 1900').max(new Date().getFullYear() + 1, `Year cannot be after ${new Date().getFullYear() + 1}`),
  license_plate: z.string().min(1, 'License plate is required'),
  vin: z.string().min(1, 'VIN is required'),
  status: z.enum(['available', 'rented', 'reserved', 'maintenance', 'police_station', 'accident', 'stolen', 'retired'] as const, {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  color: z.string().optional(),
  mileage: z.coerce.number().min(0, 'Mileage must be a positive number').optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  insurance_company: z.string().optional(),
  insurance_expiry: z.union([z.string(), z.null()]).optional(),
  rent_amount: z.coerce.number().min(0, 'Rent amount must be a positive number').optional(),
  vehicle_type_id: z.union([z.string(), z.literal('none')]).optional(),
});

type VehicleFormSchema = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  initialData?: Partial<Vehicle>;
  onSubmit: (data: VehicleFormData) => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  isEditMode = false,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useContextTranslation();
  
  // Fixed default values to prevent undefined issues
  const defaultValues = {
    make: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    license_plate: initialData?.license_plate || '',
    vin: initialData?.vin || '',
    status: (initialData?.status as VehicleStatus) || 'available',
    color: initialData?.color || '',
    mileage: initialData?.mileage || 0,
    location: initialData?.location || '',
    description: initialData?.description || initialData?.notes || '',
    insurance_company: initialData?.insurance_company || '',
    insurance_expiry: initialData?.insurance_expiry || '',
    rent_amount: initialData?.rent_amount || initialData?.dailyRate || 0,
    vehicle_type_id: initialData?.vehicle_type_id || ''
  };

  console.log('VehicleForm initialData:', initialData);
  console.log('VehicleForm defaultValues:', defaultValues);

  const form = useForm<VehicleFormSchema>({
    resolver: zodResolver(vehicleSchema),
    defaultValues,
    mode: 'onBlur' // Validate on blur for better UX
  });

  const { useVehicleTypes } = useVehicles();
  const { data: vehicleTypes, isLoading: isLoadingTypes } = useVehicleTypes();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Re-initialize the form when initial data changes
  useEffect(() => {
    if (initialData) {
      const values: any = { ...defaultValues };
      // Update with latest initialData
      if (initialData.make) values.make = initialData.make;
      if (initialData.model) values.model = initialData.model;
      if (initialData.year) values.year = initialData.year;
      if (initialData.license_plate) 
        values.license_plate = initialData.license_plate;
      if (initialData.vin) values.vin = initialData.vin;
      if (initialData.status) values.status = initialData.status;
      if (initialData.color) values.color = initialData.color;
      if (initialData.mileage !== undefined) values.mileage = initialData.mileage;
      if (initialData.location) values.location = initialData.location;
      if (initialData.description || initialData.notes) 
        values.description = initialData.description || initialData.notes || '';
      if (initialData.insurance_company) values.insurance_company = initialData.insurance_company;
      if (initialData.insurance_expiry) values.insurance_expiry = initialData.insurance_expiry;
      if (initialData.rent_amount || initialData.dailyRate) 
        values.rent_amount = initialData.rent_amount || initialData.dailyRate || 0;
      if (initialData.vehicle_type_id) values.vehicle_type_id = initialData.vehicle_type_id;
      
      console.log('Resetting form with values:', values);
      form.reset(values);
    }
  }, [initialData, form]);

  const handleFormSubmit = (formValues: VehicleFormSchema) => {
    try {
      console.log('Form values before submission:', formValues);
      
      const formData: VehicleFormData = {
        make: formValues.make,
        model: formValues.model,
        year: formValues.year,
        license_plate: formValues.license_plate,
        vin: formValues.vin,
        status: formValues.status,
        color: formValues.color || undefined,
        mileage: formValues.mileage,
        location: formValues.location || undefined,
        description: formValues.description || undefined,
        insurance_company: formValues.insurance_company || undefined,
        insurance_expiry: formValues.insurance_expiry || undefined,
        rent_amount: formValues.rent_amount,
        vehicle_type_id: formValues.vehicle_type_id === 'none' ? undefined : formValues.vehicle_type_id,
        image: selectedImage,
      };
      
      console.log('Processed form data for submission:', formData);
      onSubmit(formData);
    } catch (error) {
      console.error('Error processing form data:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? t('vehicles.editVehicle') : t('vehicles.addNewVehicle')}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <div className="mb-6">
              <FormLabel className="mb-2 block">{t('vehicles.vehicleImage')}</FormLabel>
              <VehicleImageUpload 
                onImageSelected={setSelectedImage}
                initialImageUrl={initialData?.image_url}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.make')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.makePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.model')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.modelPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.year')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.licensePlate')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.licensePlatePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.vin')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.vinPlaceholder')} {...field} />
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('vehicles.selectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">{t('vehicles.status.available')}</SelectItem>
                        <SelectItem value="rented">{t('vehicles.status.rented')}</SelectItem>
                        <SelectItem value="reserved">{t('vehicles.status.reserved')}</SelectItem>
                        <SelectItem value="maintenance">{t('vehicles.status.maintenance')}</SelectItem>
                        <SelectItem value="police_station">{t('vehicles.status.policeStation')}</SelectItem>
                        <SelectItem value="accident">{t('vehicles.status.accident')}</SelectItem>
                        <SelectItem value="stolen">{t('vehicles.status.stolen')}</SelectItem>
                        <SelectItem value="retired">{t('vehicles.status.retired')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.color')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.colorPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.mileage')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseInt(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.location')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.locationPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="insurance_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.insuranceCompany')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.insuranceCompanyPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="insurance_expiry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('vehicles.insuranceExpiryDate')}</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => {
                        console.log('Selected date:', date);
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rent_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.dailyRate')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicle_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.vehicleType')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('vehicles.selectVehicleType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('common.none')}</SelectItem>
                        {isLoadingTypes ? (
                          <SelectItem value="loading">{t('common.loading')}</SelectItem>
                        ) : (
                          vehicleTypes && vehicleTypes.map((type) => (
                            type.id ? (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name} ({type.size})
                              </SelectItem>
                            ) : null
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('vehicles.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('vehicles.descriptionPlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              {t('common.cancel')}
            </CustomButton>
            
            <CustomButton type="submit" disabled={isLoading} glossy>
              {isLoading && <Loader2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />}
              {isEditMode ? t('vehicles.updateVehicle') : t('vehicles.addVehicle')}
            </CustomButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default VehicleForm;
