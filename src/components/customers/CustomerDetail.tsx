
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CustomerTrafficFines } from '@/components/customers/CustomerTrafficFines';
import { CustomerAgreements } from '@/components/customers/CustomerAgreements';
import { CustomerPayments } from '@/components/customers/CustomerPayments';
import { CustomerDocuments } from '@/components/customers/CustomerDocuments';
import { CustomerDrivingHistory } from '@/components/customers/CustomerDrivingHistory';
import { supabase } from '@/integrations/supabase/client';

interface CustomerDetailProps {
  customerId: string;
}

const CustomerDetail = ({ customerId }: CustomerDetailProps) => {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId)
          .single();

        if (error) {
          throw error;
        }

        setCustomer(data);
      } catch (error) {
        console.error('Error fetching customer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  if (loading) {
    return <div>Loading customer details...</div>;
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Customer Information</CardTitle>
            <Button variant="outline" size="sm">Edit Customer</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">Full Name</h3>
              <p>{customer.full_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Email</h3>
              <p>{customer.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Phone</h3>
              <p>{customer.phone_number}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Nationality</h3>
              <p>{customer.nationality}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Driver License</h3>
              <p>{customer.driver_license}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Address</h3>
              <p>{customer.address || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="agreements">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="traffic-fines">Traffic Fines</TabsTrigger>
          <TabsTrigger value="driving-history">Driving History</TabsTrigger>
        </TabsList>

        <TabsContent value="agreements">
          <CustomerAgreements customerId={customerId} />
        </TabsContent>
        
        <TabsContent value="payments">
          <CustomerPayments customerId={customerId} />
        </TabsContent>
        
        <TabsContent value="documents">
          <CustomerDocuments customerId={customerId} />
        </TabsContent>
        
        <TabsContent value="traffic-fines">
          <CustomerTrafficFines customerId={customerId} />
        </TabsContent>
        
        <TabsContent value="driving-history">
          <CustomerDrivingHistory customerId={customerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail;
