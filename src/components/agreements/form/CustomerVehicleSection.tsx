
import React from 'react';
import CustomerSelector from "@/components/customers/CustomerSelector";
import { CustomerInfo } from "@/types/customer";
import VehicleSelector from "@/components/vehicles/VehicleSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CustomerVehicleSectionProps {
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo) => void;
  selectedVehicle: any;
  setSelectedVehicle: (vehicle: any) => void;
  customerError?: string;
  vehicleError?: string;
}

export const CustomerVehicleSection: React.FC<CustomerVehicleSectionProps> = ({
  selectedCustomer,
  setSelectedCustomer,
  selectedVehicle,
  setSelectedVehicle,
  customerError,
  vehicleError
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Customer & Vehicle</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Customer
        </label>
        <CustomerSelector 
          selectedCustomer={selectedCustomer}
          onCustomerSelect={setSelectedCustomer}
          placeholder="Select customer"
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
