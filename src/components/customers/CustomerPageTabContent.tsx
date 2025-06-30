import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerList } from './CustomerList';
import { CustomerGridView } from './CustomerGridView';
import { CustomerViewToggle } from './CustomerViewToggle';
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
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const getTabCustomers = (status: string) => {
    if (status === 'all') return customers;
    return customers.filter(customer => customer.status === status);
  };

  const getTabCount = (status: string) => {
    return getTabCustomers(status).length;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Tabs value={selectedTab} onValueChange={onTabChange} className="w-full">
        <div className="flex flex-col gap-4 mb-6">
          {/* التبويبات الرئيسية - محسنة للوضع المحمول */}
          <div className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 bg-gray-100 h-auto">
              <TabsTrigger 
                value="blacklisted" 
                className="hidden sm:flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <span>محظور</span>
                <span className="text-xs bg-white rounded px-1">({getTabCount('blacklisted')})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pending_review" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm col-span-3 sm:col-span-1"
              >
                <span className="sm:hidden">مراجعة</span>
                <span className="hidden sm:inline">قيد المراجعة</span>
                <span className="text-xs bg-white rounded px-1">({getTabCount('pending_review')})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inactive" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <span>غير نشط</span>
                <span className="text-xs bg-white rounded px-1">({getTabCount('inactive')})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <span>نشط</span>
                <span className="text-xs bg-white rounded px-1">({getTabCount('active')})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <span>الكل</span>
                <span className="text-xs bg-white rounded px-1">({getTabCount('all')})</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* تبويبة محظور للوضع المحمول */}
          <div className="block sm:hidden">
            <TabsList className="grid w-full grid-cols-1 bg-gray-100">
              <TabsTrigger 
                value="blacklisted" 
                className="flex items-center justify-center gap-2 p-3 text-sm"
              >
                <span>مطور</span>
                <span className="text-xs bg-white rounded px-2">({getTabCount('blacklisted')})</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* مبدل العرض */}
          <div className="flex justify-end">
            <CustomerViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {view === 'grid' ? (
            <CustomerGridView
              customers={getTabCustomers('all')}
              isLoading={isLoading}
              onCustomerSelect={onCustomerSelect}
            />
          ) : (
            <CustomerList 
              searchParams={{
                query: '',
                status: 'all'
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {view === 'grid' ? (
            <CustomerGridView
              customers={getTabCustomers('active')}
              isLoading={isLoading}
              onCustomerSelect={onCustomerSelect}
            />
          ) : (
            <CustomerList 
              searchParams={{
                query: '',
                status: 'active'
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {view === 'grid' ? (
            <CustomerGridView
              customers={getTabCustomers('inactive')}
              isLoading={isLoading}
              onCustomerSelect={onCustomerSelect}
            />
          ) : (
            <CustomerList 
              searchParams={{
                query: '',
                status: 'inactive'
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="pending_review" className="space-y-4">
          {view === 'grid' ? (
            <CustomerGridView
              customers={getTabCustomers('pending_review')}
              isLoading={isLoading}
              onCustomerSelect={onCustomerSelect}
            />
          ) : (
            <CustomerList 
              searchParams={{
                query: '',
                status: 'pending_review'
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="blacklisted" className="space-y-4">
          {view === 'grid' ? (
            <CustomerGridView
              customers={getTabCustomers('blacklisted')}
              isLoading={isLoading}
              onCustomerSelect={onCustomerSelect}
            />
          ) : (
            <CustomerList 
              searchParams={{
                query: '',
                status: 'blacklisted'
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
