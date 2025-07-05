import React from 'react';
import { useVehicleAgreements } from '@/hooks/use-vehicle-agreements';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface AgreementHistoryTabProps {
  vehicleId?: string;
}

export const AgreementHistoryTab: React.FC<AgreementHistoryTabProps> = ({ vehicleId }) => {
  const { agreements, isLoading, error } = useVehicleAgreements(vehicleId);
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className={`text-center text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
            <p>{language === 'ar' ? `خطأ في تحميل الاتفاقيات: ${error.message}` : `Error loading agreements: ${error.message}`}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!agreements || agreements.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className={`text-center text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
            <p>{language === 'ar' ? 'لا توجد اتفاقيات لهذه المركبة.' : 'No agreements found for this vehicle.'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusBadge = (status: string) => {
    const statusLabels = language === 'ar' ? {
      'active': 'نشطة',
      'closed': 'مكتملة',
      'cancelled': 'ملغاة',
      'pending': 'معلقة'
    } : {
      'active': 'Active',
      'completed': 'Completed', 
      'cancelled': 'Cancelled',
      'pending': 'Pending'
    };

    const label = statusLabels[status as keyof typeof statusLabels] || status;

    switch(status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{label}</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{label}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{label}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{label}</Badge>;
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {agreements.map((agreement) => (
        <Card key={agreement.id}>
          <CardContent className="p-4">
            <div className={`flex items-center justify-between mb-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <FileText className={`h-5 w-5 text-primary ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                <div className={language === 'ar' ? 'text-right' : ''}>
                  <h3 className="font-medium">
                    {language === 'ar' ? `اتفاقية #${agreement.id?.slice(0, 8)}` : `Agreement #${agreement.id?.slice(0, 8)}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {agreement.customer_name || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                  </p>
                </div>
              </div>
              {getStatusBadge(agreement.status || 'pending')}
            </div>
            
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ${language === 'ar' ? 'text-right' : ''}`}>
              <div>
                <p className="font-medium text-muted-foreground">
                  {language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                </p>
                <p>{formatDate(agreement.start_date)}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  {language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                </p>
                <p>{formatDate(agreement.end_date)}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  {language === 'ar' ? 'المدة' : 'Duration'}
                </p>
                <p>
                  {Math.ceil((new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 3600 * 24))} 
                  {language === 'ar' ? ' يوم' : ' days'}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
                </p>
                <p>{formatCurrency(agreement.total_amount || 0)} {language === 'ar' ? 'ر.ق' : ''}</p>
              </div>
            </div>
            
            <div className={`flex justify-end mt-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/agreements/${agreement.id}`)}
                className={language === 'ar' ? 'flex-row-reverse' : ''}
              >
                <Eye className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
