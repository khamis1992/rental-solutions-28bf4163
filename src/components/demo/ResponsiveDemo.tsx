// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { ResponsiveMobileLayout, useResponsiveLayout } from '../layout/ResponsiveMobileLayout';
import { ResponsiveGrid, ResponsiveCard, ResponsiveStack, ResponsiveModal } from '../ui/responsive-grid';
import { ResponsiveForm, ResponsiveInput, ResponsiveSelect, ResponsiveButtonGroup } from '../ui/responsive-form';
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';

const ResponsiveDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const layoutConfig = useResponsiveLayout();

  const DeviceIndicator = () => {
    const getIcon = () => {
      switch (breakpoint) {
        case 'mobile': return <Smartphone className="w-5 h-5" />;
        case 'tablet': return <Tablet className="w-5 h-5" />;
        case 'laptop': return <Laptop className="w-5 h-5" />;
        default: return <Monitor className="w-5 h-5" />;
      }
    };

    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
        {getIcon()}
        <div className="text-sm">
          <div className="font-medium">الجهاز الحالي: {breakpoint}</div>
          <div className="text-xs text-gray-600">
            العرض: {typeof window !== 'undefined' ? window.innerWidth : 0}px
          </div>
        </div>
      </div>
    );
  };

  const GridDemo = () => (
    <Card>
      <CardHeader>
        <CardTitle>الشبكة المتجاوبة</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveGrid
          columns={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="md"
          className="mb-4"
        >
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <ResponsiveCard key={item} padding="md" hover clickable>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{item}</span>
                </div>
                <h3 className="font-medium">العنصر {item}</h3>
                <p className="text-sm text-gray-600">وصف مختصر للعنصر</p>
              </div>
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>
      </CardContent>
    </Card>
  );

  const FormDemo = () => (
    <Card>
      <CardHeader>
        <CardTitle>النموذج المتجاوب</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveForm dir="rtl">
          <ResponsiveInput
            label="الاسم الكامل"
            placeholder="أدخل الاسم"
            required
          />
          
          <ResponsiveInput
            label="البريد الإلكتروني"
            type="email"
            placeholder="example@email.com"
            required
          />
          
          <ResponsiveSelect
            label="نوع العميل"
            placeholder="اختر النوع"
            required
          >
            <option value="individual">فرد</option>
            <option value="company">شركة</option>
          </ResponsiveSelect>

          <ResponsiveButtonGroup alignment="right">
            <Button variant="outline">إلغاء</Button>
            <Button>حفظ</Button>
          </ResponsiveButtonGroup>
        </ResponsiveForm>
      </CardContent>
    </Card>
  );

  const StackDemo = () => (
    <Card>
      <CardHeader>
        <CardTitle>التخطيط المرن</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveStack direction="responsive" spacing="md">
          <div className="bg-green-50 p-4 rounded-lg flex-1">
            <h4 className="font-medium text-green-800">العنصر الأول</h4>
            <p className="text-sm text-green-600">يظهر عمودياً على الجوال</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg flex-1">
            <h4 className="font-medium text-blue-800">العنصر الثاني</h4>
            <p className="text-sm text-blue-600">ويظهر أفقياً على الكمبيوتر</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg flex-1">
            <h4 className="font-medium text-purple-800">العنصر الثالث</h4>
            <p className="text-sm text-purple-600">يتكيف مع حجم الشاشة</p>
          </div>
        </ResponsiveStack>
      </CardContent>
    </Card>
  );

  const ConfigDisplay = () => (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات التخطيط الحالية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Badge variant={layoutConfig.showSidebar ? "default" : "secondary"}>
              الشريط الجانبي: {layoutConfig.showSidebar ? 'مرئي' : 'مخفي'}
            </Badge>
          </div>
          <div>
            <Badge variant={layoutConfig.showBottomNav ? "default" : "secondary"}>
              التنقل السفلي: {layoutConfig.showBottomNav ? 'مرئي' : 'مخفي'}
            </Badge>
          </div>
          <div>
            <Badge variant="outline">
              الأعمدة: {layoutConfig.columns}
            </Badge>
          </div>
          <div>
            <Badge variant={layoutConfig.cardLayout ? "default" : "secondary"}>
              تخطيط البطاقات: {layoutConfig.cardLayout ? 'مفعل' : 'معطل'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ResponsiveMobileLayout>
      <div className="space-y-6">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            عرض التصميم المتجاوب
          </h1>
          <p className="text-gray-600">
            تجربة كيفية تكيف التطبيق مع أحجام الشاشات المختلفة
          </p>
        </div>

        <DeviceIndicator />
        <ConfigDisplay />

        <div className="space-y-6">
          <GridDemo />
          <FormDemo />
          <StackDemo />
        </div>

        <div className="text-center">
          <Button onClick={() => setShowModal(true)}>
            عرض النافذة المنبثقة المتجاوبة
          </Button>
        </div>

        <ResponsiveModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="نافذة منبثقة متجاوبة"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              هذه النافذة تتكيف مع حجم الشاشة:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>على الهاتف: تظهر كشاشة كاملة من الأسفل</li>
              <li>على الجهاز اللوحي: تظهر كنافذة متوسطة في المنتصف</li>
              <li>على الكمبيوتر: تظهر كنافذة صغيرة في المنتصف</li>
            </ul>
            
            <div className="pt-4 border-t">
              <Button onClick={() => setShowModal(false)} className="w-full md:w-auto">
                إغلاق
              </Button>
            </div>
          </div>
        </ResponsiveModal>

        <Card>
          <CardHeader>
            <CardTitle>ميزات التصميم المتجاوب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">✅ مُطبق في النظام:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• التنقل السفلي للجوال</li>
                  <li>• الشريط الجانبي للكمبيوتر</li>
                  <li>• النماذج المتكيفة</li>
                  <li>• الجداول المتجاوبة</li>
                  <li>• البطاقات المرنة</li>
                  <li>• النوافذ المنبثقة المتكيفة</li>
                  <li>• دعم الاتجاه الأيمن للعربية</li>
                  <li>• دعم Safe Area للأجهزة الحديثة</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">🎯 نقاط القوة:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• تجربة مستخدم محسنة</li>
                  <li>• أداء سريع على الجوال</li>
                  <li>• واجهة موحدة عبر الأجهزة</li>
                  <li>• إمكانية وصول محسنة</li>
                  <li>• دعم تطبيق الويب التقدمي</li>
                  <li>• توافق مع أحدث المعايير</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveMobileLayout>
  );
};

export default ResponsiveDemo; 