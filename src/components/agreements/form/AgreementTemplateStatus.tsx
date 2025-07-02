
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

// Define proper TemplateStatus type 
export interface TemplateStatus {
  accessible: boolean;
  message: string;
}

// Helper function to create template status object
export function createTemplateStatus(accessible: boolean, message: string): TemplateStatus {
  return { accessible, message };
}

interface AgreementTemplateStatusProps {
  standardTemplateExists: boolean;
  specificUrlCheck?: boolean;
}

export const AgreementTemplateStatus: React.FC<AgreementTemplateStatusProps> = ({
  standardTemplateExists,
  specificUrlCheck
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right" dir="rtl">
          {standardTemplateExists ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          حالة قالب الاتفاقية
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between">
            <span className="text-sm">القالب المعياري</span>
            <Badge variant={standardTemplateExists ? "default" : "destructive"}>
              {standardTemplateExists ? 'متوفر' : 'غير متوفر'}
            </Badge>
          </div>
          
          {specificUrlCheck !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">فحص الرابط المحدد</span>
              <Badge variant={specificUrlCheck ? "default" : "secondary"}>
                {specificUrlCheck ? 'نجح' : 'فشل'}
              </Badge>
            </div>
          )}
          
          <div className="text-xs text-gray-600 mt-2">
            {standardTemplateExists 
              ? 'القالب المعياري متوفر ويمكن استخدامه لتوليد الاتفاقيات.'
              : 'القالب المعياري غير متوفر. قد تحتاج إلى رفع قالب جديد.'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
