
import { useState, useEffect } from "react";
import { useParams, Link } from 'react-router-dom';
import { useCustomers } from '@/hooks/use-customers';
import { CustomerStatus, CustomerInfo } from '@/types/customer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Pencil, Loader2 } from 'lucide-react';
import CustomerAgreements from './CustomerAgreements';
import CustomerTrafficFines from './CustomerTrafficFines';
import CustomerPayments from './CustomerPayments';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { getCustomer } = useCustomers();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await getCustomer(id);
        if (data) {
          // Cast data to CustomerInfo to ensure type safety
          const typedCustomer: CustomerInfo = {
            ...data,
            status: data.status as CustomerStatus
          };
          setCustomer(typedCustomer);
        } else {
          setError("Customer not found");
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
        setError("Failed to load customer data");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, getCustomer]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        {error || "Customer not found"}
      </div>
    );
  }

  const getStatusBadge = (status?: CustomerStatus) => {
    if (!status) return <Badge>Unknown</Badge>;
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending Review</Badge>;
      case 'blacklisted':
        return <Badge variant="destructive">Blacklisted</Badge>;
      case 'pending_payment':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Pending Payment</Badge>;
      case 'blocked':
        return <Badge className="bg-red-500 hover:bg-red-600">Blocked</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{customer.full_name}</h2>
              <div className="text-muted-foreground">{customer.email}</div>
              <div className="text-muted-foreground">{customer.phone || customer.phone_number}</div>
              <div className="mt-2">
                {getStatusBadge(customer.status)}
              </div>
            </div>
            <div className="flex gap-2 self-start">
              <Button asChild variant="outline" size="sm">
                <Link to={`/customers/edit/${customer.id}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Address</h3>
              <p>{customer.address || "Not provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Driver's License</h3>
              <p>{customer.driver_license || "Not provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Nationality</h3>
              <p>{customer.nationality || "Not provided"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
              <p>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "Unknown"}</p>
            </div>
          </div>

          {customer.notes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
              <p className="p-3 bg-secondary rounded-md">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="agreements">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="agreements" className="mt-4">
          <CustomerAgreements customerId={customer.id} />
        </TabsContent>
        <TabsContent value="fines" className="mt-4">
          <CustomerTrafficFines customerId={customer.id} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <CustomerPayments customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
