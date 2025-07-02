import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

import { AlertTriangle, FileText, Loader2, Plus, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface TrafficFine {
  id: string;
  violation_date: string;
  fine_location: string;
  violation_charge: string;
  fine_amount: number;
  payment_status: string;
  validation_status: string;
  license_plate: string;
  vehicle_id: string | null;
  lease_id: string | null;
}

interface CustomerTrafficFinesProps {
  customerId: string;
}

const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      if (!customerId) {
        setError("No customer ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching traffic fines for customer ID:", customerId);
        
        // First get all leases for this customer
        const { data: leases, error: leaseError } = await supabase
          .from('leases')
          .select('id')
          .eq('customer_id', customerId);
        
        if (leaseError) {
          console.error("Error fetching leases:", leaseError);
          setError(leaseError.message);
          setIsLoading(false);
          return;
        }
        
        const leaseIds = leases?.map(lease => lease.id) || [];
        
        if (leaseIds.length === 0) {
          console.log("No leases found for customer");
          setTrafficFines([]);
          setIsLoading(false);
          return;
        }
        
        // Now get traffic fines for these leases
        const { data: fines, error: finesError } = await supabase
          .from('traffic_fines')
          .select('*')
          .in('lease_id', leaseIds);
          
        if (finesError) {
          console.error("Error fetching traffic fines:", finesError);
          setError(finesError.message);
          setIsLoading(false);
          return;
        }
        
        console.log(`Found ${fines?.length || 0} traffic fines`);
        setTrafficFines(fines || []);
        
      } catch (error: any) {
        console.error("Unexpected error fetching traffic fines:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrafficFines();
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">غير معروف</Badge>;
    
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">مدفوع</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">معلق</Badge>;
      case 'disputed':
        return <Badge className="bg-blue-500">متنازع عليه</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getValidationBadge = (status: string) => {
    if (!status) return <Badge variant="outline">غير معروف</Badge>;
    
    switch (status.toLowerCase()) {
      case 'verified':
        return <Badge className="bg-green-500">موثق</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">معلق</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">فشل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddFine = () => {
    // Not implemented yet
  };

  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="text-right">المخالفات المرورية</CardTitle>
          <CardDescription className="text-right">جاري تحميل المخالفات المرورية لهذا العميل...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">جاري تحميل المخالفات المرورية...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="text-right">المخالفات المرورية</CardTitle>
          <CardDescription className="text-right">حدث خطأ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-destructive flex-row-reverse">
            <AlertTriangle className="ml-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFineAmount = trafficFines.reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
  const pendingFines = trafficFines.filter(fine => 
    fine.payment_status && fine.payment_status.toLowerCase() !== "paid"
  );

  return (
    <div className="space-y-6">
      <Card dir="rtl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-lg font-semibold text-left flex items-center gap-2 flex-row-reverse">
                <AlertTriangle className="w-5 h-5" />
                المخالفات المرورية
              </CardTitle>
              <CardDescription className="text-left mt-1">
                إدارة المخالفات المرورية المرتبطة بهذا العميل
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-row-reverse">
              <Button 
                onClick={handleAddFine}
                className="flex items-center gap-2 flex-row-reverse"
              >
                <Plus className="w-4 h-4" />
                إضافة مخالفة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card dir="rtl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <CardTitle className="text-sm font-medium text-left">
                  إجمالي المخالفات
                </CardTitle>
                <CardDescription className="text-left mt-1">
                  إجمالي المخالفات المرورية المسجلة
                </CardDescription>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{trafficFines.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card dir="rtl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <CardTitle className="text-sm font-medium text-left">
                  المخالفات المعلقة
                </CardTitle>
                <CardDescription className="text-left mt-1">
                  المخالفات التي تتطلب سداد
                </CardDescription>
              </div>
              <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{pendingFines.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card dir="rtl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <CardTitle className="text-sm font-medium text-left">
                  المبلغ الإجمالي
                </CardTitle>
                <CardDescription className="text-left mt-1">
                  المبلغ الإجمالي لجميع المخالفات
                </CardDescription>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('ar-QA', {
                  style: 'currency',
                  currency: 'QAR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(totalFineAmount)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {trafficFines.length > 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3 text-left">
            سجلات المخالفات المرورية
          </h4>
          <Table dir="rtl">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم اللوحة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المكان</TableHead>
                <TableHead className="text-right">المخالفة</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التوثيق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trafficFines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell className="font-medium text-right">{fine.license_plate || 'غير متوفر'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center flex-row-reverse">
                      <Calendar className="ml-1 h-3 w-3 text-muted-foreground" />
                      {fine.violation_date ? formatDate(fine.violation_date) : 'غير متوفر'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center flex-row-reverse">
                      <MapPin className="ml-1 h-3 w-3 text-muted-foreground" />
                      {fine.fine_location || 'غير متوفر'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{fine.violation_charge || 'غير متوفر'}</TableCell>
                  <TableCell className="text-right">
                    {fine.fine_amount ? (
                      new Intl.NumberFormat('ar-QA', {
                        style: 'currency',
                        currency: 'QAR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(fine.fine_amount)
                    ) : 'غير متوفر'}
                  </TableCell>
                  <TableCell className="text-right">{getStatusBadge(fine.payment_status || '')}</TableCell>
                  <TableCell className="text-right">{getValidationBadge(fine.validation_status || '')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              لا توجد مخالفات مرورية لهذا العميل
            </h4>
            <p className="text-xs text-muted-foreground">
              عند تسجيل مخالفات مرورية للعميل، ستظهر هنا مع جميع تفاصيلها
            </p>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
    </div>
  );
};

export default CustomerTrafficFines;
