
import React, { useEffect } from 'react';
import { CustomerInfo } from "@/types/customer";
import VehicleSelector from "@/components/vehicles/VehicleSelector";
import CustomerSelector from "@/components/customers/CustomerSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { CacheSynchronization } from '@/utils/cache-synchronization';

interface CustomerVehicleSectionProps {
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo) => void;
  selectedVehicle: any;
  setSelectedVehicle: (vehicle: any) => void;
  customerError?: string;
  vehicleError?: string;
}

export const CustomerVehicleSection = ({
  selectedCustomer,
  setSelectedCustomer,
  selectedVehicle,
  setSelectedVehicle,
  customerError,
  vehicleError
}: CustomerVehicleSectionProps) => {
  const queryClient = useQueryClient();

  // Initialize cache synchronization
  useEffect(() => {
    CacheSynchronization.setQueryClient(queryClient);
  }, [queryClient]);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Customer & Vehicle</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Customer
        </label>
        
        <CustomerSelector
          onCustomerSelect={setSelectedCustomer}
          selectedCustomer={selectedCustomer}
          placeholder="Search for customer..."
        />
        
        {customerError && (
          <Alert variant="destructive" className="py-2 mt-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm ml-2">
              {customerError}
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Vehicle
        </label>
        <VehicleSelector
          selectedVehicle={selectedVehicle}
          onVehicleSelect={setSelectedVehicle}
          placeholder="Select vehicle"
          excludeMaintenanceVehicles={true}
        />
        {vehicleError && (
          <Alert variant="destructive" className="py-2 mt-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm ml-2">
              {vehicleError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
