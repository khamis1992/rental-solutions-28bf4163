import React, { useState } from 'react';
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
import CustomerSelector from '@/components/customers/CustomerSelector';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface AgreementBasicDetailsProps {
  form: UseFormReturn<Agreement>;
  isEdit: boolean;
  onVehicleChange: (vehicleId: string, vehicleData: any) => void;
  onCustomerChange: (customerId: string, customerData: CustomerInfo) => void;
}

export const AgreementBasicDetails = ({
  form,
  isEdit,
  onVehicleChange,
  onCustomerChange
}: AgreementBasicDetailsProps) => {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const vehiclesHook = useVehicles();
  const { data: vehicles, isLoading: isLoadingVehicles } = vehiclesHook.useList();

  const [conflictAgreement, setConflictAgreement] = useState<any>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState<any>(null);
  const [isClosing, setIsClosing] = useState(false);

  const statusOptions = [
    { label: "Draft", value: AgreementStatus.DRAFT },
    { label: "Pending", value: AgreementStatus.PENDING },
    { label: "Active", value: AgreementStatus.ACTIVE },
    { label: "Expired", value: AgreementStatus.EXPIRED },
    { label: "Cancelled", value: AgreementStatus.CANCELLED },
    { label: "Closed", value: AgreementStatus.CLOSED }
  ];

  // Track selected customer for CustomerSelector
  const selectedCustomer = customers?.find(c => c.id === form.watch('customer_id')) || null;

  // Real-time vehicle assignment check
  const handleVehicleChange = async (vehicleId: string) => {
    if (vehicles && Array.isArray(vehicles)) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        // Check for active agreement with this vehicle
        const { data: agreements, error } = await supabase
          .from('leases')
          .select('id, agreement_number, status, start_date, end_date')
          .eq('vehicle_id', vehicleId)
          .in('status', ['active', 'pending']);
        if (error) {
          toast.error('Failed to check vehicle assignment.');
          onVehicleChange(vehicleId, vehicle);
          return;
        }
        // Exclude current agreement if editing
        const currentAgreementId = form.getValues('id');
        const conflict = agreements?.find(a => a.id !== currentAgreementId);
        if (conflict) {
          setConflictAgreement(conflict);
          setPendingVehicle(vehicle);
          setShowConflictDialog(true);
          toast.error('This vehicle is already assigned to another active agreement.');
          return;
        }
        // No conflict, proceed
        onVehicleChange(vehicleId, vehicle);
      }
    }
  };

  // Option to close the current agreement and reassign
  const handleCloseAndReassign = async () => {
    if (!conflictAgreement || !pendingVehicle) return;
    setIsClosing(true);
    // Update the conflicting agreement to closed
    const { error } = await supabase
      .from('leases')
      .update({ status: 'closed' })
      .eq('id', conflictAgreement.id);
    setIsClosing(false);
    setShowConflictDialog(false);
    if (error) {
      toast.error('Failed to close the current agreement.');
      return;
    }
    toast.success('Previous agreement closed. Vehicle reassigned.');
    onVehicleChange(pendingVehicle.id, pendingVehicle);
    setConflictAgreement(null);
    setPendingVehicle(null);
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
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onCustomerSelect={(customer) => {
                  field.onChange(customer.id);
                  onCustomerChange(customer.id, customer);
                }}
                disabled={isLoadingCustomers}
              />
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
      {/* Conflict dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vehicle Already Assigned</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            This vehicle is currently assigned to agreement <b>{conflictAgreement?.agreement_number}</b> (status: {conflictAgreement?.status}).
            <br />
            Would you like to close that agreement and reassign the vehicle?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)} disabled={isClosing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseAndReassign} isLoading={isClosing}>
              Close &amp; Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
