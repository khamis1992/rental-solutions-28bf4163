import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CustomerStatusBadge } from './CustomerStatusBadge';
import { Customer } from '@/lib/validation-schemas/customer';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard,
  Flag
} from 'lucide-react';

interface CustomerDetailsProps {
  customer: Customer;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير متوفر';
    return new Date(dateString).toLocaleDateString('ar-QA');
  };

  const detailItems = [
    {
      icon: User,
      label: 'الاسم الكامل',
      value: customer.full_name || 'غير متوفر'
    },
    {
      icon: Mail,
      label: 'البريد الإلكتروني',
      value: customer.email || 'غير متوفر'
    },
    {
      icon: Phone,
      label: 'رقم الهاتف',
      value: customer.phone || 'غير متوفر'
    },
    {
      icon: MapPin,
      label: 'العنوان',
      value: customer.address || 'غير متوفر'
    },
    {
      icon: CreditCard,
      label: 'رخصة القيادة',
      value: customer.driver_license || 'غير متوفر'
    },
    {
      icon: Flag,
      label: 'الجنسية',
      value: customer.nationality || 'غير متوفر'
    },
    {
      icon: Calendar,
      label: 'تاريخ الإضافة',
      value: formatDate(customer.created_at)
    },
    {
      icon: Calendar,
      label: 'آخر تحديث',
      value: formatDate(customer.updated_at)
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="text-right">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">تفاصيل العميل</CardTitle>
          <CustomerStatusBadge status={customer.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {detailItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg bg-gray-50/50">
              <item.icon className="h-5 w-5 text-primary/60 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {item.label}
                </p>
                <p className="text-sm text-gray-600 break-words">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {customer.notes && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg bg-blue-50/50">
              <User className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  الملاحظات
                </p>
                <p className="text-sm text-gray-600">
                  {customer.notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
