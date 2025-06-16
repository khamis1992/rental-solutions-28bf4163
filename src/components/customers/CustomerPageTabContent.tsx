
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
      <div className="flex items-center justify-between">
        <Tabs value={selectedTab} onValueChange={onTabChange} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-auto grid-cols-5 bg-gray-100">
              <TabsTrigger value="blacklisted" className="flex items-center gap-2">
                محظور ({getTabCount('blacklisted')})
              </TabsTrigger>
              <TabsTrigger value="pending_review" className="flex items-center gap-2">
                قيد المراجعة ({getTabCount('pending_review')})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                غير نشط ({getTabCount('inactive')})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                نشط ({getTabCount('active')})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                الكل ({getTabCount('all')})
              </TabsTrigger>
            </TabsList>
            
            <CustomerViewToggle view={view} onViewChange={setView} />
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
    </div>
  );
};
