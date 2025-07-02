
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useMaintenance } from '@/hooks/use-maintenance';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const MaintenanceJobCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: maintenanceRecords } = useMaintenance();
  
  const record = maintenanceRecords?.find(r => r.id === id);

  if (!record) {
    return (
      <div className="container mx-auto p-4" dir="rtl">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">لم يتم العثور على سجل الصيانة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMaintenanceTypeLabel = (type: string) => {
    const translations: { [key: string]: string } = {
      'REGULAR_INSPECTION': 'فحص دوري',
      'OIL_CHANGE': 'تغيير زيت',
      'BRAKE_SERVICE': 'خدمة الفرامل',
      'TIRE_ROTATION': 'تدوير الإطارات',
      'ENGINE_REPAIR': 'إصلاح المحرك',
      'TRANSMISSION_SERVICE': 'خدمة ناقل الحركة',
      'AC_SERVICE': 'خدمة التكييف',
      'BATTERY_REPLACEMENT': 'استبدال البطارية',
      'BODY_WORK': 'أعمال الهيكل',
      'ELECTRICAL_REPAIR': 'إصلاح كهربائي'
    };
    return translations[type] || type.replace(/_/g, ' ');
  };

  const getStatusLabel = (status: string) => {
    const translations: { [key: string]: string } = {
      'scheduled': 'مجدول',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    return translations[status] || status;
  };

  const formatDateInArabic = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-right">بطاقة العمل</h1>
        <p className="text-gray-600 text-right">رقم المعرف: {record.id}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">معلومات الصيانة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-right">
              <label className="text-sm font-medium text-gray-600">نوع الصيانة</label>
              <p className="text-lg">{getMaintenanceTypeLabel(record.maintenance_type)}</p>
            </div>
            
            <div className="text-right">
              <label className="text-sm font-medium text-gray-600">الحالة</label>
              <div className="mt-1">
                <Badge variant="outline" className="text-right">
                  {getStatusLabel(record.status)}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <label className="text-sm font-medium text-gray-600">التاريخ المجدول</label>
              <p className="text-lg">
                {record.scheduled_date ? formatDateInArabic(record.scheduled_date) : 'غير محدد'}
              </p>
            </div>

            {record.completed_date && (
              <div className="text-right">
                <label className="text-sm font-medium text-gray-600">تاريخ الإنجاز</label>
                <p className="text-lg">{formatDateInArabic(record.completed_date)}</p>
              </div>
            )}

            <div className="text-right">
              <label className="text-sm font-medium text-gray-600">التكلفة</label>
              <p className="text-lg">
                {record.cost ? `${record.cost.toFixed(2)} ر.س` : 'غير محدد'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">معلومات المركبة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-right">
              <label className="text-sm font-medium text-gray-600">معرف المركبة</label>
              <p className="text-lg">{record.vehicle?.id || 'غير محدد'}</p>
            </div>

            {record.vehicle && (
              <>
                {(record.vehicle.make || record.vehicle.model || record.vehicle.year) && (
                  <div className="text-right">
                    <label className="text-sm font-medium text-gray-600">طراز المركبة</label>
                    <p className="text-lg">
                      {`${record.vehicle.make || ''} ${record.vehicle.model || ''} ${record.vehicle.year || ''}`.trim() || 'غير محدد'}
                    </p>
                  </div>
                )}

                {record.vehicle.license_plate && (
                  <div className="text-right">
                    <label className="text-sm font-medium text-gray-600">رقم اللوحة</label>
                    <p className="text-lg">{record.vehicle.license_plate}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {record.service_provider && (
          <Card>
            <CardHeader>
              <CardTitle className="text-right">معلومات الخدمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-right">
                <label className="text-sm font-medium text-gray-600">مقدم الخدمة</label>
                <p className="text-lg">{record.service_provider}</p>
              </div>

              {record.invoice_number && (
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-600">رقم الفاتورة</label>
                  <p className="text-lg">{record.invoice_number}</p>
                </div>
              )}

              {record.performed_by && (
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-600">تم بواسطة</label>
                  <p className="text-lg">{record.performed_by}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(record.description || record.notes) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-right">الوصف والملاحظات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {record.description && (
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-600">الوصف</label>
                  <p className="text-lg whitespace-pre-wrap">{record.description}</p>
                </div>
              )}

              {record.notes && (
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-600">ملاحظات</label>
                  <p className="text-lg whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MaintenanceJobCard;
