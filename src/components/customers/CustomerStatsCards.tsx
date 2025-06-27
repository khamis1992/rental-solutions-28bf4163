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

  const labels = {
    total: { title: 'إجمالي العملاء', description: 'جميع العملاء المسجلين' },
    active: { title: 'العملاء النشطون', description: `${((stats.active / stats.total) * 100 || 0).toFixed(0)}% من الإجمالي` },
    pending: { title: 'قيد المراجعة', description: 'في انتظار التحقق' },
    inactive: { title: 'العملاء غير النشطون', description: 'غير نشطون حاليًا' },
    blacklisted: { title: 'المحظورون', description: 'عملاء مقيدون' }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" dir="rtl">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" dir="rtl">
      <Card className="border-r-4 border-r-blue-500">
        <CardHeader className="pb-2" style={{ textAlign: 'right', direction: 'rtl' }}>
          <CardDescription style={{ textAlign: 'right', direction: 'rtl' }}>
            {labels.total.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {stats.total}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className="flex flex-row-reverse items-center text-blue-500"
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            <Users className="h-4 w-4 ml-2" />
            <span 
              className="text-sm"
              style={{ textAlign: 'right', direction: 'rtl' }}
            >
              {labels.total.description}
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-r-4 border-r-emerald-500">
        <CardHeader className="pb-2" style={{ textAlign: 'right', direction: 'rtl' }}>
          <CardDescription style={{ textAlign: 'right', direction: 'rtl' }}>
            {labels.active.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {stats.active}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className="flex flex-row-reverse items-center text-emerald-500"
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            <UserCheck className="h-4 w-4 ml-2" />
            <span 
              className="text-sm"
              style={{ textAlign: 'right', direction: 'rtl' }}
            >
              {labels.active.description}
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-r-4 border-r-amber-500">
        <CardHeader className="pb-2" style={{ textAlign: 'right', direction: 'rtl' }}>
          <CardDescription style={{ textAlign: 'right', direction: 'rtl' }}>
            {labels.pending.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {stats.pending}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className="flex flex-row-reverse items-center text-amber-500"
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            <AlertTriangle className="h-4 w-4 ml-2" />
            <span 
              className="text-sm"
              style={{ textAlign: 'right', direction: 'rtl' }}
            >
              {labels.pending.description}
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-r-4 border-r-gray-500">
        <CardHeader className="pb-2" style={{ textAlign: 'right', direction: 'rtl' }}>
          <CardDescription style={{ textAlign: 'right', direction: 'rtl' }}>
            {labels.inactive.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {stats.inactive}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className="flex flex-row-reverse items-center text-gray-500"
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            <UserX className="h-4 w-4 ml-2" />
            <span 
              className="text-sm"
              style={{ textAlign: 'right', direction: 'rtl' }}
            >
              {labels.inactive.description}
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-r-4 border-r-rose-500">
        <CardHeader className="pb-2" style={{ textAlign: 'right', direction: 'rtl' }}>
          <CardDescription style={{ textAlign: 'right', direction: 'rtl' }}>
            {labels.blacklisted.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {stats.blacklisted}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className="flex flex-row-reverse items-center text-rose-500"
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            <ShieldAlert className="h-4 w-4 ml-2" />
            <span 
              className="text-sm"
              style={{ textAlign: 'right', direction: 'rtl' }}
            >
              {labels.blacklisted.description}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 