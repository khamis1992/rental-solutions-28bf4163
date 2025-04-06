
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/types/customer';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isRTL } = useContextTranslation();
  const { getCustomer, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (id) {
        setLoading(true);
        setError(null);
        
        try {
          console.log('Fetching customer details for ID:', id);
          const data = await getCustomer(id);
          
          if (data) {
            if (data.id) {
              setCustomer(data as Customer);
            } else {
              throw new Error('Customer data missing required ID field');
            }
          } else {
            setCustomer(null);
            setError(t('customers.notFound'));
          }
        } catch (error) {
          console.error("Error fetching customer:", error);
          setCustomer(null);
          setError(t('customers.loadError'));
        } finally {
          setLoading(false);
        }
      } else {
        console.error("No customer ID provided");
        navigate('/customers');
      }
    };
    
    fetchCustomerData();
  }, [id, navigate, t, getCustomer]);

  const handleDelete = async (customerId: string): Promise<void> => {
    try {
      await deleteCustomer.mutateAsync(customerId);
      toast.success(t('customers.deleteSuccess'));
      navigate('/customers');
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(t('customers.deleteError'));
      throw error;
    }
  };
  
  return (
    <ErrorBoundary>
      <PageContainer
        title={customer ? customer.full_name : t('customers.details')}
        description={t('customers.viewDetails')}
        backLink="/customers"
      >
        {loading ? (
          <div className="space-y-6">
            <div className="h-12 w-full flex justify-between items-center">
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[320px] w-full" />
              <Skeleton className="h-[320px] w-full" />
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : customer ? (
          <CustomerDetail customer={customer} onDelete={handleDelete} />
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('customers.notFound')}</AlertTitle>
            <AlertDescription>{t('customers.customerDoesNotExist')}</AlertDescription>
          </Alert>
        )}
      </PageContainer>
    </ErrorBoundary>
  );
};

export default CustomerDetailPage;
