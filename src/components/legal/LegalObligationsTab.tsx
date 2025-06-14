import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CustomerObligation, fetchCustomerObligations } from './CustomerLegalObligations';
import { supabase } from '@/lib/supabase';

interface LegalObligationsTabProps {
  customerId: string;
}

const LegalObligationsTab: React.FC<LegalObligationsTabProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Added console logs for debugging
  useEffect(() => {
    console.log("LegalObligationsTab: useEffect triggered with customerId:", customerId);
    
    const loadObligations = async () => {
      if (!customerId) {
        console.error("LegalObligationsTab: No customer ID provided");
        setLoading(false);
        setError("No customer ID provided");
        return;
      }
      
      try {
        setLoading(true);
        const obligations = await fetchCustomerObligations(customerId);
        setObligations(obligations);
        setError(null);
      } catch (err: any) {
        console.error("LegalObligationsTab: Failed to load legal obligations:", err);
        setError(err.message || "Failed to load legal obligations");
      } finally {
        setLoading(false);
      }
    };

    loadObligations();
  }, [customerId]); // Keep customerId in dependency array

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">مكتمل</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500 hover:bg-blue-600">قيد الانتظار</Badge>;
      case 'overdue':
        return <Badge variant="destructive">متأخر</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>التزامات العميل</CardTitle>
          <CardDescription>جاري تحميل الالتزامات القانونية للعميل...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>التزامات العميل</CardTitle>
          <CardDescription>حدث خطأ ما</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-destructive">
            <AlertTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>الالتزامات القانونية</CardTitle>
        <CardDescription>الالتزامات القانونية والمالية الحالية للعميل</CardDescription>
      </CardHeader>
      <CardContent>
        {obligations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوصف</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.map((obligation) => (
                <TableRow key={obligation.id}>
                  <TableCell>{obligation.description}</TableCell>
                  <TableCell>
                    {obligation.dueDate ? formatDate(obligation.dueDate) : 'غير متوفر'}
                  </TableCell>
                  <TableCell>{getStatusBadge(obligation.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد التزامات قانونية لهذا العميل
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalObligationsTab;
