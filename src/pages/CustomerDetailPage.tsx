
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import { AgreementHistorySection } from '@/components/customers/AgreementHistorySection';
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';

// Create a stub CustomerProfile component
const CustomerProfile = ({ customer }: { customer: Customer }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-lg font-medium">Personal Information</h3>
        <div className="mt-2 space-y-2">
          <p><span className="font-medium">Name:</span> {customer.full_name}</p>
          <p><span className="font-medium">Email:</span> {customer.email}</p>
          <p><span className="font-medium">Phone:</span> {customer.phone}</p>
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
);

// Create a stub CustomerNotes component
const CustomerNotes = ({ customerId }: { customerId: string }) => (
  <div className="p-4">
    <p>Notes will be displayed here.</p>
  </div>
);

// Create a stub for legal obligations component
const CustomerLegalObligations = ({ customerId }: { customerId: string }) => (
  <div className="p-4">
    <p>Legal obligations will be displayed here.</p>
  </div>
);

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Fetch customer data
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, driver_license, nationality, address, notes, status, created_at, updated_at')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Customer not found');
      
      return {
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || '',
        phone: (data.phone_number || '').replace(/^\+974/, '').trim(),
        driver_license: data.driver_license || '',
        nationality: data.nationality || '',
        address: data.address || '',
        notes: data.notes || '',
        status: (data.status || 'active') as Customer['status'],
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as Customer;
    }
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load customer details");
      console.error(error);
    }
  }, [error]);

  return (
    <PageContainer
      title={customer ? `Customer: ${customer.full_name}` : "Customer Details"}
      description={customer ? `View and manage details for ${customer.full_name}` : "Loading customer information..."}
      backLink="/customers"
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <h3 className="font-medium text-lg">Error Loading Customer</h3>
          <p>{error instanceof Error ? error.message : "Unknown error occurred"}</p>
        </div>
      ) : customer ? (
        <div className="space-y-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="agreements">Agreements</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
              <CustomerProfile customer={customer} />
            </TabsContent>
            <TabsContent value="agreements" className="mt-6">
              <AgreementHistorySection customerId={customer.id} />
            </TabsContent>
            <TabsContent value="legal" className="mt-6">
              <CustomerLegalObligations customerId={customer.id} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <h3 className="font-medium text-lg">Customer Not Found</h3>
          <p>The requested customer could not be found.</p>
        </div>
      )}
    </PageContainer>
  );
}
