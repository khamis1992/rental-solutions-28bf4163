
import React, { useState } from 'react';
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

// Schema for form validation
const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  license_plate: z.string().min(1, 'License plate is required'),
  vin: z.string().min(1, 'VIN is required'),
  status: z.enum(['available', 'rented', 'maintenance', 'retired'] as const),
  color: z.string().optional(),
  mileage: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  insurance_company: z.string().optional(),
  rent_amount: z.coerce.number().min(0).optional(),
  vehicle_type_id: z.string().optional(),
});

// Make sure the schema matches VehicleFormData
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
  // Setup form with validation
  const form = useForm<VehicleFormSchema>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: initialData?.make || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      license_plate: initialData?.licensePlate || initialData?.license_plate || '',
      vin: initialData?.vin || '',
      status: (initialData?.status as VehicleStatus) || 'available',
      color: initialData?.color || '',
      mileage: initialData?.mileage || 0,
      location: initialData?.location || '',
      description: initialData?.notes || initialData?.description || '',
      insurance_company: initialData?.insurance_company || '',
      rent_amount: initialData?.dailyRate || initialData?.rent_amount || 0,
      vehicle_type_id: initialData?.vehicle_type_id || '',
    },
  });

  // Get vehicle types for the dropdown
  const { useVehicleTypes } = useVehicles();
  const { data: vehicleTypes, isLoading: isLoadingTypes } = useVehicleTypes();
  
  // State for the selected image file
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleFormSubmit = (formValues: VehicleFormSchema) => {
    // Combine form data with selected image and ensure all required fields are present
    const formData: VehicleFormData = {
      make: formValues.make,
      model: formValues.model,
      year: formValues.year,
      license_plate: formValues.license_plate,
      vin: formValues.vin,
      status: formValues.status,
      color: formValues.color,
      mileage: formValues.mileage,
      location: formValues.location,
      description: formValues.description,
      insurance_company: formValues.insurance_company,
      rent_amount: formValues.rent_amount,
      vehicle_type_id: formValues.vehicle_type_id,
      image: selectedImage,
    };
    
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            {/* Vehicle Image */}
            <div className="mb-6">
              <FormLabel className="mb-2 block">Vehicle Image</FormLabel>
              <VehicleImageUpload 
                onImageSelected={setSelectedImage}
                initialImageUrl={initialData?.imageUrl || initialData?.image_url}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
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
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Camry" {...field} />
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
                    <FormLabel>Year</FormLabel>
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
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-123" {...field} />
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
                    <FormLabel>VIN</FormLabel>
                    <FormControl>
                      <Input placeholder="1HGCM82633A123456" {...field} />
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
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
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
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="Silver" {...field} />
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
                    <FormLabel>Mileage</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Office" {...field} />
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
                    <FormLabel>Insurance Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Insurance Provider" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rent_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {vehicleTypes && vehicleTypes.map((type: VehicleType) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.size})
                          </SelectItem>
                        ))}
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
                  <FormLabel>Description/Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information about the vehicle" 
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
              Cancel
            </CustomButton>
            
            <CustomButton type="submit" disabled={isLoading} glossy>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Vehicle' : 'Add Vehicle'}
            </CustomButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default VehicleForm;
