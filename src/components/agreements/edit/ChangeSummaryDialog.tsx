
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CheckCircle2, 
  X, 
  Loader2, 
  ArrowRight,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Car,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ChangeComparison {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}

interface ChangeSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changesList: ChangeComparison[];
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ChangeSummaryDialog: React.FC<ChangeSummaryDialogProps> = ({
  open,
  onOpenChange,
  changesList,
  isSubmitting,
  onConfirm,
  onCancel
}) => {
  
  // دالة تنسيق القيم للعرض
  const formatValueForDisplay = (field: string, value: any) => {
    if (value === null || value === undefined) return 'غير محدد';
    
    switch (field) {
      case 'agreement_type':
        const typeTranslations: { [key: string]: string } = {
          'short_term': 'قصير المدى',
          'lease_to_own': 'إيجار منتهي بالتملك'
        };
        return typeTranslations[value] || value;
      case 'status':
        const statusTranslations: { [key: string]: string } = {
          'draft': 'مسودة',
          'active': 'نشط',
          'pending': 'معلق',
          'closed': 'مكتمل',
          'cancelled': 'ملغي',
          'expired': 'منتهي'
        };
        return statusTranslations[value] || value;
      case 'payment_frequency':
        const frequencyTranslations: { [key: string]: string } = {
          'weekly': 'أسبوعي',
          'monthly': 'شهري',
          'quarterly': 'ربع سنوي'
        };
        return frequencyTranslations[value] || value;
      case 'start_date':
      case 'end_date':
        if (value instanceof Date) {
          return format(value, 'dd MMMM yyyy', { locale: ar });
        }
        if (typeof value === 'string' && value) {
          try {
            return format(new Date(value), 'dd MMMM yyyy', { locale: ar });
          } catch {
            return value;
          }
        }
        return value;
      case 'total_amount':
      case 'rent_amount':
      case 'deposit_amount':
      case 'daily_late_fee':
        return `${Number(value).toLocaleString()} ر.ق`;
      default:
        return value;
    }
  };

  // دالة تحديد أيقونة الحقل
  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'start_date':
      case 'end_date':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'total_amount':
      case 'rent_amount':
      case 'deposit_amount':
      case 'daily_late_fee':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'customer_id':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'vehicle_id':
        return <Car className="h-4 w-4 text-orange-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  // دالة تحديد لون التغيير
  const getChangeColor = (field: string) => {
    switch (field) {
      case 'status':
        return 'border-blue-500 bg-blue-50';
      case 'total_amount':
      case 'rent_amount':
      case 'deposit_amount':
        return 'border-green-500 bg-green-50';
      case 'start_date':
      case 'end_date':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  // تصنيف التغييرات حسب النوع
  const categorizeChanges = () => {
    const basicFields = ['agreement_number', 'agreement_type', 'status', 'notes'];
    const financialFields = ['total_amount', 'rent_amount', 'deposit_amount', 'daily_late_fee'];
    const scheduleFields = ['start_date', 'end_date', 'payment_frequency', 'payment_day'];
    const relationFields = ['customer_id', 'vehicle_id'];

    return {
      basic: changesList.filter(change => basicFields.includes(change.field)),
      financial: changesList.filter(change => financialFields.includes(change.field)),
      schedule: changesList.filter(change => scheduleFields.includes(change.field)),
      relations: changesList.filter(change => relationFields.includes(change.field))
    };
  };

  const categorizedChanges = categorizeChanges();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl flex-row-reverse">
            <FileText className="h-6 w-6 text-blue-600" />
            ملخص التغييرات المطلوب حفظها
          </DialogTitle>
          <DialogDescription className="text-right">
            مراجعة التغييرات التي ستتم قبل حفظها نهائياً. يمكنك الموافقة على حفظ التغييرات أو إلغاؤها.
          </DialogDescription>
        </DialogHeader>

        {changesList.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد تغييرات للحفظ</h3>
            <p className="text-gray-600">جميع البيانات متطابقة مع النسخة المحفوظة</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ملخص إحصائي */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-blue-900 mb-1">
                      إجمالي التغييرات: {changesList.length}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      سيتم تحديث البيانات المعروضة أدناه فقط، وستبقى البيانات الأخرى كما هي
                    </p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-full">
                    <AlertTriangle className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* التغييرات الأساسية */}
            {categorizedChanges.basic.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 flex-row-reverse">
                  <Settings className="h-5 w-5 text-gray-600" />
                  التفاصيل الأساسية ({categorizedChanges.basic.length})
                </h4>
                <div className="space-y-3">
                  {categorizedChanges.basic.map((change, index) => (
                    <Card key={index} className={`border-r-4 ${getChangeColor(change.field)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-row-reverse">
                          <div className="text-right flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                              {getFieldIcon(change.field)}
                              <h5 className="font-medium text-gray-900">{change.fieldLabel}</h5>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-row-reverse">
                                <div className="bg-red-100 px-3 py-2 rounded-lg border border-red-200 flex-1 text-right">
                                  <span className="text-xs text-red-600 font-medium block">القيمة السابقة:</span>
                                  <span className="text-red-700 line-through">
                                    {formatValueForDisplay(change.field, change.oldValue)}
                                  </span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 transform rotate-180" />
                                <div className="bg-green-100 px-3 py-2 rounded-lg border border-green-200 flex-1 text-right">
                                  <span className="text-xs text-green-600 font-medium block">القيمة الجديدة:</span>
                                  <span className="text-green-700 font-semibold">
                                    {formatValueForDisplay(change.field, change.newValue)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* التغييرات المالية */}
            {categorizedChanges.financial.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 flex-row-reverse">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  البيانات المالية ({categorizedChanges.financial.length})
                </h4>
                <div className="space-y-3">
                  {categorizedChanges.financial.map((change, index) => (
                    <Card key={index} className={`border-r-4 ${getChangeColor(change.field)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-row-reverse">
                          <div className="text-right flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                              {getFieldIcon(change.field)}
                              <h5 className="font-medium text-gray-900">{change.fieldLabel}</h5>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-row-reverse">
                                <div className="bg-red-100 px-3 py-2 rounded-lg border border-red-200 flex-1 text-right">
                                  <span className="text-xs text-red-600 font-medium block">المبلغ السابق:</span>
                                  <span className="text-red-700 line-through">
                                    {formatValueForDisplay(change.field, change.oldValue)}
                                  </span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 transform rotate-180" />
                                <div className="bg-green-100 px-3 py-2 rounded-lg border border-green-200 flex-1 text-right">
                                  <span className="text-xs text-green-600 font-medium block">المبلغ الجديد:</span>
                                  <span className="text-green-700 font-semibold">
                                    {formatValueForDisplay(change.field, change.newValue)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* تغييرات الجدولة */}
            {categorizedChanges.schedule.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 flex-row-reverse">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  جدولة العقد والدفعات ({categorizedChanges.schedule.length})
                </h4>
                <div className="space-y-3">
                  {categorizedChanges.schedule.map((change, index) => (
                    <Card key={index} className={`border-r-4 ${getChangeColor(change.field)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-row-reverse">
                          <div className="text-right flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                              {getFieldIcon(change.field)}
                              <h5 className="font-medium text-gray-900">{change.fieldLabel}</h5>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-row-reverse">
                                <div className="bg-red-100 px-3 py-2 rounded-lg border border-red-200 flex-1 text-right">
                                  <span className="text-xs text-red-600 font-medium block">القيمة السابقة:</span>
                                  <span className="text-red-700 line-through">
                                    {formatValueForDisplay(change.field, change.oldValue)}
                                  </span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 transform rotate-180" />
                                <div className="bg-green-100 px-3 py-2 rounded-lg border border-green-200 flex-1 text-right">
                                  <span className="text-xs text-green-600 font-medium block">القيمة الجديدة:</span>
                                  <span className="text-green-700 font-semibold">
                                    {formatValueForDisplay(change.field, change.newValue)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* تحذير هام */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 flex-row-reverse">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-right">
                    <h4 className="font-medium text-yellow-800 mb-1">تنبيه مهم</h4>
                    <p className="text-yellow-700 text-sm">
                      بعد تأكيد حفظ التغييرات، لا يمكن التراجع عنها. تأكد من صحة جميع البيانات قبل المتابعة.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex gap-3 justify-end pt-6">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="min-w-32"
          >
            <X className="w-4 h-4 ml-2" />
            إلغاء التغييرات
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isSubmitting || changesList.length === 0}
            className="bg-green-600 hover:bg-green-700 min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 ml-2" />
                تأكيد حفظ {changesList.length} تغيير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 