
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { isValidDatabaseId } from '@/lib/database/validation';
import { useEffect, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from '@/components/ui/PageHeader';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isValidId, setIsValidId] = useState(true);
  const { language } = useLanguage();
  
  // Validate ID format
  useEffect(() => {
    if (id && !isValidDatabaseId(id)) {
      console.warn(`Invalid customer ID format: ${id}`);
      setIsValidId(false);
    } else {
      setIsValidId(true);
    }
  }, [id]);
  
  return (
    <PageContainer systemDate={new Date()}>
      <PageHeader
        title={language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}
        subtitle={language === 'ar' ? 'عرض المعلومات التفصيلية للعميل' : 'View detailed information about the customer'}
        icon={<Users className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      
      {!isValidId ? (
        <Alert variant="destructive" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertTriangle className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'خطأ' : 'Error'}
          </AlertTitle>
          <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' 
              ? 'تنسيق معرف العميل غير صحيح. يرجى العودة إلى قائمة العملاء والمحاولة مرة أخرى.'
              : 'Invalid customer ID format. Please return to the customers list and try again.'
            }
          </AlertDescription>
        </Alert>
      ) : !id ? (
        <Alert variant="destructive" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertTriangle className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <AlertTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'خطأ' : 'Error'}
          </AlertTitle>
          <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' 
              ? 'لم يتم توفير معرف العميل. يرجى العودة إلى قائمة العملاء وتحديد عميل.'
              : 'No customer ID provided. Please return to the customers list and select a customer.'
            }
          </AlertDescription>
        </Alert>
      ) : (
        <CustomerDetail customerId={id} />
      )}
    </PageContainer>
  );
};

export default CustomerDetailPage;
