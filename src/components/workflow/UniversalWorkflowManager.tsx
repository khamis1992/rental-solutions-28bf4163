import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Car, 
  FileText, 
  CreditCard,
  Wrench,
  Gavel,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Play,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// تعريف أنواع مسارات العمل
export type WorkflowType = 
  | 'complete-onboarding'     // رحلة كاملة: عميل → مركبة → عقد
  | 'customer-to-agreement'   // عميل → عقد  
  | 'vehicle-to-agreement'    // مركبة → عقد
  | 'maintenance-workflow'    // سير عمل الصيانة
  | 'legal-case-workflow'     // سير عمل قانوني
  | 'payment-workflow';      // سير عمل الدفعات

// تعريف خطوة مسار العمل
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'active' | 'completed' | 'error';
  required: boolean;
  component?: string;
  data?: any;
}

// تعريف مسار العمل
export interface Workflow {
  id: string;
  type: WorkflowType;
  title: string;
  description: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  isActive: boolean;
  startedAt?: Date;
  completedAt?: Date;
  data: { [key: string]: any };
}

// قوالب مسارات العمل
const WORKFLOW_TEMPLATES: { [K in WorkflowType]: Omit<Workflow, 'id' | 'isActive' | 'startedAt' | 'data'> } = {
  'complete-onboarding': {
    type: 'complete-onboarding',
    title: 'رحلة التأهيل الكاملة',
    description: 'إضافة عميل جديد، مركبة، وإنشاء عقد شامل',
    currentStepIndex: 0,
    steps: [
      {
        id: 'customer-creation',
        title: 'إضافة العميل',
        description: 'إنشاء ملف عميل جديد بجميع البيانات المطلوبة',
        icon: Users,
        status: 'active',
        required: true,
        component: 'CustomerOnboardingWizard'
      },
      {
        id: 'vehicle-selection',
        title: 'اختيار المركبة',
        description: 'اختيار مركبة متاحة أو إضافة مركبة جديدة',
        icon: Car,
        status: 'pending',
        required: true,
        component: 'VehicleSelectionStep'
      },
      {
        id: 'agreement-creation',
        title: 'إنشاء العقد',
        description: 'إعداد تفاصيل عقد الإيجار والشروط',
        icon: FileText,
        status: 'pending',
        required: true,
        component: 'AgreementCreationStep'
      },
      {
        id: 'payment-setup',
        title: 'إعداد الدفعات',
        description: 'تكوين جدول الدفعات والشروط المالية',
        icon: CreditCard,
        status: 'pending',
        required: true,
        component: 'PaymentSetupStep'
      },
      {
        id: 'review-confirm',
        title: 'المراجعة والتأكيد',
        description: 'مراجعة جميع البيانات وتأكيد إنشاء العقد',
        icon: CheckCircle,
        status: 'pending',
        required: true,
        component: 'ReviewConfirmStep'
      }
    ]
  },

  'customer-to-agreement': {
    type: 'customer-to-agreement',
    title: 'من العميل إلى العقد',
    description: 'إنشاء عقد جديد لعميل موجود',
    currentStepIndex: 0,
    steps: [
      {
        id: 'vehicle-selection',
        title: 'اختيار المركبة',
        description: 'اختيار المركبة المناسبة للعميل',
        icon: Car,
        status: 'active',
        required: true,
        component: 'VehicleSelectionStep'
      },
      {
        id: 'agreement-details',
        title: 'تفاصيل العقد',
        description: 'إدخال تفاصيل الاتفاقية والشروط',
        icon: FileText,
        status: 'pending',
        required: true,
        component: 'AgreementDetailsStep'
      },
      {
        id: 'payment-terms',
        title: 'شروط الدفع',
        description: 'تحديد شروط وجدولة الدفعات',
        icon: CreditCard,
        status: 'pending',
        required: true,
        component: 'PaymentTermsStep'
      },
      {
        id: 'finalize',
        title: 'إنهاء العقد',
        description: 'مراجعة نهائية وإنهاء الاتفاقية',
        icon: CheckCircle,
        status: 'pending',
        required: true,
        component: 'FinalizeAgreementStep'
      }
    ]
  },

  'vehicle-to-agreement': {
    type: 'vehicle-to-agreement',
    title: 'من المركبة إلى العقد',
    description: 'إنشاء عقد لمركبة محددة',
    currentStepIndex: 0,
    steps: [
      {
        id: 'customer-selection',
        title: 'اختيار العميل',
        description: 'اختيار أو إضافة عميل للمركبة',
        icon: Users,
        status: 'active',
        required: true,
        component: 'CustomerSelectionStep'
      },
      {
        id: 'agreement-terms',
        title: 'شروط العقد',
        description: 'تحديد شروط الإيجار والمدة',
        icon: FileText,
        status: 'pending',
        required: true,
        component: 'AgreementTermsStep'
      },
      {
        id: 'finalization',
        title: 'إنهاء العقد',
        description: 'إنهاء وتوقيع العقد',
        icon: CheckCircle,
        status: 'pending',
        required: true,
        component: 'ContractFinalizationStep'
      }
    ]
  },

  'maintenance-workflow': {
    type: 'maintenance-workflow',
    title: 'سير عمل الصيانة',
    description: 'إدارة عملية صيانة المركبة من البداية للنهاية',
    currentStepIndex: 0,
    steps: [
      {
        id: 'issue-assessment',
        title: 'تقييم المشكلة',
        description: 'تحديد نوع وشدة مشكلة المركبة',
        icon: Wrench,
        status: 'active',
        required: true,
        component: 'IssueAssessmentStep'
      },
      {
        id: 'cost-planning',
        title: 'تخطيط التكلفة',
        description: 'تحديد التكلفة المتوقعة والجدولة',
        icon: CreditCard,
        status: 'pending',
        required: true,
        component: 'CostPlanningStep'
      },
      {
        id: 'execution',
        title: 'تنفيذ الصيانة',
        description: 'تنفيذ أعمال الصيانة والمتابعة',
        icon: Wrench,
        status: 'pending',
        required: true,
        component: 'MaintenanceExecutionStep'
      },
      {
        id: 'completion',
        title: 'إنجاز المهمة',
        description: 'تسجيل إنجاز الصيانة وتحديث السجلات',
        icon: CheckCircle,
        status: 'pending',
        required: true,
        component: 'MaintenanceCompletionStep'
      }
    ]
  },

  'legal-case-workflow': {
    type: 'legal-case-workflow',
    title: 'سير العمل القانوني',
    description: 'إدارة القضايا القانونية خطوة بخطوة',
    currentStepIndex: 0,
    steps: [
      {
        id: 'case-assessment',
        title: 'تقييم القضية',
        description: 'تحليل الوضع القانوني وتحديد الإجراءات',
        icon: Gavel,
        status: 'active',
        required: true,
        component: 'CaseAssessmentStep'
      },
      {
        id: 'documentation',
        title: 'جمع الوثائق',
        description: 'تجميع وتنظيم المستندات المطلوبة',
        icon: FileText,
        status: 'pending',
        required: true,
        component: 'DocumentationStep'
      },
      {
        id: 'legal-action',
        title: 'الإجراء القانوني',
        description: 'تنفيذ الإجراء القانوني المناسب',
        icon: Gavel,
        status: 'pending',
        required: true,
        component: 'LegalActionStep'
      },
      {
        id: 'follow-up',
        title: 'المتابعة',
        description: 'متابعة تطورات القضية والإجراءات',
        icon: CheckCircle,
        status: 'pending',
        required: true,
        component: 'FollowUpStep'
      }
    ]
  },

  'payment-workflow': {
    type: 'payment-workflow',
    title: 'سير عمل الدفعات',
    description: 'إدارة عملية الدفع والتحصيل',
    currentStepIndex: 0,
    steps: [
      {
        id: 'payment-verification',
        title: 'التحقق من الدفعة',
        description: 'التأكد من صحة بيانات الدفعة والمبلغ',
        icon: CreditCard,
        status: 'active',
        required: true,
        component: 'PaymentVerificationStep'
      },
      {
        id: 'processing',
        title: 'معالجة الدفعة',
        description: 'تنفيذ عملية الدفع وتسجيلها',
        icon: CreditCard,
        status: 'pending',
        required: true,
        component: 'PaymentProcessingStep'
      },
      {
        id: 'confirmation',
        title: 'تأكيد الدفعة',
        description: 'تأكيد نجاح العملية وإرسال الإشعارات',
        icon: CheckCircle,
        status: 'pending',
        required: true,
        component: 'PaymentConfirmationStep'
      }
    ]
  }
};

