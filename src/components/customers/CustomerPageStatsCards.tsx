
import React from 'react';
import { CustomerStatsCards } from '@/components/customers/CustomerStatsCards';
import type { CustomerInfo } from '@/types/customer';

interface CustomerPageStatsCardsProps {
  customers: CustomerInfo[];
  isLoading: boolean;
}

export const CustomerPageStatsCards: React.FC<CustomerPageStatsCardsProps> = ({
  customers,
  isLoading,
}) => {
  return <CustomerStatsCards customers={customers} isLoading={isLoading} />;
};
