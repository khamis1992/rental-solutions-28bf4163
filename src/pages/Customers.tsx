
import { CustomerList } from '@/components/customers/CustomerList';
import PageContainer from '@/components/layout/PageContainer';

const Customers = () => {
  console.log("Rendering Customers page");
  
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