interface UniversalWorkflowManagerProps {
  workflowType?: WorkflowType;
  initialData?: any;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  className?: string;
}

export const UniversalWorkflowManager: React.FC<UniversalWorkflowManagerProps> = ({
  workflowType,
  initialData = {},
  onComplete,
  onCancel,
  className
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // بدء مسار العمل
  useEffect(() => {
    if (workflowType) {
      startWorkflow(workflowType, initialData);
    }
  }, [workflowType, initialData]);

  const startWorkflow = (type: WorkflowType, data: any = {}) => {
    const template = WORKFLOW_TEMPLATES[type];
    const newWorkflow: Workflow = {
      ...template,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      startedAt: new Date(),
      data: { ...data }
    };
    
    setWorkflow(newWorkflow);
    toast.success(
      language === 'ar' 
        ? `تم بدء مسار العمل: ${template.title}`
        : `Started workflow: ${template.title}`
    );
  };

  const nextStep = async (stepData: any = {}) => {
    if (!workflow) return;

    setIsProcessing(true);
    
    try {
      // تحديث البيانات
      const updatedData = { ...workflow.data, ...stepData };
      
      // تحديث الخطوة الحالية كمكتملة
      const updatedSteps = workflow.steps.map((step, index) => {
        if (index === workflow.currentStepIndex) {
          return { ...step, status: 'completed' as const, data: stepData };
        }
        if (index === workflow.currentStepIndex + 1) {
          return { ...step, status: 'active' as const };
        }
        return step;
      });

      const updatedWorkflow: Workflow = {
        ...workflow,
        currentStepIndex: Math.min(workflow.currentStepIndex + 1, workflow.steps.length - 1),
        steps: updatedSteps,
        data: updatedData
      };

      setWorkflow(updatedWorkflow);

      // إذا كانت هذه الخطوة الأخيرة، أكمل مسار العمل
      if (workflow.currentStepIndex === workflow.steps.length - 1) {
        setTimeout(() => {
          completeWorkflow(updatedData);
        }, 500);
      }

      toast.success(
        language === 'ar' 
          ? 'تم الانتقال للخطوة التالية'
          : 'Moved to next step'
      );
    } catch (error) {
      console.error('Error in nextStep:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ أثناء الانتقال للخطوة التالية'
          : 'Error moving to next step'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const previousStep = () => {
    if (!workflow || workflow.currentStepIndex <= 0) return;

    const updatedSteps = workflow.steps.map((step, index) => {
      if (index === workflow.currentStepIndex) {
        return { ...step, status: 'pending' as const };
      }
      if (index === workflow.currentStepIndex - 1) {
        return { ...step, status: 'active' as const };
      }
      return step;
    });

    setWorkflow({
      ...workflow,
      currentStepIndex: workflow.currentStepIndex - 1,
      steps: updatedSteps
    });
  };

  const completeWorkflow = (finalData: any = {}) => {
    if (!workflow) return;

    const completedWorkflow: Workflow = {
      ...workflow,
      isActive: false,
      completedAt: new Date(),
      data: { ...workflow.data, ...finalData }
    };

    setWorkflow(completedWorkflow);

    toast.success(
      language === 'ar' 
        ? `تم إنجاز مسار العمل: ${workflow.title}`
        : `Workflow completed: ${workflow.title}`
    );

    // استدعاء دالة الإنجاز
    onComplete?.(completedWorkflow.data);

    // التنقل حسب نوع مسار العمل
    setTimeout(() => {
      switch (workflow.type) {
        case 'complete-onboarding':
        case 'customer-to-agreement':
        case 'vehicle-to-agreement':
          navigate('/agreements');
          break;
        case 'maintenance-workflow':
          navigate('/maintenance');
          break;
        case 'legal-case-workflow':
          navigate('/legal');
          break;
        case 'payment-workflow':
          navigate('/financials');
          break;
        default:
          navigate('/dashboard');
      }
    }, 2000);
  };

  const resetWorkflow = () => {
    setWorkflow(null);
    toast.info(
      language === 'ar' 
        ? 'تم إعادة تعيين مسار العمل'
        : 'Workflow reset'
    );
  };

  const getProgressPercentage = (): number => {
    if (!workflow) return 0;
    const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / workflow.steps.length) * 100);
  };

  const getCurrentStep = (): WorkflowStep | null => {
    if (!workflow) return null;
    return workflow.steps[workflow.currentStepIndex] || null;
  };

  if (!workflow) {
    return (
      <Card className={cn("w-full", className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <Play className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700">
              {language === 'ar' ? 'لا يوجد مسار عمل نشط' : 'No active workflow'}
            </h3>
            <p className="text-sm text-gray-500">
              {language === 'ar' 
                ? 'اختر نوع مسار العمل للبدء'
                : 'Select a workflow type to start'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStep = getCurrentStep();
  const isLastStep = workflow.currentStepIndex === workflow.steps.length - 1;
  const isFirstStep = workflow.currentStepIndex === 0;

  return (
    <Card className={cn("w-full", className)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <div className={cn(
          "flex items-center justify-between",
          language === 'ar' ? 'flex-row-reverse' : ''
        )}>
          <div>
            <CardTitle className={cn(
              "flex items-center gap-2",
              language === 'ar' ? 'flex-row-reverse text-right' : ''
            )}>
              <Play className="h-5 w-5 text-blue-500" />
              <span>{workflow.title}</span>
              <Badge variant={workflow.isActive ? "default" : "secondary"}>
                {workflow.isActive 
                  ? (language === 'ar' ? 'نشط' : 'Active')
                  : (language === 'ar' ? 'مكتمل' : 'Completed')
                }
              </Badge>
            </CardTitle>
            <p className={cn(
              "text-sm text-gray-600 mt-1",
              language === 'ar' ? 'text-right' : ''
            )}>
              {workflow.description}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetWorkflow}
            className={cn(
              "flex items-center gap-1",
              language === 'ar' ? 'flex-row-reverse' : ''
            )}
          >
            <RotateCcw className="h-4 w-4" />
            <span>{language === 'ar' ? 'إعادة تعيين' : 'Reset'}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* شريط التقدم */}
        <div className="space-y-2">
          <div className={cn(
            "flex justify-between text-sm",
            language === 'ar' ? 'flex-row-reverse' : ''
          )}>
            <span className="font-medium">
              {language === 'ar' ? 'التقدم' : 'Progress'}
            </span>
            <span className="text-gray-600">
              {getProgressPercentage()}% ({workflow.steps.filter(s => s.status === 'completed').length}/{workflow.steps.length})
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* مؤشر الخطوات */}
        <div className={cn(
          "flex items-center gap-4 overflow-x-auto pb-2",
          language === 'ar' ? 'flex-row-reverse' : ''
        )}>
          {workflow.steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === workflow.currentStepIndex;
            const isCompleted = step.status === 'completed';
            const isError = step.status === 'error';
            
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    isActive && 'border-blue-500 bg-blue-50',
                    isCompleted && 'border-green-500 bg-green-50',
                    isError && 'border-red-500 bg-red-50',
                    !isActive && !isCompleted && !isError && 'border-gray-200 bg-gray-50'
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      isActive && 'bg-blue-500 text-white',
                      isCompleted && 'bg-green-500 text-white',
                      isError && 'bg-red-500 text-white',
                      !isActive && !isCompleted && !isError && 'bg-gray-300 text-gray-600'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700 max-w-20 truncate">
                      {step.title}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs mt-1",
                        isActive && 'border-blue-500 text-blue-700',
                        isCompleted && 'border-green-500 text-green-700',
                        isError && 'border-red-500 text-red-700'
                      )}
                    >
                      {index + 1}
                    </Badge>
                  </div>
                </div>
                
                {index < workflow.steps.length - 1 && (
                  <ArrowRight className={cn(
                    "h-4 w-4 text-gray-400 mx-2 flex-shrink-0",
                    language === 'ar' && 'rotate-180'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* تفاصيل الخطوة الحالية */}
        {currentStep && (
          <Alert>
            <currentStep.icon className="h-4 w-4" />
            <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
              <div className="space-y-2">
                <h4 className="font-medium">{currentStep.title}</h4>
                <p className="text-sm text-gray-600">{currentStep.description}</p>
                {currentStep.required && (
                  <Badge variant="secondary" className="text-xs">
                    {language === 'ar' ? 'مطلوب' : 'Required'}
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* أزرار التحكم */}
        <div className={cn(
          "flex gap-3 pt-4 border-t",
          language === 'ar' ? 'flex-row-reverse' : ''
        )}>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          )}
          
          {!isFirstStep && (
            <Button 
              variant="outline" 
              onClick={previousStep}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-1",
                language === 'ar' ? 'flex-row-reverse' : ''
              )}
            >
              <ArrowLeft className={cn("h-4 w-4", language === 'ar' && 'rotate-180')} />
              <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
            </Button>
          )}
          
          <Button 
            onClick={() => nextStep()}
            disabled={isProcessing}
            className={cn(
              "flex items-center gap-1",
              isLastStep && 'bg-green-600 hover:bg-green-700',
              language === 'ar' ? 'flex-row-reverse' : ''
            )}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLastStep ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <ArrowRight className={cn("h-4 w-4", language === 'ar' && 'rotate-180')} />
            )}
            <span>
              {isProcessing 
                ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...')
                : isLastStep 
                  ? (language === 'ar' ? 'إنهاء' : 'Complete')
                  : (language === 'ar' ? 'التالي' : 'Next')
              }
            </span>
          </Button>
        </div>

        {/* معلومات إضافية */}
        {workflow.startedAt && (
          <div className={cn(
            "text-xs text-gray-500 pt-2 border-t",
            language === 'ar' ? 'text-right' : ''
          )}>
            {language === 'ar' ? 'بدأ في:' : 'Started at:'} {workflow.startedAt.toLocaleString(language === 'ar' ? 'ar-QA' : 'en-US')}
            {workflow.completedAt && (
              <span className="block">
                {language === 'ar' ? 'اكتمل في:' : 'Completed at:'} {workflow.completedAt.toLocaleString(language === 'ar' ? 'ar-QA' : 'en-US')}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 