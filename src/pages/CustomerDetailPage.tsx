
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

const CustomerDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isRTL } = useContextTranslation();
  const { getCustomer, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (id) {
        setLoading(true);
        try {
          console.log('Fetching customer details for ID:', id);
          const data = await getCustomer(id);
          console.log('Customer data received:', data);
          if (data) {
            // Ensure we have a valid customer object with all required fields
            if (data.id) {
              setCustomer(data);
            } else {
              console.error('Customer data missing required ID field');
              toast.error(t('customers.loadError'));
              setCustomer(null);
            }
          } else {
            console.log('No customer data found for ID:', id);
            setCustomer(null);
          }
        } catch (error) {
          console.error("Error fetching customer:", error);
          toast.error(t('customers.loadError'));
          setCustomer(null);
        } finally {
          setLoading(false);
        }
      } else {
        console.error("No customer ID provided");
        navigate('/customers');
      }
    };
    
    fetchCustomerData();
    // Only depend on id and navigation to prevent unnecessary re-fetches
  }, [id, navigate, t]);

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
