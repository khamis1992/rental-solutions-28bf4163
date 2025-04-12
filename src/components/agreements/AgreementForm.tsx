
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/custom-button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { Agreement, agreementSchema, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { useCustomers } from '@/hooks/use-customers';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface AgreementFormProps {
  initialData?: Agreement;
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
}

const AgreementForm: React.FC<AgreementFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(initialData?.terms_accepted || false);
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const vehiclesHook = useVehicles();
  const { data: vehicles, isLoading: isLoadingVehicles } = vehiclesHook.useList();
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Initialize form with default values
  const form = useForm<Agreement>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      ...initialData || {
        customer_id: '',
        vehicle_id: '',
        start_date: new Date(),
        end_date: new Date(),
        status: 'draft',
        agreement_number: '',
        total_amount: 0,
        deposit_amount: 0,
        rent_amount: 0,
        daily_late_fee: 120,
        notes: '',
        additional_drivers: [],
      }
    },
  });

  // Make sure to set the ID from initialData
  useEffect(() => {
    if (initialData?.id) {
      form.setValue('id', initialData.id);
    }

    // Ensure rent_amount is correctly set
    if (initialData?.rent_amount) {
      console.log("Setting rent_amount from initialData:", initialData.rent_amount);
      form.setValue('rent_amount', initialData.rent_amount);
    }

    // Set vehicle_id if it exists
    if (initialData?.vehicle_id) {
      console.log("Setting vehicle_id from initialData:", initialData.vehicle_id);
      form.setValue('vehicle_id', initialData.vehicle_id);
      
      // If we have vehicle information, set the selected vehicle
      if (initialData.vehicles) {
        console.log("Setting selected vehicle from initialData:", initialData.vehicles);
        setSelectedVehicle(initialData.vehicles);
      }
    }
  }, [initialData, form]);

  // When vehicle is selected, update selected vehicle state
  const handleVehicleChange = (vehicleId: string) => {
    if (vehicles && Array.isArray(vehicles)) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  };

  const handleSubmit = async (data: Agreement) => {
    try {
      if (!termsAccepted) {
        toast.error("You must accept the terms and conditions");
        return;
      }
      
      // We'll handle the terms separately from the form data
      // to avoid sending it to the database
      const finalData = {
        ...data,
        terms_accepted: termsAccepted,
        id: initialData?.id
      };
      
      await onSubmit(finalData);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to save agreement");
    }
  };

  const statusOptions = [
    { label: "Draft", value: AgreementStatus.DRAFT },
    { label: "Pending", value: AgreementStatus.PENDING },
    { label: "Active", value: AgreementStatus.ACTIVE },
    { label: "Expired", value: AgreementStatus.EXPIRED },
    { label: "Cancelled", value: AgreementStatus.CANCELLED },
    { label: "Closed", value: AgreementStatus.CLOSED }
  ];

  const isEdit = !!initialData?.id;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Agreement Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="agreement_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreement Number</FormLabel>
                  <FormControl>
                    <Input placeholder="AGR-XXXXXX" {...field} disabled={isEdit} />
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
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCustomers ? (
                        <SelectItem value="loading" disabled>
                          <Skeleton className="h-5 w-full" />
                        </SelectItem>
                      ) : customers && Array.isArray(customers) && customers.length > 0 ? (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-customers" disabled>
                          No customers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleVehicleChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingVehicles ? (
                        <SelectItem value="loading" disabled>
                          <Skeleton className="h-5 w-full" />
                        </SelectItem>
                      ) : vehicles && Array.isArray(vehicles) && vehicles.length > 0 ? (
                        vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-vehicles" disabled>
                          No vehicles available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Display selected vehicle details */}
          {selectedVehicle && (
            <Card className="mt-4 bg-slate-50">
              <CardContent className="pt-4">
                <h3 className="font-medium mb-2">Selected Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex">
                    <span className="font-semibold w-24">Make:</span>
                    <span>{selectedVehicle.make}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Model:</span>
                    <span>{selectedVehicle.model}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Plate:</span>
                    <span>{selectedVehicle.license_plate}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Year:</span>
                    <span>{selectedVehicle.year}</span>
                  </div>
                  {selectedVehicle.color && (
                    <div className="flex">
                      <span className="font-semibold w-24">Color:</span>
                      <span>{selectedVehicle.color}</span>
                    </div>
                  )}
                  {selectedVehicle.vin && (
                    <div className="flex">
                      <span className="font-semibold w-24">VIN:</span>
                      <span>{selectedVehicle.vin}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Contract Terms & Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <DatePicker
                    date={field.value instanceof Date ? field.value : new Date(field.value)}
                    setDate={(date) => {
                      if (date) {
                        field.onChange(date);
                      }
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <DatePicker
                    date={field.value instanceof Date ? field.value : new Date(field.value)}
                    setDate={(date) => {
                      if (date) {
                        field.onChange(date);
                      }
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
                  <FormLabel>Monthly Rent (QAR)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                  <FormLabel>Security Deposit (QAR)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                  <FormLabel>Total Contract Value (QAR)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daily_late_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Late Fee (QAR)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes or comments" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Switch 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
            />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I confirm that all agreement terms have been explained to the customer
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
          <Button type="submit" className="bg-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Agreement"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AgreementForm;
