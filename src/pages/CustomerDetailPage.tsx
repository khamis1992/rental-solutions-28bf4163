
import PageContainer from '@/components/layout/PageContainer';
import CustomerDetail from '@/components/customers/CustomerDetail';

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
