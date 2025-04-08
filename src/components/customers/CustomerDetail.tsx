
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgreements } from '@/hooks/use-agreements';
import { usePayments } from '@/hooks/use-payments';
import { supabase } from '@/lib/supabase';
import CustomerAgreements from '@/components/customers/CustomerAgreements';
import CustomerPayments from '@/components/customers/CustomerPayments';
import CustomerDocuments from '@/components/customers/CustomerDocuments';
import CustomerDrivingHistory from '@/components/customers/CustomerDrivingHistory';

interface CustomerDetailProps {
  customerId: string;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId }) => {
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const { 
    agreements, 
    isLoadingAgreements, 
    refetch: refetchAgreements 
  } = useAgreements({ customerId });

  const {
    payments,
    isLoadingPayments,
  } = usePayments(null, customerId);

  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);

  const [trafficFines, setTrafficFines] = useState<any[]>([]);
  const [isLoadingTrafficFines, setIsLoadingTrafficFines] = useState(true);

  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoadingDocuments(true);
        // In a real app, replace with actual document fetching logic
        await new Promise(resolve => setTimeout(resolve, 500));
        setDocuments([]);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    if (customerId) {
      fetchDocuments();
    }
  }, [customerId]);

  // Fetch traffic fines
  useEffect(() => {
    const fetchTrafficFines = async () => {
      try {
        setIsLoadingTrafficFines(true);
        // In a real app, replace with actual traffic fines fetching logic
        await new Promise(resolve => setTimeout(resolve, 800));
        setTrafficFines([]);
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
      } finally {
        setIsLoadingTrafficFines(false);
      }
    };

    if (customerId && activeTab === 'drivingHistory') {
      fetchTrafficFines();
    }
  }, [customerId, activeTab]);

  if (isLoading) {
    return <CustomerDetailSkeleton />;
  }

  if (!customer) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-xl font-semibold">Customer Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The requested customer could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{customer.full_name}</CardTitle>
          <CardDescription>Customer Details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm">{customer.email || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm">{customer.phone_number || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm">{customer.address || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Driver License</p>
              <p className="text-sm">{customer.driver_license || 'N/A'}</p>
            </div>
            {customer.status && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <div>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="drivingHistory">Driving History</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="agreements" className="m-0">
            <CustomerAgreements 
              agreements={agreements} 
              isLoading={isLoadingAgreements} 
            />
          </TabsContent>
          
          <TabsContent value="payments" className="m-0">
            <CustomerPayments 
              payments={payments} 
              isLoading={isLoadingPayments} 
            />
          </TabsContent>
          
          <TabsContent value="documents" className="m-0">
            <CustomerDocuments 
              documents={documents} 
              isLoading={isLoadingDocuments} 
            />
          </TabsContent>
          
          <TabsContent value="drivingHistory" className="m-0">
            <CustomerDrivingHistory 
              trafficFines={trafficFines} 
              isLoading={isLoadingTrafficFines} 
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

const CustomerDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({length: 6}).map((_, index) => (
              <div key={index} className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div>
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
};

export default CustomerDetail;
