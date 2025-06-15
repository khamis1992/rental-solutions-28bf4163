import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgreementOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (formData: any) => void;
}

export function AgreementOnboardingWizard({
  open,
  onClose,
  onComplete
}: AgreementOnboardingWizardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      const submissionData = {
        agreement_number: '',
        agreement_type: 'short_term',
        status: 'draft',
        customer_id: '',
        vehicle_id: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        total_amount: 0,
        deposit_amount: 0,
        rent_amount: 0,
        daily_late_fee: 120,
        payment_day: 1
      };
      
      onComplete(submissionData);
    } catch (error) {
      toast.error("فشل في معالجة بيانات الاتفاقية");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right" dir="rtl">إنشاء اتفاقية جديدة</DialogTitle>
          <DialogDescription className="text-right" dir="rtl">
            إنشاء اتفاقية إيجار جديدة خطوة بخطوة
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 text-center">
          <p className="text-muted-foreground">
            معالج إنشاء الاتفاقية قيد التطوير
          </p>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0" dir="rtl">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? 'جاري المعالجة...' : 'إنشاء اتفاقية'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
