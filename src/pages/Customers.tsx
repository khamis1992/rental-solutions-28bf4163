
import { CustomerList } from '@/components/customers/CustomerList';
import { PageContainer } from '@/components/layout/PageContainer';

const Customers = () => {
  return (
    <PageContainer
      title="Customers"
      description="View and manage your customer database."
    >
      <CustomerList />
    </PageContainer>
  );
};

export default Customers;
