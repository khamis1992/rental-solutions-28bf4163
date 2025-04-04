
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { useParams } from 'react-router-dom';

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  
  return (
    <PageContainer
      title={t('customers.details')}
      description={t('customers.viewDetails')}
      backLink="/customers"
    >
      <CustomerDetail customerId={id} />
    </PageContainer>
  );
};

export default CustomerDetailPage;
