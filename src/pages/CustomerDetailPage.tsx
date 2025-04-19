
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { ArabicTextStatus } from '@/components/ui/arabic-text-status';

const CustomerDetailPage = () => {
  return (
    <PageContainer
      title="Customer Details"
      description="View detailed information about the customer."
      backLink="/customers"
      actions={<ArabicTextStatus />}
    >
      <CustomerDetail />
    </PageContainer>
  );
};

export default CustomerDetailPage;
