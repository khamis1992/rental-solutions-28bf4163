import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, Calendar, Plus } from 'lucide-react';

interface LegalQuickActionsProps {
  onNewCase?: () => void;
  onViewCalendar?: () => void;
  onGenerateDocument?: () => void;
  onViewAlerts?: () => void;
}

const LegalQuickActions: React.FC<LegalQuickActionsProps> = ({
  onNewCase,
  onViewCalendar,
  onGenerateDocument,
  onViewAlerts
}) => {
  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="text-right">الإجراءات السريعة القانونية</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="flex-col h-20 gap-2"
            onClick={onNewCase}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">قضية جديدة</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex-col h-20 gap-2"
            onClick={onViewCalendar}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">التقويم القانوني</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex-col h-20 gap-2"
            onClick={onGenerateDocument}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">إنشاء وثيقة</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex-col h-20 gap-2"
            onClick={onViewAlerts}
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs">التنبيهات</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LegalQuickActions;
