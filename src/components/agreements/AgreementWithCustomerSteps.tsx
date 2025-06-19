import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, FileText, ArrowLeft } from 'lucide-react';
import { CustomerOnboardingWizard } from '@/components/customers/CustomerOnboardingWizard';
import AgreementForm from './AgreementForm';
import { CustomerInfo } from '@/types/customer';
import { Agreement } from '@/types/agreement';
import { Customer } from '@/lib/validation-schemas/customer';
import { useCustomers } from '@/hooks/use-customers';
import { toast } from 'sonner';

interface AgreementWithCustomerStepsProps {
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
}

type Step = 'customer-choice' | 'agreement-creation';

const AgreementWithCustomerSteps: React.FC<AgreementWithCustomerStepsProps> = ({
  onSubmit,
  isSubmitting = false
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('customer-choice');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [customerWizardOpen, setCustomerWizardOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const { createCustomer } = useCustomers();

  const steps = [
    { id: 'customer-choice', title: 'اختيار العميل', icon: Users },
    { id: 'agreement-creation', title: 'تفاصيل الاتفاقية', icon: FileText }
  ];

  const handleCustomerChoice = (choice: 'existing' | 'new') => {
    if (choice === 'existing') {
      setCurrentStep('agreement-creation');
    } else {
      setCustomerWizardOpen(true);
    }
  };

  const handleCustomerCreation = async (customerData: Customer) => {
    setCreatingCustomer(true);
    try {
      const newCustomer = await createCustomer.mutateAsync(customerData);
      
      // Convert the created customer to CustomerInfo format
      const customerInfo: CustomerInfo = {
        id: newCustomer.id || '',
        full_name: newCustomer.full_name || '',
        email: newCustomer.email,
        phone_number: newCustomer.phone || '',
        driver_license: newCustomer.driver_license || '',
        nationality: newCustomer.nationality || '',
        address: newCustomer.address || ''
      };
      
      setSelectedCustomer(customerInfo);
      setCustomerWizardOpen(false);
      setCurrentStep('agreement-creation');
      toast.success('تم إنشاء العميل بنجاح');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('فشل في إنشاء العميل', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      });
    } finally {
      setCreatingCustomer(false);
    }
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  if (currentStep === 'customer-choice') {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = getCurrentStepIndex() > index;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`mr-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowLeft className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Customer Choice Step */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Users className="w-5 h-5" />
              اختر طريقة إضافة العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-right">
                يمكنك اختيار عميل موجود في النظام أو إنشاء عميل جديد الآن. 
                إذا اخترت إنشاء عميل جديد، ستنتقل إلى نموذج إنشاء العميل أولاً، 
                ثم ستعود تلقائياً لإنشاء الاتفاقية مع بيانات العميل الجديد.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer border-2 hover:border-blue-500 transition-colors" 
                    onClick={() => handleCustomerChoice('existing')}>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium">اختيار عميل موجود</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      اختر من قائمة العملاء المسجلين في النظام
                    </p>
                    <Badge variant="secondary">الخيار الأسرع</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer border-2 hover:border-green-500 transition-colors"
                    onClick={() => handleCustomerChoice('new')}>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">إنشاء عميل جديد</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      إنشاء سجل عميل جديد قبل إنشاء الاتفاقية
                    </p>
                    <Badge variant="outline">خطوة إضافية</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Customer Creation Wizard */}
        <CustomerOnboardingWizard
          open={customerWizardOpen}
          onClose={() => setCustomerWizardOpen(false)}
          onComplete={handleCustomerCreation}
        />
      </div>
    );
  }

  if (currentStep === 'agreement-creation') {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 space-x-reverse mb-8">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = getCurrentStepIndex() > index;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`mr-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowLeft className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Customer Display */}
        {selectedCustomer && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">تم اختيار العميل: {selectedCustomer.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCustomer.phone_number && `الهاتف: ${selectedCustomer.phone_number}`}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentStep('customer-choice')}>
                  تغيير العميل
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Agreement Form with Preselected Customer */}
        <AgreementForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          initialData={selectedCustomer ? {
            customer_id: selectedCustomer.id,
            customers: selectedCustomer
          } as any : undefined}
        />
      </div>
    );
  }

  return null;
};

export default AgreementWithCustomerSteps; 