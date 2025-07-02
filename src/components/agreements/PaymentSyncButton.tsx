
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/TooltipWrapper";
import { usePaymentSync } from "@/hooks/payment/use-payment-sync";
import { paymentSyncService } from "@/services/PaymentSyncService";
import { RefreshCw, Settings, Zap, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentSyncButtonProps {
  agreementId: string;
  variant?: "sync" | "fix";
  className?: string;
}

export function PaymentSyncButton({ 
  agreementId, 
  variant = "sync",
  className = ""
}: PaymentSyncButtonProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const { 
    fixDuplicatePayments,
    syncPaymentSchedule,
    isPending 
  } = usePaymentSync();

  // Helper function to format error messages properly
  const formatErrorMessage = (error: any): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      if (error.message) return error.message;
      try {
        return JSON.stringify(error);
      } catch {
        return 'خطأ في البيانات';
      }
    }
    return 'خطأ غير معروف';
  };

  // Handle comprehensive payment sync fix
  const handleDeepFix = async () => {
    setIsFixing(true);
    try {
      toast.info("🔄 جاري تشغيل مزامنة شاملة للمدفوعات...", {
        description: "سيتم إنشاء جدول الدفعات ومزامنة البيانات"
      });
      
      const result = await paymentSyncService.fixAgreementPaymentSync(agreementId);
      
      if (result.success && result.data) {
        const { data } = result;
        const message = `✅ تمت المزامنة بنجاح!`;
        const description = `تم إنشاء ${data.scheduleItems} عنصر جدولة و ${data.unifiedPaymentsCreated} سجل دفع`;
        
        toast.success(message, {
          description,
          duration: 5000
        });
        
        // إذا تم إنشاء عناصر جديدة، أعلم المستخدم
        if (data.generatedScheduleItems && data.generatedScheduleItems > 0) {
          toast.info(`📅 تم إنشاء ${data.generatedScheduleItems} عنصر جدولة جديد`, {
            description: "جدول الدفعات أصبح جاهزاً حسب تاريخ البداية والانتهاء"
          });
        }
      } else {
        const errorMessage = formatErrorMessage(result.error);
        toast.error("❌ فشل في مزامنة المدفوعات", {
          description: errorMessage,
          duration: 6000
        });
      }
    } catch (error) {
      console.error("Error fixing payment sync:", error);
      const errorMessage = formatErrorMessage(error);
      toast.error("❌ خطأ في مزامنة المدفوعات", {
        description: errorMessage,
        duration: 6000
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Check payment sync status
  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const result = await paymentSyncService.getPaymentSyncStatus(agreementId);
      if (result.success && result.data) {
        const { data } = result;
        toast.info("📊 حالة المزامنة", {
          description: `جدولة الدفعات: ${data.scheduleTables.payment_schedules} | الدفعات المتحدة: ${data.scheduleTables.unified_payments}`,
          duration: 4000
        });
      } else {
        const errorMessage = formatErrorMessage(result.error);
        toast.error("❌ فشل في فحص حالة المزامنة", {
          description: errorMessage
        });
      }
    } catch (error) {
      console.error("Error checking sync status:", error);
      const errorMessage = formatErrorMessage(error);
      toast.error("❌ خطأ في فحص حالة المزامنة", {
        description: errorMessage
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  // Handle basic sync for existing data
  const handleSync = async () => {
    try {
      toast.info("🔄 جاري مزامنة المدفوعات...");
      await syncPaymentSchedule.mutateAsync(agreementId);
      toast.success("✅ تمت مزامنة المدفوعات بنجاح");
    } catch (error) {
      console.error("Error syncing payments:", error);
      const errorMessage = formatErrorMessage(error);
      toast.error("❌ فشل في مزامنة المدفوعات", {
        description: errorMessage
      });
    }
  };
  
  // Fix duplicate payments
  const handleFixDuplicates = async () => {
    setIsDebugging(true);
    try {
      toast.info("🔍 جاري فحص المدفوعات المكررة...");
      await fixDuplicatePayments.mutateAsync(agreementId);
      toast.success("✅ تم إصلاح المدفوعات المكررة");
    } catch (error) {
      console.error("Error fixing duplicates:", error);
      const errorMessage = formatErrorMessage(error);
      
      if (errorMessage.includes('fix_duplicate_payments')) {
        toast.warning("⚠️ وظيفة إصلاح المدفوعات المكررة غير متاحة", {
          description: "يرجى التواصل مع الدعم الفني"
        });
      } else {
        toast.error("❌ فشل في إصلاح المدفوعات المكررة", {
          description: errorMessage
        });
      }
    } finally {
      setIsDebugging(false);
    }
  };
  
  if (variant === "fix") {
    return (
      <div className="flex gap-1 flex-row-reverse" dir="rtl">
        <TooltipWrapper content="إصلاح شامل لمزامنة المدفوعات - ينشئ جدول الدفعات حسب تاريخ البداية والانتهاء">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeepFix}
            disabled={isFixing}
            className={className}
          >
            <Zap className={`h-4 w-4 ml-1 ${isFixing ? "animate-pulse" : ""}`} />
            {isFixing ? "جاري الإصلاح..." : "إصلاح المزامنة"}
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="فحص حالة المزامنة الحالية وعدد عناصر الجدولة">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className={className}
          >
            <Info className={`h-4 w-4 ${isChecking ? "animate-pulse" : ""}`} />
          </Button>
        </TooltipWrapper>
      </div>
    );
  }
  
  return (
    <div className="flex gap-1 flex-row-reverse" dir="rtl">
      <TooltipWrapper content="مزامنة المدفوعات والجداول الموجودة لهذا العقد">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={isPending.sync}
          className={className}
        >
          <RefreshCw className={`h-4 w-4 ml-1 ${isPending.sync ? "animate-spin" : ""}`} />
          {isPending.sync ? "جاري المزامنة..." : "مزامنة"}
        </Button>
      </TooltipWrapper>
      <TooltipWrapper content="إصلاح المدفوعات المكررة لهذا العقد">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleFixDuplicates}
          disabled={isDebugging}
          className={className}
        >
          <Settings className={`h-4 w-4 ${isDebugging ? "animate-spin" : ""}`} />
        </Button>
      </TooltipWrapper>
    </div>
  );
}
