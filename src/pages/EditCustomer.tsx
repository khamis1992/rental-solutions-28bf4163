
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { CustomerInfo, CustomerStatus } from '@/types/customer';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const EditCustomer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, updateCustomer } = useCustomers();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);

  const fetchCustomerData = useCallback(async () => {
    if (!id) {
      setError("Customer ID not provided");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching customer data for ID: ${id}, attempt ${fetchAttempts + 1}`);
      const data = await getCustomer(id);
      
      if (!data) {
        console.error(`No customer found with ID: ${id}`);
        setError("Customer not found");
        setLoading(false);
        return;
      }
      
      console.log("Customer data successfully retrieved:", data);
      setCustomer(data);
    } catch (err) {
      console.error("Error fetching customer:", err);
      setError("Failed to load customer data");
      toast.error("Error loading customer data");
    } finally {
      setLoading(false);
    }
  }, [id, getCustomer, fetchAttempts]);

  useEffect(() => {
    if (!customer) {
      fetchCustomerData();
    }
  }, [fetchCustomerData, customer]);

  useEffect(() => {
    if (error && fetchAttempts < 1 && !customer) {
      const retryTimer = setTimeout(() => {
        setFetchAttempts(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, fetchAttempts, customer]);

  const handleSubmit = async (data: Customer) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      console.log("Updating customer with data:", data);
      
      // Make sure the status is correctly typed as CustomerStatus
      const status = data.status as CustomerStatus;
      
      const updatedCustomer: CustomerInfo = {
        ...data,
        id,
        full_name: data.full_name || '',
        phone_number: data.phone || '', // Make sure phone_number is set
        status
      };
      
      await updateCustomer.mutateAsync(updatedCustomer);
      toast.success("Customer updated successfully");
      navigate(`/customers/${id}`);
    } catch (err) {
      console.error("Error updating customer:", err);
      toast.error("Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer
        title="Edit Customer"
        description="Loading customer information..."
        backLink="/customers"
      >
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (error || !customer) {
    return (
      <PageContainer
        title="Customer Not Found"
        description={error || "The customer you're trying to edit doesn't exist."}
        backLink="/customers"
      >
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error || "Customer not found or has been deleted."}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Customer"
      description={`Update information for ${customer.full_name}`}
      backLink={`/customers/${id}`}
    >
      <CustomerForm 
        initialData={customer as any} 
        onSubmit={handleSubmit} 
        isLoading={isSubmitting} 
      />
    </PageContainer>
  );
};

export default EditCustomer;
