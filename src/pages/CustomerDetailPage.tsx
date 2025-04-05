
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { supabase } from '@/integrations/supabase/client';

// Lazy load the CustomerDetail component to improve initial load time
const LazyCustomerDetail = lazy(() => import('@/components/customers/CustomerDetail').then(module => ({ 
  default: module.CustomerDetail 
})));

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [systemStatus, setSystemStatus] = useState<string | null>(null);
  
  // Check system status for this customer in parallel
  useEffect(() => {
    if (!id) return;
    
    const checkCustomerSystemStatus = async () => {
      try {
        // Use column selection to optimize the query
        const { data: pendingIssues } = await supabase
          .from('customer_issues')
          .select('id, issue_type')
          .eq('customer_id', id)
          .eq('status', 'pending')
          .limit(1);
        
        if (pendingIssues && pendingIssues.length > 0) {
          setSystemStatus(t('customers.hasPendingIssues'));
        }
      } catch (error) {
        console.error("Error checking customer system status:", error);
      }
    };
    
    checkCustomerSystemStatus();
  }, [id, t]);
  
  return (
    <PageContainer
      title={t('customers.details')}
      description={t('customers.viewDetails')}
      backLink="/customers"
      notification={systemStatus}
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
