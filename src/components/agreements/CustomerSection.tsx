
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface Customer {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  address?: string;
  nationality?: string;
  driver_license?: string;
}

interface CustomerSectionProps {
  customerId: string;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({ customerId }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number, address, nationality, driver_license')
          .eq('id', customerId)
          .single();
        
        if (error) {
          throw new Error(error.message);
        }
        
        setCustomer(data as Customer);
      } catch (err: any) {
        console.error('Error fetching customer:', err);
        setError(err.message || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {error || 'No customer information available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Name</p>
            <p>{customer.full_name}</p>
          </div>
          {customer.phone_number && (
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p>{customer.phone_number}</p>
            </div>
          )}
          {customer.email && (
            <div>
              <p className="text-sm font-medium">Email</p>
              <p>{customer.email}</p>
            </div>
          )}
          {customer.address && (
            <div>
              <p className="text-sm font-medium">Address</p>
              <p>{customer.address}</p>
            </div>
          )}
          {customer.nationality && (
            <div>
              <p className="text-sm font-medium">Nationality</p>
              <p>{customer.nationality}</p>
            </div>
          )}
          {customer.driver_license && (
            <div>
              <p className="text-sm font-medium">Driver's License</p>
              <p>{customer.driver_license}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSection;
