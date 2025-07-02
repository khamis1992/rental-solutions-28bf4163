import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/date-utils';
import { AlertTriangle, Loader2, Plus, Gavel, FileDown } from 'lucide-react';
import { CustomerObligation, fetchCustomerObligations } from './CustomerLegalObligations';
import { generateLegalCustomerReport } from '@/utils/legalReportUtils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface LegalObligationsTabProps {
  customerId: string;
}

const LegalObligationsTab: React.FC<LegalObligationsTabProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    case_type: '',
    priority: 'medium',
    description: '',
    amount_owed: 0
  });

  // Function to load obligations
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

  // Added console logs for debugging
  useEffect(() => {
    console.log("LegalObligationsTab: useEffect triggered with customerId:", customerId);
    loadObligations();
  }, [customerId]); // Keep customerId in dependency // array - removed unused variable// Handle creating new legal case
  const handleCreateLegalCase = async () => {
    if (!newCaseForm.case_type || !newCaseForm.description.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsCreatingCase(true);
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .insert([
          {
            customer_id: customerId,
            case_type: newCaseForm.case_type,
            priority: newCaseForm.priority,
            description: newCaseForm.description,
            amount_owed: newCaseForm.amount_owed,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('تم إنشاء القضية القانونية بنجاح');
      setShowNewCaseDialog(false);
      setNewCaseForm({
        case_type: '',
        priority: 'medium',
        description: '',
        amount_owed: 0
      });
      
      // Refresh obligations to include the new case
      loadObligations();
    } catch (error: any) {
      console.error('Error creating legal case:', error);
      toast.error('فشل في إنشاء القضية القانونية: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsCreatingCase(false);
    }
  };

  // Handle generating legal report
  const handleGenerateReport = async () => {
    if (obligations.length === 0) {
      toast.error('لا توجد التزامات لإنشاء تقرير');
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Get customer name
      const { data: customerData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', customerId)
        .single();
      
      const customerName = customerData?.full_name || 'Unknown Customer';
      
      console.log('Starting legal report generation...');
      const pdf = await generateLegalCustomerReport(customerId, customerName, obligations);
      
      console.log('PDF generated successfully, downloading...');
      pdf.save(`legal-obligations-report-${customerName.replace(/\s+/g, '-')}.pdf`);
      
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error: any) {
      console.error('Error generating legal report:', error);
      toast.error('فشل في إنشاء التقرير: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
    <>
      <Card className="shadow-sm" dir="rtl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <CardTitle className="text-lg font-semibold text-left flex items-center gap-2 flex-row-reverse">
                <Gavel className="w-5 h-5" />
                الالتزامات القانونية
              </CardTitle>
              <CardDescription className="text-left mt-1">
                الالتزامات القانونية والمالية الحالية للعميل
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-row-reverse">
              <Button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || obligations.length === 0}
                className="flex items-center gap-2 flex-row-reverse"
                variant="outline"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري إنشاء التقرير...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    تقرير PDF
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setShowNewCaseDialog(true)}
                className="flex items-center gap-2 flex-row-reverse"
              >
                <Gavel className="w-4 h-4" />
                فتح قضية قانونية
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        {obligations.length > 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 text-left">
              قائمة الالتزامات القانونية
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.map((obligation) => (
                  <TableRow key={obligation.id}>
                    <TableCell className="text-right">{obligation.description}</TableCell>
                    <TableCell className="text-right">
                      {obligation.dueDate ? formatDate(obligation.dueDate) : 'غير متوفر'}
                    </TableCell>
                    <TableCell className="text-right">{getStatusBadge(obligation.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                لا توجد التزامات قانونية لهذا العميل
              </h4>
              <p className="text-xs text-muted-foreground">
                عند وجود التزامات قانونية أو مالية، ستظهر هنا مع تفاصيلها الكاملة
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Create Legal Case Dialog */}
    <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">فتح قضية قانونية جديدة</DialogTitle>
          <DialogDescription className="text-right">
            إنشاء قضية قانونية جديدة لهذا العميل
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-right block mb-2">نوع القضية</label>
            <Select 
              value={newCaseForm.case_type} 
              onValueChange={(value) => setNewCaseForm(prev => ({ ...prev, case_type: value }))}
            >
              <SelectTrigger dir="rtl" className="text-right">
                <SelectValue placeholder="اختر نوع القضية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment_collection">تحصيل مدفوعات</SelectItem>
                <SelectItem value="traffic_fine_collection">تحصيل مخالفات مرورية</SelectItem>
                <SelectItem value="contract_breach">خرق عقد</SelectItem>
                <SelectItem value="vehicle_damage">ضرر المركبة</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-right block mb-2">الأولوية</label>
            <Select 
              value={newCaseForm.priority} 
              onValueChange={(value) => setNewCaseForm(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger dir="rtl" className="text-right">
                <SelectValue placeholder="اختر الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-right block mb-2">المبلغ المستحق (ريال قطري)</label>
            <input
              type="number"
              value={newCaseForm.amount_owed}
              onChange={(e) => setNewCaseForm(prev => ({ ...prev, amount_owed: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
              dir="rtl"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-right block mb-2">وصف القضية</label>
            <Textarea
              value={newCaseForm.description}
              onChange={(e) => setNewCaseForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="أدخل تفاصيل القضية..."
              className="min-h-[100px] text-right"
              dir="rtl"
            />
          </div>

          <div className="flex gap-2 justify-end flex-row-reverse pt-4">
            <Button
              variant="outline"
              onClick={() => setShowNewCaseDialog(false)}
              disabled={isCreatingCase}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateLegalCase}
              disabled={isCreatingCase || !newCaseForm.case_type || !newCaseForm.description.trim()}
            >
              {isCreatingCase ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Plus className="ml-2 h-4 w-4" />
                  فتح القضية
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};

export default LegalObligationsTab;
