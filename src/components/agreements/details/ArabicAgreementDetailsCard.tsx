import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { User, Car } from 'lucide-react';

interface ArabicAgreementDetailsCardProps {
  agreement: Agreement;
}

export function ArabicAgreementDetailsCard({ agreement }: ArabicAgreementDetailsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <CardTitle className="text-xl font-bold text-gray-800">
          تفاصيل العميل والمركبة
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicle Information Section - Now on the LEFT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 justify-end">
              <h3 className="text-lg font-semibold text-green-600 text-right">معلومات المركبة</h3>
              <Car className="h-5 w-5 text-green-600" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.vehicles?.make} {agreement.vehicles?.model}
                </span>
                <span className="text-sm text-gray-600">الماركة والطراز</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.vehicles?.license_plate || 'غير متوفر'}
                </span>
                <span className="text-sm text-gray-600">رقم اللوحة</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.vehicles?.year || 'غير متوفر'}
                </span>
                <span className="text-sm text-gray-600">سنة الصنع</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.vehicles?.color || 'غير متوفر'}
                </span>
                <span className="text-sm text-gray-600">اللون</span>
              </div>
            </div>
          </div>

          {/* Customer Information Section - Now on the RIGHT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 justify-end">
              <h3 className="text-lg font-semibold text-blue-600 text-right">معلومات العميل</h3>
              <User className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.customers?.full_name || agreement.customers?.first_name + ' ' + (agreement.customers?.last_name || '')}
                </span>
                <span className="text-sm text-gray-600">الاسم الكامل</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.customers?.national_id || 'غير متوفر'}
                </span>
                <span className="text-sm text-gray-600">رقم الهوية</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.customers?.phone || 'غير متوفر'}
                </span>
                <span className="text-sm text-gray-600">رقم الجوال</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-left">
                  {agreement.customers?.address || 'غير متوفر'}
                </span>
                <span className="text-sm text-gray-600">العنوان</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 