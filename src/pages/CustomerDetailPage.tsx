
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  
  return (
    <PageContainer
      title={t('customers.details')}
      description={t('customers.viewDetails')}
      backLink="/customers"
    >
      <CustomerDetail />
    </PageContainer>
  );
};

export default CustomerDetailPage;
