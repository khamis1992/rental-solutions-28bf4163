import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerInfo } from '@/types/customer';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomerStatsCardsProps {
  customers: CustomerInfo[];
  isLoading: boolean;
}

export const CustomerStatsCards: React.FC<CustomerStatsCardsProps> = ({ customers, isLoading }) => {
  const { language } = useLanguage();
  
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

  // Arabic translations
  const getStatsLabels = () => {
    if (language === 'ar') {
      return {
        total: { title: 'إجمالي العملاء', description: 'جميع العملاء المسجلين' },
        active: { title: 'العملاء النشطون', description: `${((stats.active / stats.total) * 100 || 0).toFixed(0)}% من الإجمالي` },
        pending: { title: 'قيد المراجعة', description: 'في انتظار التحقق' },
        inactive: { title: 'العملاء غير النشطون', description: 'غير نشطون حاليًا' },
        blacklisted: { title: 'المحظورون', description: 'عملاء مقيدون' }
      };
    }
    
    return {
      total: { title: 'Total Customers', description: 'All registered customers' },
      active: { title: 'Active Customers', description: `${((stats.active / stats.total) * 100 || 0).toFixed(0)}% of total` },
      pending: { title: 'Pending Review', description: 'Awaiting verification' },
      inactive: { title: 'Inactive Customers', description: 'Not currently active' },
      blacklisted: { title: 'Blacklisted', description: 'Restricted customers' }
    };
  };

  const labels = getStatsLabels();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className={`${language === 'ar' ? 'border-r-4 border-r-blue-500' : 'border-l-4 border-l-blue-500'}`}>
        <CardHeader className="pb-2" style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
          <CardDescription style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
            {labels.total.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {stats.total}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className={`flex items-center text-blue-500 ${language === 'ar' ? 'flex-row' : 'flex-row'}`}
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {language === 'ar' && <Users className="h-4 w-4 ml-1" />}
            <span 
              className="text-sm"
              style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
            >
              {labels.total.description}
            </span>
            {language !== 'ar' && <Users className="h-4 w-4 mr-1" />}
          </div>
        </CardContent>
      </Card>
      
      <Card className={`${language === 'ar' ? 'border-r-4 border-r-emerald-500' : 'border-l-4 border-l-emerald-500'}`}>
        <CardHeader className="pb-2" style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
          <CardDescription style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
            {labels.active.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {stats.active}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className={`flex items-center text-emerald-500 ${language === 'ar' ? 'flex-row' : 'flex-row'}`}
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {language === 'ar' && <UserCheck className="h-4 w-4 ml-1" />}
            <span 
              className="text-sm"
              style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
            >
              {labels.active.description}
            </span>
            {language !== 'ar' && <UserCheck className="h-4 w-4 mr-1" />}
          </div>
        </CardContent>
      </Card>
      
      <Card className={`${language === 'ar' ? 'border-r-4 border-r-amber-500' : 'border-l-4 border-l-amber-500'}`}>
        <CardHeader className="pb-2" style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
          <CardDescription style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
            {labels.pending.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {stats.pending}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className={`flex items-center text-amber-500 ${language === 'ar' ? 'flex-row' : 'flex-row'}`}
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {language === 'ar' && <AlertTriangle className="h-4 w-4 ml-1" />}
            <span 
              className="text-sm"
              style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
            >
              {labels.pending.description}
            </span>
            {language !== 'ar' && <AlertTriangle className="h-4 w-4 mr-1" />}
          </div>
        </CardContent>
      </Card>
      
      <Card className={`${language === 'ar' ? 'border-r-4 border-r-gray-500' : 'border-l-4 border-l-gray-500'}`}>
        <CardHeader className="pb-2" style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
          <CardDescription style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
            {labels.inactive.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {stats.inactive}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className={`flex items-center text-gray-500 ${language === 'ar' ? 'flex-row' : 'flex-row'}`}
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {language === 'ar' && <UserX className="h-4 w-4 ml-1" />}
            <span 
              className="text-sm"
              style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
            >
              {labels.inactive.description}
            </span>
            {language !== 'ar' && <UserX className="h-4 w-4 mr-1" />}
          </div>
        </CardContent>
      </Card>
      
      <Card className={`${language === 'ar' ? 'border-r-4 border-r-rose-500' : 'border-l-4 border-l-rose-500'}`}>
        <CardHeader className="pb-2" style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
          <CardDescription style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}>
            {labels.blacklisted.title}
          </CardDescription>
          <CardTitle 
            className="text-3xl font-bold" 
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {stats.blacklisted}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className={`flex items-center text-rose-500 ${language === 'ar' ? 'flex-row' : 'flex-row'}`}
            style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {language === 'ar' && <ShieldAlert className="h-4 w-4 ml-1" />}
            <span 
              className="text-sm"
              style={language === 'ar' ? { textAlign: 'right', direction: 'rtl' } : {}}
            >
              {labels.blacklisted.description}
            </span>
            {language !== 'ar' && <ShieldAlert className="h-4 w-4 mr-1" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 