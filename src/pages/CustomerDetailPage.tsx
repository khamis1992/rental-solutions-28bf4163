
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { useParams } from 'react-router-dom';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/types/customer';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { isRTL } = useContextTranslation();
  const { getCustomer, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (id) {
        setLoading(true);
        const data = await getCustomer(id);
        setCustomer(data);
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id, getCustomer]);

  const handleDelete = async (customerId: string) => {
    return await deleteCustomer.mutateAsync(customerId);
  };
  
  return (
    <PageContainer
      title={t('customers.details')}
      description={t('customers.viewDetails')}
      backLink="/customers"
    >
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : customer ? (
        <CustomerDetail customer={customer} onDelete={handleDelete} />
      ) : (
        <div className="p-4 bg-destructive/10 rounded-md text-destructive">
          {t('customers.notFound')}
        </div>
      )}
    </PageContainer>
  );
};

export default CustomerDetailPage;
