
import React from 'react';
import { useParams } from 'react-router-dom';
import CustomerDetail from '@/components/customers/CustomerDetail';
import PageContainer from '@/components/layout/PageContainer';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <PageContainer 
        title="Customer Not Found" 
        description="The customer ID is missing"
        backLink="/customers"
      >
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold mb-2">Customer ID Missing</h2>
          <p className="text-muted-foreground">
            Please select a customer from the customer list.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Customer Details"
      description="View and manage customer information"
      backLink="/customers"
    >
      <CustomerDetail customerId={id} />
    </PageContainer>
  );
};

export default CustomerDetailPage;
