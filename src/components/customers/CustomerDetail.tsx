import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, UserCog, CalendarClock, Clock, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { CustomerTrafficFines } from './CustomerTrafficFines';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { useAgreements, SimpleAgreement } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, deleteCustomer } = useCustomers();
  const { agreements, isLoading: isLoadingAgreements } = useAgreements({ 
    customerId: id
  });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!id || hasLoaded) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const data = await getCustomer(id);
      if (data) {
        setCustomer(data);
        setHasLoaded(true);
      } else {
        setFetchError("Customer not found");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      setFetchError("Failed to load customer details");
      toast.error("Error loading customer details");
    } finally {
      setLoading(false);
    }
  }, [id, getCustomer, hasLoaded]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleDelete = async () => {
    if (!customer?.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteCustomer.mutateAsync(customer.id, {
        onSuccess: () => {
          toast.success("Customer deleted successfully");
          navigate('/customers');
        },
        onError: (error) => {
          console.error("Delete error:", error);
          toast.error("Failed to delete customer");
          setIsDeleting(false);
        }
      });
    } catch (error) {
      console.error("Unexpected error during delete:", error);
      toast.error("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  if (loading && !hasLoaded) {
    return <div className="flex justify-center items-center p-8">Loading customer details...</div>;
  }

  if (fetchError || !customer) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Customer Not Found</CardTitle>
          <CardDescription>
            {fetchError || "The customer you're looking for doesn't exist or has been removed."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/customers">Back to Customers</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{customer.full_name}</h2>
          <p className="text-muted-foreground">
            Customer since {formatDate(customer.created_at || '')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link to={`/customers/edit/${customer.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the customer record for {customer.full_name}.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCog className="mr-2 h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Email Address</h4>
              <p className="text-foreground">{customer.email}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Phone Number</h4>
              <p className="text-foreground">{customer.phone}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Address</h4>
              <p className="text-foreground whitespace-pre-line">{customer.address || 'No address provided'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarClock className="mr-2 h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
              <Badge
                variant={
                  customer.status === "active" ? "success" : 
                  customer.status === "inactive" ? "outline" : 
                  customer.status === "blacklisted" ? "destructive" :
                  customer.status === "pending_review" ? "warning" :
                  "secondary"
                }
                className="capitalize"
              >
                {customer.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Driver License</h4>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                {customer.driver_license}
              </code>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Last Updated</h4>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {customer.updated_at 
                  ? formatDateTime(customer.updated_at) 
                  : 'Never updated'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Agreement History
          </CardTitle>
          <CardDescription>
            List of rental agreements associated with this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement Number</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAgreements ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={`skeleton-cell-${i}-${j}`}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : agreements && agreements.length > 0 ? (
                  agreements.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-medium">{agreement.agreement_number || 'N/A'}</TableCell>
                      <TableCell>
                        {agreement.vehicle ? (
                          <span>
                            {agreement.vehicle.make} {agreement.vehicle.model} ({agreement.vehicle.license_plate})
                          </span>
                        ) : (
                          'Unknown vehicle'
                        )}
                      </TableCell>
                      <TableCell>{agreement.start_date ? formatDate(agreement.start_date) : 'N/A'}</TableCell>
                      <TableCell>{agreement.end_date ? formatDate(agreement.end_date) : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            agreement.status === 'ACTIVE' ? 'success' :
                            agreement.status === 'PENDING' ? 'warning' :
                            agreement.status === 'CANCELLED' ? 'destructive' :
                            agreement.status === 'CLOSED' ? 'outline' :
                            agreement.status === 'EXPIRED' ? 'secondary' :
                            'default'
                          }
                          className="capitalize"
                        >
                          {agreement.status?.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{agreement.total_amount ? `QAR ${agreement.total_amount.toLocaleString()}` : 'N/A'}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/agreements/${agreement.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No agreements found for this customer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Traffic Fines
          </CardTitle>
          <CardDescription>
            Traffic violations associated with this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customer.id && <CustomerTrafficFines customerId={customer.id} />}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {customer.notes ? (
              <p className="whitespace-pre-line">{customer.notes}</p>
            ) : (
              <p className="text-muted-foreground italic">No additional notes for this customer.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
