import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, UserPlus, StarIcon, Repeat2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/use-customers';
import { useAgreementsFixed } from '@/hooks/use-agreements-fixed';
import { useAllPayments } from '@/hooks/use-all-payments';
import { formatCurrency } from '@/lib/utils';
import { formatArabicDate } from '@/lib/date-utils';

const CustomerReport = () => {
  const { customers, isLoading: customersLoading } = useCustomers();
  const { agreements, isLoading: agreementsLoading } = useAgreementsFixed();
  const { payments, isLoading: paymentsLoading } = useAllPayments({});

  const isLoading = customersLoading || agreementsLoading || paymentsLoading;

  // Calculate customer metrics with real data
  const totalCustomers = customers.length;

  // Get customers created in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter(customer => {
    const createdDate = customer.created_at ? new Date(customer.created_at) : null;
    return createdDate && createdDate > thirtyDaysAgo;
  }).length;

  // Calculate customer segments based on status
  const activeCustomers = customers.filter(customer => customer.status === 'active').length;
  const inactiveCustomers = customers.filter(customer => customer.status === 'inactive').length;
  const blacklistedCustomers = customers.filter(customer => customer.status === 'blacklisted').length;
  const pendingCustomers = customers.filter(customer => customer.status === 'pending_review').length;

  // Prepare data for customer segments chart
  const customerSegmentData = [{
    name: 'نشط',
    value: activeCustomers,
    color: '#22c55e'
  }, {
    name: 'غير نشط',
    value: inactiveCustomers,
    color: '#64748b'
  }, {
    name: 'محظور',
    value: blacklistedCustomers,
    color: '#ef4444'
  }, {
    name: 'قيد المراجعة',
    value: pendingCustomers,
    color: '#f59e0b'
  }].filter(segment => segment.value > 0);

  // Calculate real rental data from agreements
  const customerAgreementCounts = customers.map(customer => {
    const customerAgreements = agreements.filter(agreement => agreement.customer_id === customer.id);
    const customerPayments = payments.filter(payment => 
      customerAgreements.some(agreement => agreement.id === payment.lease_id)
    );
    
    const totalSpent = customerPayments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
    const activeAgreements = customerAgreements.filter(agreement => agreement.status === 'active');
    
    return {
      ...customer,
      totalRentals: customerAgreements.length,
      activeRentals: activeAgreements.length,
      totalSpent: totalSpent,
      lastActivity: customerAgreements.length > 0 ? 
        customerAgreements.reduce((latest, agreement) => {
          const agreementDate = agreement.updated_at || agreement.created_at;
          const latestDate = latest || customerAgreements[0].updated_at || customerAgreements[0].created_at;
          return agreementDate && latestDate && new Date(agreementDate) > new Date(latestDate) ? agreementDate : latestDate;
        }, customerAgreements[0].updated_at || customerAgreements[0].created_at) : customer.updated_at
    };
  });

  // Get top customers by total spent
  const topCustomers = customerAgreementCounts
    .filter(customer => customer.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
    .map((customer) => ({
      id: customer.id,
      name: customer.full_name,
      status: customer.status || 'active',
      totalRentals: customer.totalRentals,
      activeRentals: customer.activeRentals,
      totalSpent: customer.totalSpent,
      lastActivity: customer.lastActivity,
      rating: customer.totalRentals > 0 ? 
        Math.min(5, Math.max(3, 3 + (customer.totalRentals / 5))).toFixed(1) : '3.0'
    }));

  // Calculate real rental duration data from agreements
  const rentalDurations = agreements.map(agreement => {
    const startDate = new Date(agreement.start_date);
    const endDate = new Date(agreement.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (durationDays <= 3) return '1-3 أيام';
    if (durationDays <= 7) return '4-7 أيام';
    if (durationDays <= 14) return '8-14 يوم';
    if (durationDays <= 30) return '15-30 يوم';
    return '30+ يوم';
  });

  const rentalDurationCounts = rentalDurations.reduce((counts, duration) => {
    counts[duration] = (counts[duration] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const rentalDurationData = Object.entries(rentalDurationCounts).map(([name, value], index) => ({
    name,
    value,
    color: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'][index] || '#64748b'
  }));

  // Calculate average customer value and other metrics
  const customersWithSpending = customerAgreementCounts.filter(c => c.totalSpent > 0);
  const averageCustomerValue = customersWithSpending.length > 0 ? 
    customersWithSpending.reduce((sum, c) => sum + c.totalSpent, 0) / customersWithSpending.length : 0;

  const customersWithActiveRentals = customerAgreementCounts.filter(c => c.activeRentals > 0).length;
  
  // Prepare report data for download
  const getReportData = () => {
    return customerAgreementCounts.map(customer => ({
      id: customer.id,
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      driver_license: customer.driver_license,
      nationality: customer.nationality || 'N/A',
      address: customer.address || 'N/A',
      total_rentals: customer.totalRentals,
      active_rentals: customer.activeRentals,
      total_spent: customer.totalSpent,
      created_at: customer.created_at,
      last_activity: customer.lastActivity
    }));
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64" dir="rtl">جاري تحميل بيانات العملاء...</div>;
  }

  const CustomerStatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'blacklisted': 'bg-red-100 text-red-800',
      'pending_review': 'bg-purple-100 text-purple-800'
    };
    
    const getArabicStatus = (status: string) => {
      switch (status) {
        case 'active': return 'نشط';
        case 'inactive': return 'غير نشط';
        case 'blacklisted': return 'محظور';
        case 'pending_review': return 'قيد المراجعة';
        default: return status.replace('_', ' ');
      }
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {getArabicStatus(status)}
      </Badge>
    );
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center mb-6">
        <h2 className="text-xl font-bold text-right">لوحة تحليلات العملاء</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="إجمالي العملاء" 
          value={totalCustomers.toString()} 
          trend={newCustomers} 
          trendLabel="جديد هذا الشهر" 
          icon={Users} 
          iconColor="text-blue-500" 
        />
        <StatCard 
          title="عملاء نشطون" 
          value={`${customersWithActiveRentals}`} 
          trend={Math.round(customersWithActiveRentals / (totalCustomers || 1) * 100)} 
          trendLabel="% من الإجمالي" 
          icon={StarIcon} 
          iconColor="text-green-500" 
        />
        <StatCard 
          title="متوسط قيمة العميل" 
          value={`${formatCurrency(averageCustomerValue)}`} 
          trend={customersWithSpending.length} 
          trendLabel="عميل منفق" 
          icon={UserPlus} 
          iconColor="text-amber-500" 
        />
        <StatCard 
          title="معدل الاحتفاظ" 
          value={`${Math.round(activeCustomers / (totalCustomers || 1) * 100)}%`} 
          trend={Math.round((customersWithActiveRentals / (totalCustomers || 1)) * 100)} 
          trendLabel="عملاء برخص نشطة" 
          icon={Repeat2} 
          iconColor="text-indigo-500" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">شرائح العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              {customerSegmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={customerSegmentData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      paddingAngle={5} 
                      dataKey="value" 
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerSegmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} عميل`, 'العدد']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500">لا توجد بيانات شرائح متاحة</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع مدة الإيجار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              {rentalDurationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={rentalDurationData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      paddingAngle={5} 
                      dataKey="value" 
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {rentalDurationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} إيجار`, 'العدد']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500">لا توجد بيانات إيجار متاحة</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">أفضل العملاء (حسب الإنفاق)</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجمالي الإيجارات</TableHead>
                  <TableHead className="text-right">الإيجارات النشطة</TableHead>
                  <TableHead className="text-right">إجمالي الإنفاق</TableHead>
                  <TableHead className="text-right">آخر نشاط</TableHead>
                  <TableHead className="text-right">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-right">{customer.name}</TableCell>
                    <TableCell className="text-right">
                      <CustomerStatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell className="text-right">{customer.totalRentals}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {customer.activeRentals}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatArabicDate(customer.lastActivity)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1">
                        <span>{customer.rating}/5</span>
                        <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium mb-2">لا توجد بيانات عملاء متاحة</div>
              <p className="text-sm">لم يتم العثور على عملاء لديهم عقود أو مدفوعات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إحصائيات إضافية */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(customersWithSpending.reduce((sum, c) => sum + c.totalSpent, 0))}
              </div>
              <p className="text-sm text-gray-600">إجمالي إيرادات العملاء</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agreements.length}
              </div>
              <p className="text-sm text-gray-600">إجمالي العقود المبرمة</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {agreements.filter(a => a.status === 'active').length}
              </div>
              <p className="text-sm text-gray-600">العقود النشطة حالياً</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerReport;
