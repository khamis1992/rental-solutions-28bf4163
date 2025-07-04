import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertTriangle, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { hasData } from '@/utils/supabase-type-helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { errorLogger } from '@/lib/errors/error-logger';

export interface LegalCaseCardProps {
  agreementId: string;
}

export default function LegalCaseCard({ agreementId }: LegalCaseCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [legalCase, setLegalCase] = useState(null as any);
  const [customerInfo, setCustomerInfo] = useState(null as any);
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLegalCase();
  }, [agreementId]);

  const fetchLegalCase = async () => {
    try {
      setIsLoading(true);
      
      // First get the customer ID from the agreement
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', agreementId)
        .single();
        
      if (agreementError) {
        errorLogger.logError(new Error("Error fetching agreement"), {
          context: 'LegalCaseCard.fetchLegalCase',
          agreementId,
          error: agreementError
        });
        return;
      }
      
      if (!agreementData?.customer_id) {
        errorLogger.logError(new Error("No customer ID found for agreement"), {
          context: 'LegalCaseCard.fetchLegalCase',
          agreementId,
          agreementData
        });
        return;
      }
      
      // Get customer info
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .eq('id', agreementData.customer_id)
        .single();
        
      if (!customerError && customerData) {
        setCustomerInfo(customerData);
      }
      
      // Get legal case for this customer
      const { data: caseData, error: caseError } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('customer_id', agreementData.customer_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (caseError) {
        errorLogger.logError(new Error("Error fetching legal case"), {
          context: 'LegalCaseCard.fetchLegalCase',
          customerId: agreementData.customer_id,
          error: caseError
        });
        return;
      }
      
      if (caseData && caseData.length > 0) {
        setLegalCase(caseData[0]);
      }
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'LegalCaseCard.fetchLegalCase',
        agreementId
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { 
        variant: 'secondary' as const, 
        icon: Clock, 
        color: 'text-yellow-600',
        label: 'معلق'
      },
      'in_progress': { 
        variant: 'default' as const, 
        icon: AlertTriangle, 
        color: 'text-blue-600',
        label: 'قيد التنفيذ'
      },
      'resolved': { 
        variant: 'default' as const, 
        icon: CheckCircle2, 
        color: 'text-green-600',
        label: 'محلول'
      },
      'closed': { 
        variant: 'outline' as const, 
        icon: FileText, 
        color: 'text-gray-600',
        label: 'مغلق'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { variant: 'outline' as const, color: 'text-green-600', label: 'منخفض' },
      'medium': { variant: 'secondary' as const, color: 'text-yellow-600', label: 'متوسط' },
      'high': { variant: 'destructive' as const, color: 'text-red-600', label: 'عالي' },
      'urgent': { variant: 'destructive' as const, color: 'text-red-800', label: 'عاجل' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleResolveCase = async () => {
    if (!legalCase || !resolutionNotes.trim()) {
      toast.error('يرجى إدخال ملاحظات الحل');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('legal_cases')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', legalCase.id);

      if (error) throw error;

      toast.success('تم حل القضية بنجاح');
      setIsResolutionDialogOpen(false);
      setResolutionNotes('');
      fetchLegalCase(); // Refresh the data
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'LegalCaseCard.handleResolveCase',
        legalCaseId: legalCase.id,
        resolutionNotes
      });
      toast.error('فشل في حل القضية');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="text-right">معلومات القضية القانونية</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!legalCase) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="text-right">معلومات القضية القانونية</CardTitle>
          <CardDescription className="text-right">لم يتم العثور على قضايا قانونية لهذا العقد</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لم يتم رفع أي قضايا قانونية لهذا العميل.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="text-right">
            <CardTitle className="text-right">معلومات القضية القانونية</CardTitle>
            <CardDescription className="text-right">تفاصيل القضية القانونية الخاصة بهذا العقد</CardDescription>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            {getStatusBadge(legalCase.status)}
            {legalCase.priority && getPriorityBadge(legalCase.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">نوع القضية</h3>
              <p>{legalCase.case_type || 'غير محدد'}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">المبلغ المستحق</h3>
              <p className="font-semibold text-red-600">
                {legalCase.amount_owed ? `${legalCase.amount_owed.toLocaleString('en-US')} ر.ق` : 'غير محدد'}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">تاريخ الإنشاء</h3>
              <p>{legalCase.created_at ? format(new Date(legalCase.created_at), 'PPP') : 'غير محدد'}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">مكلف إلى</h3>
              <p>{legalCase.assigned_to || 'غير مكلف'}</p>
            </div>
          </div>
          
          <div className="text-right">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">الوصف</h3>
            <p className="text-sm whitespace-pre-line">{legalCase.description || 'لم يتم تقديم وصف'}</p>
          </div>
          
          {legalCase.status !== 'resolved' && legalCase.status !== 'closed' && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => setIsResolutionDialogOpen(true)}
                variant="outline"
                size="sm"
                className="text-right"
              >
                حل القضية
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Resolution Dialog */}
      <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">حل القضية القانونية</DialogTitle>
            <DialogDescription className="text-right">
              يرجى إدخال ملاحظات حول كيفية حل هذه القضية.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="أدخل ملاحظات الحل..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="min-h-[100px] text-right"
            />
          </div>
          <DialogFooter className="flex gap-2 flex-row-reverse">
            <Button
              variant="outline"
              onClick={() => setIsResolutionDialogOpen(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleResolveCase}
              disabled={isSubmitting || !resolutionNotes.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحل...
                </>
              ) : (
                'حل القضية'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
