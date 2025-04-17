
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { useCustomers } from '@/hooks/use-customers';

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use addCustomer instead of createCustomer
  const { addCustomer } = useCustomers();
  
  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      // Call the mutation function
      await addCustomer.mutateAsync(formData);
      
      toast.success('Customer added successfully');
      navigate('/customers');
    } catch (error: any) {
      toast.error('Failed to add customer', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageContainer title="Add New Customer">
      <SectionHeader
        title="Add New Customer" 
        description="Enter customer details below"
      />
      
      {/* Add customer form here */}
    </PageContainer>
  );
};

export default AddCustomer;
