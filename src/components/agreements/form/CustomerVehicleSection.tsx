
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerSelector from "@/components/customers/CustomerSelector";
import { CustomerInfo } from "@/types/customer";

interface CustomerVehicleSectionProps {
  selectedCustomer: CustomerInfo | null;
  setSelectedCustomer: (customer: CustomerInfo) => void;
  selectedVehicle: any;
  setSelectedVehicle: (vehicle: any) => void;
}

export const CustomerVehicleSection: React.FC<CustomerVehicleSectionProps> = ({
  selectedCustomer,
  setSelectedCustomer,
  selectedVehicle,
  setSelectedVehicle
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
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Vehicle
        </label>
        <Select onValueChange={(value) => {
          // In a real implementation, you'd fetch vehicle details here
          setSelectedVehicle({ id: value, make: 'Sample', model: 'Vehicle' });
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vehicle1">Toyota Camry (ABC-123)</SelectItem>
            <SelectItem value="vehicle2">Honda Civic (XYZ-789)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
