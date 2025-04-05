import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/validation-schemas/customer';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AgreementHistorySection } from '@/components/customers/AgreementHistorySection';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  const [customer, setCustomer] = useState<Customer | null>(null);

  const { data: customerData, error: customerError, isLoading: isLoadingCustomer } = useQuery(
    ['customer', id],
    async () => {
      if (!id) throw new Error("Customer ID is required");
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching customer:", error);
        throw error;
      }
      return data;
    }
  );

  useEffect(() => {
    if (customerData) {
      const processedCustomer: Customer = {
        id: customerData.id,
        full_name: customerData.full_name || '',
        email: customerData.email || '',
        phone: (customerData.phone_number || '').replace(/^\+974/, '').trim(),
        driver_license: customerData.driver_license || '',
        nationality: customerData.nationality || '',
        address: customerData.address || '',
        notes: customerData.notes || '',
        status: (customerData.status || 'active') as "active" | "inactive" | "pending_review" | "blacklisted" | "pending_payment",
        created_at: customerData.created_at,
        updated_at: customerData.updated_at,
      };
      setCustomer(processedCustomer);
    }
  }, [customerData, id]);

  // Remove customer_issues query that doesn't exist
  const { data: customerIssues, error: issuesError } = { data: [], error: null };

  const getStatusBadge = useMemo(() => {
    if (!customer) return null;

    let badgeClass = "";
    let Icon = CheckCircle;
    switch (customer.status) {
      case "active":
        badgeClass = "bg-green-500 text-white border-green-600";
        Icon = CheckCircle;
        break;
      case "inactive":
        badgeClass = "bg-gray-400 text-white border-gray-500";
        Icon = XCircle;
        break;
      case "blacklisted":
        badgeClass = "bg-red-500 text-white border-red-600";
        Icon = XCircle;
        break;
      case "pending_review":
        badgeClass = "bg-amber-500 text-white border-amber-600";
        Icon = AlertTriangle;
        break;
      case "pending_payment":
        badgeClass = "bg-blue-500 text-white border-blue-600";
        Icon = AlertTriangle;
        break;
      default:
        badgeClass = "bg-green-500 text-white border-green-600";
        Icon = CheckCircle;
    }

    return (
      <Badge className={`capitalize ${badgeClass}`}>
        <Icon className="h-3 w-3 mr-1" />
        {t(`customers.status.${customer.status.replace('_', '')}`)}
      </Badge>
    );
  }, [customer, t]);

  if (isLoadingCustomer) {
    return <PageContainer title={t('customers.loadingCustomer')} description={t('customers.loadingDetails')}>
      <Card>
        <CardContent>
          {t('customers.loading')}
        </CardContent>
      </Card>
    </PageContainer>;
  }

  if (!customer) {
    return <PageContainer title={t('customers.customerNotFound')} description={t('customers.couldNotFind')}>
      <Card>
        <CardContent>
          {customerError ? customerError.message : t('customers.noCustomerWithId')}
        </CardContent>
      </Card>
    </PageContainer>;
  }

  return (
    <PageContainer
      title={customer.full_name || t('customers.unnamed')}
      description={t('customers.customerDetails')}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/customers')} className={isRTL ? 'ml-2' : 'mr-2'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <Button onClick={() => navigate(`/customers/edit/${id}`)}>
            <Pencil className="h-4 w-4 mr-2" />
            {t('customers.editCustomer')}
          </Button>
        </div>
      }
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{customer.full_name}</CardTitle>
          <CardDescription>{t('customers.personalInformation')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{t('common.email')}</h4>
            <p className="text-gray-500">{customer.email || t('customers.notProvided')}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{t('common.phone')}</h4>
            <p className="text-gray-500">{customer.phone || t('customers.notProvided')}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{t('customers.license')}</h4>
            <p className="text-gray-500">{customer.driver_license || t('customers.notProvided')}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{t('common.status')}</h4>
            {getStatusBadge}
          </div>
        </CardContent>
      </Card>

      <AgreementHistorySection customerId={id} />
    </PageContainer>
  );
};

export default CustomerDetailPage;
