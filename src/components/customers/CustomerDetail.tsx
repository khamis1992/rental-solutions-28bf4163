
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, UserCog, CalendarClock, Clock } from 'lucide-react';
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

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getCustomer(id);
        console.log("Fetched customer data:", data);
        setCustomer(data);
      } catch (error) {
        console.error("Error fetching customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, getCustomer]);

  const handleDelete = () => {
    if (!customer?.id) return;
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => navigate('/customers'),
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading customer details...</div>;
  }

  if (!customer) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Customer Not Found</CardTitle>
          <CardDescription>
            The customer you're looking for doesn't exist or has been removed.
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
            Customer since {new Date(customer.created_at || '').toLocaleDateString()}
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
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
                  ? new Date(customer.updated_at).toLocaleString() 
                  : 'Never updated'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
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
