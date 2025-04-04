
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { useParams } from 'react-router-dom';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { isRTL } = useContextTranslation();
  
  return (
    <PageContainer
      title={t('customers.details')}
      description={t('customers.viewDetails')}
      backLink="/customers"
    >
      {id && <CustomerDetail id={id} />}
    </PageContainer>
  );
};

export default CustomerDetailPage;
