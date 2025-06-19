import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Agreement } from '@/types/agreement';
import { Settings, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface SettingsCardProps {
  agreement: Agreement;
  onEdit: () => void;
  onDelete: () => void;
}

export function SettingsCard({
  agreement,
  onEdit,
  onDelete
}: SettingsCardProps) {
  const createdAt = agreement.created_at instanceof Date ? agreement.created_at : new Date(agreement.created_at);
  const updatedAt = agreement.updated_at instanceof Date ? agreement.updated_at : new Date(agreement.updated_at);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Agreement Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right flex-row-reverse">
            <Settings className="h-5 w-5" />
            إجراءات العقد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onEdit} className="flex-1 flex items-center gap-2 flex-row-reverse">
              <Edit className="h-4 w-4" />
              تعديل العقد
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDelete}
              className="flex-1 flex items-center gap-2 flex-row-reverse"
            >
              <Trash2 className="h-4 w-4" />
              حذف العقد
            </Button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3 flex-row-reverse">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1 text-right">
                <h4 className="font-medium text-amber-800">ملاحظة مهمة</h4>
                <p className="text-sm text-amber-700 mt-1 text-right">
                  حذف العقد نهائي ولا يمكن التراجع عنه. سيتم حذف جميع المدفوعات والوثائق والسجلات المرتبطة به.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">معلومات العقد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground text-right">تاريخ الإنشاء</p>
              <p className="font-medium text-right">{format(createdAt, "PPP 'at' p")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground text-right">آخر تعديل</p>
              <p className="font-medium text-right">{format(updatedAt, "PPP 'at' p")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground text-right">معرّف العقد</p>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded text-right">
                {agreement.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground text-right">نوع العقد</p>
              <p className="font-medium capitalize text-right">
                {agreement.agreement_type?.replace('_', ' ') === 'lease_to_own' ? 'إيجار منتهي بالتملك' : 
                 agreement.agreement_type?.replace('_', ' ') === 'short_term' ? 'قصير المدى' : 
                 'قياسي'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2 text-right">
            <p>• يتم حفظ جميع التغييرات تلقائياً</p>
            <p>• يتم الاحتفاظ بسجل المدفوعات عبر التعديلات</p>
            <p>• الوثائق مرتبطة بهذا العقد بشكل دائم</p>
            <p>• سجلات المراجعة تتتبع جميع التعديلات</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
