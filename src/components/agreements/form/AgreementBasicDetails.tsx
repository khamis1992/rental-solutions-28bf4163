
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers } from '@/hooks/use-customers';
import { useVehicles } from '@/hooks/use-vehicles';
import { UseFormReturn } from 'react-hook-form';
import { Agreement } from '@/types/agreement';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { CustomerInfo } from '@/types/customer';

interface AgreementBasicDetailsProps {
  form: UseFormReturn<Agreement>;
  isEdit: boolean;
  onVehicleChange: (vehicleId: string, vehicleData: any) => void;
  onCustomerChange: (customerId: string, customerData: CustomerInfo) => void;
}

export const AgreementBasicDetails: React.FC<AgreementBasicDetailsProps> = ({ 
  form, 
  isEdit,
  onVehicleChange,
  onCustomerChange
}) => {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const vehiclesHook = useVehicles();
  const { data: vehicles, isLoading: isLoadingVehicles } = vehiclesHook.useList();

  const statusOptions = [
    { label: "Draft", value: AgreementStatus.DRAFT },
    { label: "Pending", value: AgreementStatus.PENDING },
    { label: "Active", value: AgreementStatus.ACTIVE },
    { label: "Expired", value: AgreementStatus.EXPIRED },
    { label: "Cancelled", value: AgreementStatus.CANCELLED },
    { label: "Closed", value: AgreementStatus.CLOSED }
  ];

  // When vehicle is selected, update selected vehicle state
  const handleVehicleChange = (vehicleId: string) => {
    if (vehicles && Array.isArray(vehicles)) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        onVehicleChange(vehicleId, vehicle);
      }
    }
  };

  // When customer is selected, update selected customer state
  const handleCustomerChange = (customerId: string) => {
    if (customers && Array.isArray(customers)) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        onCustomerChange(customerId, customer);
      }
    }
  };

  return (
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
                onValueChange={(value) => {
                  field.onChange(value);
                  handleCustomerChange(value);
                }}
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
                        {vehicle.make} {vehicle.model} - {vehicle.license_plate}
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
    </div>
  );
};
