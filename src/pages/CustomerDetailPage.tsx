
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
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
