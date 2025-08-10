// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Edit, Trash2 } from 'lucide-react';

interface SettingsCardProps {
  agreement: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function SettingsCard({
  agreement,
  onEdit,
  onDelete
}: SettingsCardProps) {

  return (
    <div className="space-y-6" dir="rtl">






      {/* Agreement Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">إجراءات العقد</CardTitle>
          <CardDescription className="text-left">
            الإجراءات المتاحة لإدارة هذا العقد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={onEdit}
            className="w-full flex items-center gap-2 flex-row-reverse"
            variant="outline"
          >
            <Edit className="h-4 w-4" />
            تعديل معلومات العقد
          </Button>
          
          <Button 
            onClick={onDelete}
            variant="destructive"
            className="w-full flex items-center gap-2 flex-row-reverse"
          >
            <Trash2 className="h-4 w-4" />
            حذف العقد نهائياً
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">معرف العقد</p>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                {agreement.id}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">إصدار النظام</p>
              <p className="font-medium">2.1.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
