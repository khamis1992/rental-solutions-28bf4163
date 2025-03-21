
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';

const EditCustomer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, updateCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      setLoading(true);
      const data = await getCustomer(id);
      setCustomer(data);
      setLoading(false);
    };

    fetchCustomer();
  }, [id, getCustomer]);

  const handleSubmit = async (data: Customer) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      await updateCustomer.mutateAsync({ ...data, id });
      navigate(`/customers/${id}`);
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
        <div className="flex justify-center items-center p-8">
          Loading customer details...
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer
        title="Customer Not Found"
        description="The customer you're trying to edit doesn't exist."
        backLink="/customers"
      >
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Customer not found or has been deleted.
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
        initialData={customer} 
        onSubmit={handleSubmit} 
        isLoading={isSubmitting} 
      />
    </PageContainer>
  );
};

export default EditCustomer;
