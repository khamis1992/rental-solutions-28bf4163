import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers } from '@/hooks/use-customers';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCustomer } = useCustomers();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!id) {
        toast.error("Customer ID is missing");
        return;
      }

      setIsLoading(true);
      try {
        const customerData = await getCustomer(id);
        if (customerData) {
          setCustomer(customerData);
        } else {
          toast.error("Customer not found");
        }
      } catch (error) {
        console.error("Error loading customer:", error);
        toast.error("Failed to load customer details");
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, [id, getCustomer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Customer Not Found</h3>
        <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{customer.full_name}</h2>
          <div className="text-muted-foreground">{customer.email}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={customer.status === 'active' ? 'success' : customer.status === 'blacklisted' ? 'destructive' : 'outline'}>
            {customer.status?.toUpperCase()}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to={`/customers/edit/${customer.id}`}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Phone Number</h3>
                  <p>{customer.phone}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Nationality</h3>
                  <p>{customer.nationality || 'Not specified'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Driver License</h3>
                  <p>{customer.driver_license || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Address</h3>
                  <p>{customer.address || 'Not specified'}</p>
                </div>
                
                {customer.notes && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Notes</h3>
                    <p className="whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agreements">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Customer agreements will be displayed here.</p>
              {/* This would be implemented with a filtered AgreementList component */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Customer documents will be displayed here.</p>
              {/* This would be implemented with a DocumentList component */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">Customer history will be displayed here.</p>
              {/* This would be implemented with a CustomerHistory component */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail;
