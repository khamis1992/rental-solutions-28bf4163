// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile, useBreakpoint, useResponsiveLayout } from '@/hooks/use-mobile';
import { Smartphone, Tablet, Monitor, Laptop } from 'lucide-react';

const ResponsiveDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const breakpoint = useBreakpoint();
  const layoutConfig = useResponsiveLayout();

  const DeviceIndicator = () => {
    const getIcon = () => {
      switch (breakpoint) {
        case 'mobile': return <Smartphone className="w-5 h-5" />;
        case 'tablet': return <Tablet className="w-5 h-5" />;
        case 'desktop': return <Monitor className="w-5 h-5" />;
        case 'laptop': return <Laptop className="w-5 h-5" />;
        default: return <Monitor className="w-5 h-5" />;
      }
    };

    const getDeviceName = () => {
      switch (breakpoint) {
        case 'mobile': return 'هاتف محمول';
        case 'tablet': return 'جهاز لوحي';
        case 'desktop': return 'سطح المكتب';
        case 'laptop': return 'لابتوب';
        default: return 'غير محدد';
      }
    };

    return (
      <div className="flex items-center gap-2">
        {getIcon()}
        <span>{getDeviceName()}</span>
        <Badge variant="outline">{breakpoint}</Badge>
      </div>
    );
  };

  const GridExample = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Card key={i} className="p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
              {i + 1}
            </div>
            <div className="text-sm">عنصر {i + 1}</div>
          </div>
        </Card>
      ))}
    </div>
  );

  const ButtonGroup = () => (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button variant="default" className="flex-1">
        زر أساسي
      </Button>
      <Button variant="outline" className="flex-1">
        زر ثانوي
      </Button>
      <Button variant="ghost" className="flex-1">
        زر شفاف
      </Button>
    </div>
  );

  const ResponsiveText = () => (
    <div className="space-y-2">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
        عنوان متجاوب
      </h1>
      <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
        هذا النص يتكيف مع حجم الشاشة. يصبح أكبر على الشاشات الأكبر وأصغر على الشاشات الصغيرة.
      </p>
    </div>
  );

  const HiddenElements = () => (
    <div className="space-y-4">
      <div className="block sm:hidden">
        <Badge variant="secondary">مرئي على الهواتف المحمولة فقط</Badge>
      </div>
      
      <div className="hidden sm:block md:hidden">
        <Badge variant="secondary">مرئي على الأجهزة اللوحية فقط</Badge>
      </div>
      
      <div className="hidden md:block lg:hidden">
        <Badge variant="secondary">مرئي على اللابتوب فقط</Badge>
      </div>
      
      <div className="hidden lg:block">
        <Badge variant="secondary">مرئي على سطح المكتب فقط</Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Device Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">كشف نوع الجهاز</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DeviceIndicator />
          <div className="text-sm text-muted-foreground space-y-1">
            <div>عرض الشاشة: {window.innerWidth}px</div>
            <div>ارتفاع الشاشة: {window.innerHeight}px</div>
            <div>نسبة البكسل: {window.devicePixelRatio}</div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">شبكة متجاوبة</CardTitle>
        </CardHeader>
        <CardContent>
          <GridExample />
        </CardContent>
      </Card>

      {/* Responsive Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">أزرار متجاوبة</CardTitle>
        </CardHeader>
        <CardContent>
          <ButtonGroup />
        </CardContent>
      </Card>

      {/* Responsive Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">طباعة متجاوبة</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveText />
        </CardContent>
      </Card>

      {/* Hidden Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">عناصر مخفية حسب الشاشة</CardTitle>
        </CardHeader>
        <CardContent>
          <HiddenElements />
        </CardContent>
      </Card>

      {/* Layout Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">إعدادات التخطيط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">الأعمدة:</div>
              <Badge variant="outline">{layoutConfig.columns}</Badge>
            </div>
            <div>
              <div className="font-medium">الهامش:</div>
              <Badge variant="outline">{layoutConfig.gutter}</Badge>
            </div>
            <div>
              <div className="font-medium">حاوية:</div>
              <Badge variant="outline">{layoutConfig.containerClass}</Badge>
            </div>
            <div>
              <div className="font-medium">نقطة الانقطاع:</div>
              <Badge variant="outline">{breakpoint}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">اختبار النافذة المنبثقة</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowModal(true)}>
            فتح نافذة منبثقة
          </Button>
          
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-right">نافذة متجاوبة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-right">
                  هذه النافذة تتكيف مع حجم الشاشة. على الهواتف المحمولة تأخذ العرض الكامل تقريباً،
                  وعلى الشاشات الأكبر تظهر كنافذة مركزية.
                </p>
                <DeviceIndicator />
                <Button onClick={() => setShowModal(false)} className="w-full">
                  إغلاق
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsiveDemo;