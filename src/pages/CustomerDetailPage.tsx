import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerDetail from '@/components/customers/CustomerDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useCustomers } from '@/hooks/use-customers';

const CustomerDetailPage = () => {
  return (
    <PageContainer
      title="Customer Details"
      description="View detailed information about the customer."
      backLink="/customers"
    >
      <CustomerDetail />
    </PageContainer>
  );
};

export default CustomerDetailPage;
