
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { User } from 'lucide-react';
import CustomerDetail from '@/components/customers/CustomerDetail';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Customer ID is required</div>;
  }
  
  return (
    <PageContainer>
      <SectionHeader
        title="Customer Details"
        description="View and manage customer information"
        icon={User}
      />
      
      <CustomerDetail customer={{ id }} />
    </PageContainer>
  );
};

export default CustomerDetailPage;
