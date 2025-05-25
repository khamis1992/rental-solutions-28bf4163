import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomer } from '@/hooks/use-customer';
import { useNavigate } from 'react-router-dom';
import { CustomerAgreements } from './CustomerAgreements';
import { CustomerTrafficFines } from './CustomerTrafficFines';
import { CustomerPayments } from './CustomerPayments';
import { CustomerDocuments } from './CustomerDocuments';
import { CustomerNotes } from './CustomerNotes';
import { CustomerContactInfo } from './CustomerContactInfo';
import { CustomerPersonalInfo } from './CustomerPersonalInfo';
import { CustomerEditDialog } from './CustomerEditDialog';
import { AlertTriangle, Edit, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  // ... other customer properties
}

export function CustomerDetail({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  const { customer: customerData, isLoading, error, deleteCustomer } = useCustomer(customerId);
  
  useEffect(() => {
    if (customerData) {
      setCustomer(customerData as unknown as Customer);
    }
  }, [customerData]);
  
  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = async () => {
    try {
      await deleteCustomer(customerId);
      toast.success("Customer deleted successfully");
      navigate('/customers');
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
    setIsDeleteDialogOpen(false);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-semibold">Error Loading Customer</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <Button className="mt-4" onClick={() => navigate('/customers')}>
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-semibold">Customer Not Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The customer you're looking for doesn't exist or has been removed.
          </p>
          <Button className="mt-4" onClick={() => navigate('/customers')}>
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {customer.full_name || 'Customer Details'}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomerPersonalInfo customer={customer} />
        <CustomerContactInfo customer={customer} />
      </div>
      
      <Tabs defaultValue="agreements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="agreements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rental Agreements</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerAgreements customerId={customer.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerPayments customerId={customer.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerTrafficFines customerId={customer.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerDocuments customerId={customer.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes & Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerNotes customerId={customer.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <CustomerEditDialog 
        customer={customer} 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
      />
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
