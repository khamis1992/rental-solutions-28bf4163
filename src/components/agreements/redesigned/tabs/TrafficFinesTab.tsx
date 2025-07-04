import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Car, DollarSign, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { errorLogger } from '@/lib/errors/error-logger';

interface TrafficFine {
  id: string;
  violation_number: string;
  fine_amount: number;
  violation_date: string;
  location: string;
  description: string;
  status: string;
  license_plate: string;
  lease_id?: string;
}

interface TrafficFinesTabProps {
  agreementId: string;
  vehicleLicensePlate?: string;
}

export function TrafficFinesTab({ agreementId, vehicleLicensePlate }: TrafficFinesTabProps) {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchTrafficFines();
  }, [agreementId]);

  const fetchTrafficFines = async () => {
    setIsLoading(true);
    
    try {
      // جلب المخالفات المرتبطة بهذا العقد
      const { data: directFines } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', agreementId);

      let allFines: TrafficFine[] = directFines || [];

      // جلب المخالفات بواسطة رقم اللوحة إذا كان متوفراً
      if (vehicleLicensePlate) {
        const { data: plateFines } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('license_plate', vehicleLicensePlate);

        if (plateFines) {
          const newFines = plateFines.filter(plateFine => 
            !allFines.some(directFine => directFine.id === plateFine.id)
          );
          allFines = [...allFines, ...newFines];
        }
      }
      
      setFines(allFines);
      const total = allFines.reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
      setTotalAmount(total);
      
    } catch (err) {
      errorLogger.logError(err as Error, {
        context: 'TrafficFinesTab.fetchTrafficFines',
        agreementId,
        vehicleLicensePlate
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'معلقة', variant: 'destructive' as const },
      'paid': { label: 'مدفوعة', variant: 'default' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground ml-2" />
        <span>جاري تحميل المخالفات المرورية...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي المخالفات</p>
                <p className="text-2xl font-bold">{fines.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
                <p className="text-2xl font-bold">{totalAmount.toLocaleString()} ر.ق</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">رقم اللوحة</p>
                <p className="text-lg font-medium">{vehicleLicensePlate || 'غير محدد'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول المخالفات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تفاصيل المخالفات المرورية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fines.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد مخالفات مرورية</h3>
              <p className="text-muted-foreground">
                لم يتم العثور على أي مخالفات مرورية مرتبطة بهذا العقد.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم المخالفة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">تاريخ المخالفة</TableHead>
                  <TableHead className="text-right">الموقع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="text-right font-mono">
                      {fine.violation_number || 'غير محدد'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fine.fine_amount?.toLocaleString() || 0} ر.ق
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.violation_date ? new Date(fine.violation_date).toLocaleDateString('ar-QA') : 'غير محدد'}
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.location || 'غير محدد'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(fine.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ملاحظة */}
      {fines.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            إجمالي قيمة المخالفات ({totalAmount.toLocaleString()} ر.ق) يتم احتسابها في الملخص المالي للمطالبة القانونية.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}  