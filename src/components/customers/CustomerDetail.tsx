
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
import { Mail, Phone, MapPin, User, Clock, AlertTriangle, FileText, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { Customer } from '@/lib/validation-schemas/customer';
import CustomerTrafficFines from '@/components/customers/CustomerTrafficFines';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: agreements, isLoading: agreementsLoading } = useAgreements(id ? { customer_id: id } : undefined);

  const loadCustomerData = useCallback(async () => {
    if (!id) {
      toast.error("Customer ID is missing");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const customerData = await getCustomer(id);
      if (customerData) {
        setCustomer(customerData);
      } else {
        setError("Customer not found");
        toast.error("Customer not found");
      }
    } catch (error) {
      console.error("Error loading customer:", error);
      setError("Failed to load customer details");
      toast.error("Failed to load customer details");
    } finally {
      setIsLoading(false);
    }
  }, [id, getCustomer]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    
    try {
      await deleteCustomer.mutateAsync(customer.id);
      toast.success("Customer deleted successfully");
      navigate("/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-destructive">Customer Not Found</h3>
            <p>{error || "The customer you're looking for doesn't exist or has been removed."}</p>
            <Button asChild>
              <Link to="/customers">Back to Customers</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const customerSince = customer.created_at ? format(new Date(customer.created_at), 'MMMM d, yyyy') : 'N/A';
  const lastUpdated = customer.updated_at ? formatDateTime(new Date(customer.updated_at)) : 'N/A';

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'outline';
      case 'blacklisted': return 'destructive';
      case 'pending_review': return 'warning';
      case 'pending_payment': return 'secondary';
      default: return 'outline';
    }
  };

  // Helper function for agreement status badge
  const getAgreementStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">{status}</Badge>;
      case 'completed': return <Badge variant="outline">{status}</Badge>;
      case 'terminated': return <Badge variant="destructive">{status}</Badge>;
      case 'pending': return <Badge variant="warning">{status}</Badge>;
      case 'pending_payment': return <Badge variant="secondary">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-1">{customer.full_name}</h2>
          <p className="text-muted-foreground">Customer since {customerSince}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/customers/edit/${customer.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {customer.full_name}'s record and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center text-lg">
              <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
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
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-3 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="whitespace-pre-wrap">{customer.address || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center text-lg">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              Customer Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={getStatusBadgeVariant(customer.status)}>
                  {customer.status.toUpperCase().replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Driver License</p>
                <p>{customer.driver_license}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  {lastUpdated}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreement History */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
            Agreement History
          </h3>
          <p className="text-sm text-muted-foreground mb-4">List of rental agreements associated with this customer</p>
          
          {agreementsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : agreements && agreements.length > 0 ? (
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
                {agreements.map(agreement => (
                  <TableRow key={agreement.id}>
                    <TableCell>{agreement.agreement_number}</TableCell>
                    <TableCell>
                      {agreement.vehicle && `${agreement.vehicle.make} ${agreement.vehicle.model} (${agreement.vehicle.license_plate})`}
                    </TableCell>
                    <TableCell>{agreement.start_date ? formatDate(new Date(agreement.start_date)) : 'N/A'}</TableCell>
                    <TableCell>{agreement.end_date ? formatDate(new Date(agreement.end_date)) : 'N/A'}</TableCell>
                    <TableCell>{getAgreementStatusBadge(agreement.status)}</TableCell>
                    <TableCell>QAR {agreement.total_amount?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/agreements/${agreement.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 border rounded-md bg-muted/10">
              <p className="text-muted-foreground">No agreements found for this customer.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traffic Fines */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center text-lg">
            <AlertTriangle className="h-5 w-5 mr-2 text-muted-foreground" />
            Traffic Fines
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Traffic violations associated with this customer</p>
          
          {id && <CustomerTrafficFines customerId={id} />}
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
