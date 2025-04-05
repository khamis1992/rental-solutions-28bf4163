
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the CustomerDetail component to improve initial load time
const LazyCustomerDetail = lazy(() => import('@/components/customers/CustomerDetail').then(module => ({ 
  default: module.CustomerDetail 
})));

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  
  return (
    <PageContainer
      title={t('customers.details')}
      description={t('customers.viewDetails')}
      backLink="/customers"
    >
      {id && (
        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        }>
          <LazyCustomerDetail id={id} />
        </Suspense>
      )}
    </PageContainer>
  );
};

export default CustomerDetailPage;
