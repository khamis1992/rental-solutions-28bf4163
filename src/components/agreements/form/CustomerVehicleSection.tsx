
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CustomerSelector } from '@/components/agreements/selectors/CustomerSelector';
import { VehicleSelector } from '@/components/agreements/selectors/VehicleSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';

interface CustomerVehicleSectionProps {
  onCustomerChange: (customerId: string | null, customerDetails?: any) => void;
  onVehicleChange: (vehicleId: string | null, vehicleDetails?: any) => void;
  selectedCustomerId?: string | null;
  selectedVehicleId?: string | null;
}

export const CustomerVehicleSection: React.FC<CustomerVehicleSectionProps> = ({
  onCustomerChange,
  onVehicleChange,
  selectedCustomerId,
  selectedVehicleId
}) => {
  // State for customers and vehicles
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number, status')
          .eq('role', 'customer');

        if (error) {
          throw error;
        }

        if (data) {
          // Map to the expected CustomerInfo format
          const customerData: CustomerInfo[] = data.map(customer => ({
            id: customer.id,
            fullName: customer.full_name,
            email: customer.email || '',
            phoneNumber: customer.phone_number || '',
            status: customer.status || 'active'
          }));
          setCustomers(customerData);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch selected customer details if selectedCustomerId changes
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setSelectedCustomer(customer);
        onCustomerChange(customer.id, customer);
      }
    }
  }, [selectedCustomerId, customers, onCustomerChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Customer Section */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
          <CardDescription>Select a customer for this agreement</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerSelector 
            onCustomerSelected={(customerId, customerDetails) => {
              setSelectedCustomer(customerDetails || null);
              onCustomerChange(customerId, customerDetails);
            }}
            selectedCustomerId={selectedCustomerId}
          />
        </CardContent>
      </Card>

      {/* Vehicle Section */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle</CardTitle>
          <CardDescription>Select a vehicle for this agreement</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleSelector
            onVehicleSelected={(vehicleId, vehicleDetails) => {
              onVehicleChange(vehicleId, vehicleDetails);
            }}
            statusFilter="available"
            selectedVehicleId={selectedVehicleId}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerVehicleSection;
