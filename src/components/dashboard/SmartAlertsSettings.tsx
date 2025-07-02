
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface SmartAlertsSettingsProps {
  onClose: () => void;
}

export const SmartAlertsSettings: React.FC<SmartAlertsSettingsProps> = ({ onClose }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات التنبيهات الذكية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            سيتم تطوير إعدادات التنبيهات الذكية قريباً.
          </p>
          <Button onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
