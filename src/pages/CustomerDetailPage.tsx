
import { useState, useEffect, lazy, Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the CustomerDetail component
const CustomerDetail = lazy(() => import('@/components/customers/CustomerDetail').then(
  module => ({ default: module.CustomerDetail })
));

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [pageTitle, setPageTitle] = useState('Customer Details');
  
  // Update page title if customer name becomes available
  // This would typically come from a context or query parameter
  useEffect(() => {
    const customerName = sessionStorage.getItem(`customer_${id}_name`);
    if (customerName) {
      setPageTitle(`${customerName} - Details`);
      document.title = `${customerName} | Rental Solutions`;
    }
    
    return () => {
      document.title = 'Rental Solutions';
    };
  }, [id]);

  return (
    <PageContainer
      title={pageTitle}
      description="View detailed information about the customer."
      backLink="/customers"
    >
      <Suspense fallback={
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      }>
        <CustomerDetail />
      </Suspense>
    </PageContainer>
  );
};

export default CustomerDetailPage;
