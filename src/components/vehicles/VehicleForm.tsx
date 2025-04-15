
import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import VehicleImageUpload from './VehicleImageUpload';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useVehicles } from '@/hooks/use-vehicles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useVehicleTypes } from '@/hooks/use-vehicle-types';

// Define a schema for vehicle form data using Zod
const vehicleFormSchema = z.object({
  make: z.string().min(2, {
    message: "Make must be at least 2 characters.",
  }),
  model: z.string().min(2, {
    message: "Model must be at least 2 characters.",
  }),
  year: z.number().min(1900).max(2050, {
    message: "Please enter a valid year",
  }),
  vin: z.string().min(5, {
    message: "VIN must be at least 5 characters.",
  }),
  license_plate: z.string().min(3, {
    message: "License plate must be at least 3 characters.",
  }),
  color: z.string().min(3, {
    message: "Color must be at least 3 characters.",
  }),
  insurance_company: z.string().min(2, {
    message: "Insurance company must be at least 2 characters.",
  }),
  insurance_policy: z.string().min(5, {
    message: "Insurance policy must be at least 5 characters.",
  }),
  insurance_expiry: z.string(),
  documents_verified: z.boolean().default(false),
  image_url: z.string().optional(),
  vehicle_type_id: z.string().optional(),
  id: z.string().optional(),
});

export interface VehicleFormData extends z.infer<typeof vehicleFormSchema> {}

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => void;
  vehicle?: Partial<VehicleFormData>;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, vehicle = {} }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { vehicleTypes, isLoading: isLoadingVehicleTypes } = useVehicleTypes();

  useEffect(() => {
    if (vehicle.image_url) {
      setImageUrl(vehicle.image_url);
    }
  }, [vehicle.image_url]);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || 2024,
      vin: vehicle.vin || "",
      license_plate: vehicle.license_plate || "",
      color: vehicle.color || "",
      insurance_company: vehicle.insurance_company || "",
      insurance_policy: vehicle.insurance_policy || "",
      insurance_expiry: vehicle.insurance_expiry || "",
      documents_verified: vehicle.documents_verified || false,
      image_url: vehicle.image_url || "",
      vehicle_type_id: vehicle.vehicle_type_id || "",
      id: vehicle.id,
    },
  })

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const formData = form.getValues();
      const submissionData = { ...formData };

      if (selectedImage) {
        const imagePath = `vehicles/${uuidv4()}-${selectedImage.name}`;

        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(imagePath, selectedImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading image: ", uploadError);
          toast.error("Failed to upload image. Please try again.");
          return;
        }

        const publicURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${imagePath}`;
        submissionData.image_url = publicURL;
      }

      onSubmit(submissionData);
    } catch (error) {
      console.error("Form submission error: ", error);
      toast.error("Failed to submit the form. Please check the console for details.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <FormControl>
                  <Input placeholder="Vehicle Make" {...field} />
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
                  <Input placeholder="Vehicle Model" {...field} />
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
                  <Input
                    type="number"
                    placeholder="Year of Manufacture"
                    {...field}
                  />
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
                  <Input placeholder="Vehicle Identification Number" {...field} />
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
                  <Input placeholder="License Plate Number" {...field} />
                </FormControl>
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
                  <Input placeholder="Vehicle Color" {...field} />
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
                  <Input placeholder="Insurance Company Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_policy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Policy</FormLabel>
                <FormControl>
                  <Input placeholder="Insurance Policy Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurance_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Expiry</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    placeholder="Insurance Expiry Date"
                    {...field}
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
                <FormLabel>Vehicle Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
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
          name="documents_verified"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormLabel>Documents Verified</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <VehicleImageUpload
          onImageSelected={setSelectedImage}
          initialImageUrl={vehicle.image_url}
        />

        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </Form>
  )
}

export default VehicleForm;
