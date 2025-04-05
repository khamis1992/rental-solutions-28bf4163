
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AgreementHistorySection } from '@/components/customers/AgreementHistorySection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer } from '@/lib/validation-schemas/customer';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Temporary stub components until the real ones are created
const CustomerProfile = ({ customer }: { customer: Customer }) => (
  <CardContent>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium">Personal Information</h3>
          <div className="mt-2 space-y-2">
            <p><span className="font-medium">Name:</span> {customer.full_name}</p>
            <p><span className="font-medium">Email:</span> {customer.email}</p>
            <p><span className="font-medium">Phone:</span> {customer.phone || customer.phone_number}</p>
            <p><span className="font-medium">ID/License:</span> {customer.driver_license}</p>
            <p><span className="font-medium">Nationality:</span> {customer.nationality}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium">Additional Details</h3>
          <div className="mt-2 space-y-2">
            <p><span className="font-medium">Address:</span> {customer.address || 'N/A'}</p>
            <p><span className="font-medium">Status:</span> {customer.status}</p>
            <p><span className="font-medium">Created:</span> {new Date(customer.created_at).toLocaleDateString()}</p>
            <p><span className="font-medium">Last Updated:</span> {new Date(customer.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium">Notes</h3>
        <p className="mt-2">{customer.notes || 'No notes available'}</p>
      </div>
    </div>
  </CardContent>
);

const CustomerNotes = ({ customerId }: { customerId: string }) => (
  <CardContent>
    <div className="space-y-4">
      <p className="text-muted-foreground">Customer notes will be displayed here.</p>
    </div>
  </CardContent>
);

const CustomerLegalObligations = ({ customerId }: { customerId: string }) => (
  <div className="space-y-4">
    <p className="text-muted-foreground">Legal obligations will be displayed here.</p>
  </div>
);

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch customer data using proper query structure
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Customer;
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <h3 className="text-lg font-bold mb-2">Error Loading Customer</h3>
        <p>{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 bg-muted rounded-md">
        <h3 className="text-lg font-bold mb-2">Customer Not Found</h3>
        <p>The customer you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-0">
          <TabsList className="px-6 pt-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="p-0">
            <CustomerProfile customer={customer} />
          </TabsContent>
          <TabsContent value="agreements" className="p-0">
            <AgreementHistorySection customerId={customer.id || ''} />
          </TabsContent>
          <TabsContent value="legal" className="p-0">
            <CardContent>
              <CustomerLegalObligations customerId={customer.id || ''} />
            </CardContent>
          </TabsContent>
          <TabsContent value="notes" className="p-0">
            <CustomerNotes customerId={customer.id || ''} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
