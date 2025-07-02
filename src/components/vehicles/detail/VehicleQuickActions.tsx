

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleQuickActionsProps {
  vehicle: any;
}

export const VehicleQuickActions: React.FC<VehicleQuickActionsProps> = ({ vehicle }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          className={`w-full ${language === 'ar' ? 'justify-end flex-row-reverse' : 'justify-start'}`}
          onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
        >
          <Edit className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'تحرير تفاصيل المركبة' : 'Edit Vehicle Details'}
        </Button>
      </CardContent>
    </Card>
  );
};
