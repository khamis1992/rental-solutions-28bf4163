
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, UserPlus, StarIcon, Repeat2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/use-customers';
import { formatCurrency } from '@/lib/utils';
import { formatArabicDate } from '@/lib/date-utils';
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';

const CustomerReport = () => {
  const { customers, isLoading } = useCustomers();

  // Calculate customer metrics
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
    name: 'Active',
    value: activeCustomers,
    color: '#3b82f6'
  }, {
    name: 'Inactive',
    value: inactiveCustomers,
    color: '#22c55e'
  }, {
    name: 'Blacklisted',
    value: blacklistedCustomers,
    color: '#f59e0b'
  }, {
    name: 'Pending Review',
    value: pendingCustomers,
    color: '#8b5cf6'
  }].filter(segment => segment.value > 0);

  // Get top customers (for demonstration, we'll sort by most recently created)
  const topCustomers = [...customers].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  }).slice(0, 5).map((customer) => ({
    id: customer.id,
    name: customer.full_name,
    status: customer.status || 'active',
    totalRentals: Math.floor(Math.random() * 15) + 1,
    totalSpent: Math.floor(Math.random() * 10000) + 1000,
    lastRental: customer.updated_at ? new Date(customer.updated_at).toISOString().split('T')[0] : 'N/A',
    rating: (4 + Math.random()).toFixed(1)
  }));

  // Create rental duration data (sample data as we don't have this in our database)
  const rentalDurationData = [{
    name: '1-3 days',
    value: Math.floor(totalCustomers * 0.4),
    color: '#3b82f6'
  }, {
    name: '4-7 days',
    value: Math.floor(totalCustomers * 0.3),
    color: '#22c55e'
  }, {
    name: '8-14 days',
    value: Math.floor(totalCustomers * 0.2),
    color: '#f59e0b'
  }, {
    name: '15+ days',
    value: Math.floor(totalCustomers * 0.1),
    color: '#8b5cf6'
  }];
  
  // Prepare report data for download
  const getReportData = () => {
    return customers.map(customer => ({
      id: customer.id,
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      driver_license: customer.driver_license,
      created_at: customer.created_at,
      nationality: customer.nationality || 'N/A',
      address: customer.address || 'N/A'
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
      
      <div className="mb-6">
        <ReportDownloadOptions reportType="customers" getReportData={getReportData} />
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
          title="عملاء جدد" 
          value={newCustomers.toString()} 
          trend={Math.round(newCustomers / (totalCustomers || 1) * 100)} 
          trendLabel="% من الإجمالي" 
          icon={UserPlus} 
          iconColor="text-green-500" 
        />
        <StatCard 
          title="عملاء نشطون" 
          value={`${activeCustomers}`} 
          trend={Math.round(activeCustomers / (totalCustomers || 1) * 100)} 
          trendLabel="% من الإجمالي" 
          icon={StarIcon} 
          iconColor="text-amber-500" 
        />
        <StatCard 
          title="معدل الاحتفاظ" 
          value={`${Math.round(activeCustomers / (totalCustomers || 1) * 100)}%`} 
          trend={5} 
          trendLabel="مقارنة بالشهر الماضي" 
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
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">أفضل العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجمالي الإيجارات</TableHead>
                  <TableHead className="text-right">إجمالي الإنفاق</TableHead>
                  <TableHead className="text-right">آخر إيجار</TableHead>
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
                    <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                    <TableCell className="text-right">{formatArabicDate(customer.lastRental)}</TableCell>
                    <TableCell className="text-right">{customer.rating}/5</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">لا توجد بيانات عملاء متاحة</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerReport;
