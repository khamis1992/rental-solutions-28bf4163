import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleQuickActionsProps {
  vehicle: any;
}

export const VehicleQuickActions: React.FC<VehicleQuickActionsProps> = ({ vehicle }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAvailable = vehicle.status === 'available';

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
          onClick={() => navigate(`/maintenance/add?vehicle_id=${vehicle.id}`)}
        >
          <Wrench className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'إضافة سجل صيانة' : 'Add Maintenance Record'}
        </Button>
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
