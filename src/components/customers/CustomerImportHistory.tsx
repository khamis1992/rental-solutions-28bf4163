import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Download, RefreshCw, FileDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface ImportRecord {
  id: string;
  file_name: string;
  original_file_name: string | null;
  status: string | null;
  row_count: number | null;
  processed_count: number | null;
  error_count: number | null;
  created_at: string | null;
}

export const CustomerImportHistory: React.FC = () => {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch import history on component mount
  useEffect(() => {
    fetchImportHistory();
  }, []);
  
  // Function to fetch import history from Supabase
  const fetchImportHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching import history:', error);
        return;
      }
      
      setImports(data || []);
    } catch (error) {
      console.error('Unexpected error fetching import history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to get status badge based on status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge variant="default">مكتمل</Badge>;
      case 'processing':
        return <Badge variant="secondary">قيد المعالجة</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">قيد الانتظار</Badge>;
    }
  };
  
  // Loading skeleton
  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>سجل الاستيراد</CardTitle>
          <CardDescription>أحدث عمليات استيراد بيانات العملاء</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الملف</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>عدد السجلات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (!imports || imports.length === 0) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>سجل الاستيراد</CardTitle>
          <CardDescription>أحدث عمليات استيراد بيانات العملاء</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileDown className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">لا يوجد سجل استيراد</h3>
            <p className="text-muted-foreground mb-4">
              لم تقم باستيراد أي بيانات عملاء بعد.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="text-right">
          <CardTitle>سجل الاستيراد</CardTitle>
          <CardDescription>أحدث عمليات استيراد بيانات العملاء</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex flex-row-reverse items-center gap-1" 
          onClick={fetchImportHistory}
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الملف</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>عدد السجلات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((importRecord) => (
                <TableRow key={importRecord.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{importRecord.original_file_name || importRecord.file_name}</span>
                      {(importRecord.error_count ?? 0) > 0 && (
                        <div className="flex items-center text-xs text-red-600 mt-1">
                          <AlertCircle className="h-3 w-3 ml-1" />
                          {importRecord.error_count} أخطاء
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <span>{formatDistanceToNow(new Date(importRecord.created_at || Date.now()), { addSuffix: true, locale: undefined })}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{(importRecord.processed_count ?? 0)}/{importRecord.row_count ?? 0}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(((importRecord.processed_count ?? 0) / Math.max(1, importRecord.row_count ?? 0)) * 100)}% مكتمل
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(importRecord.status || 'pending')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">تنزيل</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
