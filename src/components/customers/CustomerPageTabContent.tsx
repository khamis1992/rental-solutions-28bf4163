
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerDataGrid } from '@/components/customers/CustomerDataGrid';
import type { CustomerInfo } from '@/types/customer';

interface CustomerPageTabContentProps {
  selectedTab: string;
  onTabChange: (value: string) => void;
  customers: CustomerInfo[];
  isLoading: boolean;
  onCustomerSelect: (customer: CustomerInfo) => void;
}

export const CustomerPageTabContent: React.FC<CustomerPageTabContentProps> = ({
  selectedTab,
  onTabChange,
  customers,
  isLoading,
  onCustomerSelect,
}) => {
  return (
    <Tabs defaultValue="all" value={selectedTab} onValueChange={onTabChange}>
      <TabsList className="grid grid-cols-5 w-full sm:w-auto">
        <TabsTrigger value="all">All Customers</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="inactive">Inactive</TabsTrigger>
        <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
        <TabsTrigger value="blacklisted">Blacklisted</TabsTrigger>
      </TabsList>
      
      <TabsContent value={selectedTab} className="mt-6">
        <CustomerDataGrid 
          customers={customers} 
          isLoading={isLoading}
          onCustomerSelect={onCustomerSelect}
        />
      </TabsContent>
    </Tabs>
  );
};
