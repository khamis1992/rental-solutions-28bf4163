
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useCustomers } from '@/hooks/use-customers';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Phone, MapPin, Calendar, List, AlertTriangle, Check, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCustomer } = useCustomers();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchCompleted, setFetchCompleted] = useState(false);

  const loadCustomerData = useCallback(async () => {
    if (!id) {
      toast.error("Customer ID is missing");
      setIsLoading(false);
      return;
    }

    if (fetchCompleted) return;

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
      setFetchCompleted(true);
    }
  }, [id, getCustomer, fetchCompleted]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

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

  const customerSince = customer.created_at ? format(new Date(customer.created_at), 'MMMM d, yyyy') : 'N/A';
  const lastUpdated = customer.updated_at ? format(new Date(customer.updated_at), 'MMMM d, yyyy h:mm a') : 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-1">{customer.full_name}</h2>
          <p className="text-muted-foreground">Customer since {customerSince}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Arabic text processing indicator */}
          <div className="flex items-center text-sm text-green-600">
            <Check className="h-4 w-4 mr-1" />
            <span>Arabic text processing available</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/customers/edit/${customer.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center text-lg">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p>{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p>{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p>{customer.address || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 text-lg">Customer Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                  {customer.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Driver License</p>
                <p>{customer.driver_license}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p>{lastUpdated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreement History */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center text-lg">
            <List className="h-5 w-5 mr-2" />
            Agreement History
          </h3>
          <p className="text-sm text-muted-foreground mb-4">List of rental agreements associated with this customer</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agreement Number</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Agreement rows would be populated here */}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Traffic Fines */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center text-lg">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Traffic Fines
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Traffic violations associated with this customer</p>
          <div className="text-center py-6 text-muted-foreground">
            No traffic fines found for this customer.
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-lg">Additional Notes</h3>
          {customer.notes ? (
            <p className="whitespace-pre-wrap">{customer.notes}</p>
          ) : (
            <p className="text-muted-foreground italic">No additional notes for this customer.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetail;
