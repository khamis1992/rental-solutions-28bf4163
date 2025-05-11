
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CustomerStatsCardsProps {
  customers: CustomerInfo[];
  isLoading: boolean;
}

export const CustomerStatsCards: React.FC<CustomerStatsCardsProps> = ({ customers, isLoading }) => {
  // Calculate customer statistics
  const stats = useMemo(() => {
    if (!Array.isArray(customers)) return {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      blacklisted: 0
    };
    
    return {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      inactive: customers.filter(c => c.status === 'inactive').length,
      pending: customers.filter(c => c.status === 'pending_review' || c.status === 'pending_payment').length,
      blacklisted: customers.filter(c => c.status === 'blacklisted').length
    };
  }, [customers]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-white">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardDescription>Total Customers</CardDescription>
          <CardTitle className="text-3xl font-bold">{stats.total}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-blue-500">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-sm">All registered customers</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardDescription>Active Customers</CardDescription>
          <CardTitle className="text-3xl font-bold">{stats.active}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-green-500">
            <UserCheck className="h-4 w-4 mr-1" />
            <span className="text-sm">{((stats.active / stats.total) * 100 || 0).toFixed(0)}% of total</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardDescription>Pending Review</CardDescription>
          <CardTitle className="text-3xl font-bold">{stats.pending}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-amber-500">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-sm">Awaiting verification</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-gray-500">
        <CardHeader className="pb-2">
          <CardDescription>Inactive Customers</CardDescription>
          <CardTitle className="text-3xl font-bold">{stats.inactive}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-gray-500">
            <UserX className="h-4 w-4 mr-1" />
            <span className="text-sm">Not currently active</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardDescription>Blacklisted</CardDescription>
          <CardTitle className="text-3xl font-bold">{stats.blacklisted}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-red-500">
            <ShieldAlert className="h-4 w-4 mr-1" />
            <span className="text-sm">Restricted customers</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
