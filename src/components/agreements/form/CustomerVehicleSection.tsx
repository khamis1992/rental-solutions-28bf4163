
import { useEffect } from 'react';
import { CustomerInfo } from "@/types/customer";
import VehicleSelector from "@/components/vehicles/VehicleSelector";
import { CustomerSelector } from "@/components/customers/CustomerSelector";
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

  const handleCustomerSelect = (customer: any) => {
    const customerInfo: CustomerInfo = {
      id: customer.id || '',
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone_number: customer.phone_number || customer.phone || '',
      driver_license: customer.driver_license || '',
      nationality: customer.nationality || '',
      address: customer.address || ''
    };
    setSelectedCustomer(customerInfo);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Customer & Vehicle</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Customer
        </label>
        
        <CustomerSelector
          onCustomerSelect={handleCustomerSelect}
          selectedCustomerId={selectedCustomer?.id}
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
