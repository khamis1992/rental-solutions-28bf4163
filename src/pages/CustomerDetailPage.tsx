
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { isValidDatabaseId } from '@/lib/database/validation';
import { useEffect } from 'react';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // Validate ID format
  useEffect(() => {
    if (id && !isValidDatabaseId(id)) {
      console.warn(`Invalid customer ID format: ${id}`);
    }
  }, [id]);
  
  return (
    <PageContainer
      title="Customer Details"
      description="View detailed information about the customer."
      backLink="/customers"
    >
      <CustomerDetail customerId={id} />
    </PageContainer>
  );
};

export default CustomerDetailPage;
