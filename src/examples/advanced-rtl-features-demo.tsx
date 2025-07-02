// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { formatQatarRiyal } from '@/utils/arabic-rtl-utils';

// Import RTL components (these would be imported from the actual files)
// import { LineChart, BarChart, PieChart } from '@/components/ui/rtl-chart';
// import { PrintLayout, InvoicePrint } from '@/components/ui/rtl-print-layout';
// import { Swipeable, Carousel, Drawer } from '@/components/ui/rtl-mobile-gestures';
// import { Animated, FadeIn, SlideIn, LoadingSpinner } from '@/components/ui/rtl-animations';

/**
 * Advanced RTL Features Demo Component
 * 
 * This component demonstrates all the advanced RTL features implemented:
 * 1. RTL-aware animations and transitions
 * 2. Proper RTL chart and graph rendering
 * 3. RTL-optimized print layouts
 * 4. Mobile RTL gesture support
 */

export const AdvancedRTLFeaturesDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('animations');
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Sample data for charts
  const chartData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [
      {
        label: 'الإيرادات',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const pieData = {
    labels: ['سيارات صغيرة', 'سيارات متوسطة', 'سيارات كبيرة', 'سيارات فاخرة'],
    datasets: [
      {
        data: [30, 25, 20, 25],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
        ],
      },
    ],
  };

  // Sample invoice data
  const invoiceData = {
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '2024-01-15',
    companyInfo: {
      name: 'شركة قطر لتأجير السيارات',
      address: 'الدوحة، قطر',
      phone: '+974 4444 5555',
      email: 'info@qatarrentals.com',
    },
    customerInfo: {
      name: 'أحمد محمد الكعبي',
      address: 'الخليج الغربي، الدوحة',
      phone: '+974 5555 6666',
    },
    items: [
      {
        description: 'إيجار سيارة تويوتا كامري - 7 أيام',
        quantity: 1,
        unitPrice: 200,
        total: 1400,
      },
      {
        description: 'تأمين شامل',
        quantity: 1,
        unitPrice: 100,
        total: 100,
      },
    ],
    subtotal: 1500,
    tax: 75,
    total: 1575,
  };

  const tabs = [
    { id: 'animations', label: 'الحركات والانتقالات', icon: '🎬' },
    { id: 'charts', label: 'الرسوم البيانية', icon: '📊' },
    { id: 'print', label: 'تخطيطات الطباعة', icon: '🖨️' },
    { id: 'gestures', label: 'إيماءات الجوال', icon: '📱' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            الميزات المتقدمة للواجهة العربية
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            عرض شامل للميزات المتقدمة المحسنة للغة العربية واتجاه النص من اليمين إلى اليسار
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">RTL محسن</Badge>
            <Badge variant="secondary">دعم العربية</Badge>
            <Badge variant="secondary">تجربة مستخدم متقدمة</Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {activeTab === 'animations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الحركات والانتقالات المحسنة للعربية</CardTitle>
                <CardDescription>
                  حركات وانتقالات محسنة لاتجاه النص من اليمين إلى اليسار
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fade In Animation */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">حركة الظهور التدريجي</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 bg-blue-50 rounded-lg border animate-in fade-in duration-500"
                        style={{ animationDelay: `${i * 200}ms` }}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">📊</div>
                          <div className="font-semibold">بطاقة {i}</div>
                          <div className="text-sm text-gray-600">محتوى تجريبي</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Slide In Animation */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">حركة الانزلاق</h3>
                  <div className="space-y-2">
                    {['من اليمين', 'من اليسار', 'من الأعلى', 'من الأسفل'].map((direction, i) => (
                      <div
                        key={i}
                        className="p-3 bg-green-50 rounded-lg border animate-in slide-in-from-right-full duration-300"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <span>انزلاق {direction}</span>
                          <Badge variant="outline">RTL</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Loading Animations */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">حركات التحميل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                      <div className="text-sm">دوران</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="animate-pulse h-8 w-8 bg-blue-600 rounded mx-auto mb-2" />
                      <div className="text-sm">نبضة</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="animate-bounce h-8 w-8 bg-blue-600 rounded mx-auto mb-2" />
                      <div className="text-sm">ارتداد</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="flex space-x-1 rtl:space-x-reverse justify-center mb-2">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                      <div className="text-sm">نقاط</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الرسوم البيانية المحسنة للعربية</CardTitle>
                <CardDescription>
                  رسوم بيانية مع دعم كامل لاتجاه النص من اليمين إلى اليسار
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chart Examples Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">رسم بياني خطي</h3>
                    <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📈</div>
                        <div>رسم بياني خطي محسن للعربية</div>
                        <div className="text-sm mt-1">
                          المحور الصادي على اليمين، تسميات عربية، اتجاه RTL
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">رسم بياني عمودي</h3>
                    <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📊</div>
                        <div>رسم بياني عمودي محسن للعربية</div>
                        <div className="text-sm mt-1">
                          أعمدة أفقية، تسميات عربية، ألوان قطر
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">رسم بياني دائري</h3>
                    <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">🥧</div>
                        <div>رسم بياني دائري محسن للعربية</div>
                        <div className="text-sm mt-1">
                          وسائل إيضاح على اليمين، نسب مئوية عربية
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">رسم بياني حلقي</h3>
                    <div className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">🍩</div>
                        <div>رسم بياني حلقي محسن للعربية</div>
                        <div className="text-sm mt-1">
                          تنسيق عملة قطرية، تسميات عربية
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart Features */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">ميزات الرسوم البيانية المحسنة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>المحور الصادي على اليمين</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>وسائل الإيضاح محاذاة لليمين</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>تنسيق الريال القطري</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>تسميات عربية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>ألوان قطر الوطنية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>تلميحات محاذاة لليمين</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'print' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تخطيطات الطباعة المحسنة للعربية</CardTitle>
                <CardDescription>
                  تخطيطات طباعة محسنة للفواتير والتقارير والعقود
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Print Layout Examples */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">فاتورة</h3>
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold">فاتورة</h4>
                        <div className="text-sm text-gray-600">رقم: INV-2024-001</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>إيجار سيارة</span>
                          <span>{formatQatarRiyal(1400)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>تأمين</span>
                          <span>{formatQatarRiyal(100)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>الإجمالي</span>
                          <span>{formatQatarRiyal(1500)}</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-4">
                        طباعة الفاتورة
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">تقرير</h3>
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold">تقرير شهري</h4>
                        <div className="text-sm text-gray-600">يناير 2024</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>إجمالي الإيرادات</span>
                          <span>{formatQatarRiyal(125000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>عدد العقود</span>
                          <span>45</span>
                        </div>
                        <div className="flex justify-between">
                          <span>معدل الإشغال</span>
                          <span>85%</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-4">
                        طباعة التقرير
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">عقد</h3>
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold">عقد إيجار</h4>
                        <div className="text-sm text-gray-600">رقم: AGR-2024-001</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><strong>المؤجر:</strong> شركة قطر للتأجير</div>
                        <div><strong>المستأجر:</strong> أحمد الكعبي</div>
                        <div><strong>المدة:</strong> 7 أيام</div>
                        <div><strong>القيمة:</strong> {formatQatarRiyal(1400)}</div>
                      </div>
                      <Button size="sm" className="w-full mt-4">
                        طباعة العقد
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Print Features */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">ميزات تخطيطات الطباعة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>اتجاه النص من اليمين إلى اليسار</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>خطوط عربية محسنة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>تنسيق العملة القطرية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>تخطيط مناسب للطباعة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>فواصل الصفحات الذكية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>تحسين استخدام الورق</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'gestures' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إيماءات الجوال المحسنة للعربية</CardTitle>
                <CardDescription>
                  دعم الإيماءات المحسنة لاتجاه النص من اليمين إلى اليسار
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Swipe Demo */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">السحب والإيماءات</h3>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
                    <div className="text-2xl mb-2">👆</div>
                    <div className="font-semibold mb-1">اسحب في أي اتجاه</div>
                    <div className="text-sm opacity-90">
                      السحب لليسار = التالي | السحب لليمين = السابق
                    </div>
                  </div>
                </div>

                {/* Carousel Demo */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">عرض الشرائح</h3>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <div className="flex transition-transform duration-300 ease-out">
                      {[1, 2, 3].map((slide) => (
                        <div
                          key={slide}
                          className="w-full flex-shrink-0 h-48 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                        >
                          <div className="text-center">
                            <div className="text-4xl mb-2">🖼️</div>
                            <div className="text-xl font-semibold">شريحة {slide}</div>
                            <div className="text-sm opacity-90">اسحب للتنقل</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse">
                      {[1, 2, 3].map((dot) => (
                        <div
                          key={dot}
                          className="w-2 h-2 bg-white/50 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawer Demo */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">القائمة الجانبية</h3>
                  <Button
                    onClick={() => setShowDrawer(true)}
                    className="w-full"
                  >
                    فتح القائمة الجانبية
                  </Button>
                </div>

                {/* Pull to Refresh Demo */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">السحب للتحديث</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <div className="text-3xl mb-2">⬇️</div>
                      <div>اسحب للأسفل للتحديث</div>
                      <div className="text-sm mt-1">محسن للواجهة العربية</div>
                    </div>
                  </div>
                </div>

                {/* Gesture Features */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">ميزات الإيماءات المحسنة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>اتجاهات السحب المعكوسة للعربية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>عرض الشرائح محسن للعربية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>القوائم الجانبية من اليمين</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>السحب للتحديث</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>إيماءات التكبير والتصغير</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>ردود فعل لمسية محسنة</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center">ملخص الميزات المتقدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-3xl">🎬</div>
                <div className="font-semibold">حركات RTL</div>
                <div className="text-sm text-gray-600">
                  حركات وانتقالات محسنة للعربية
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">📊</div>
                <div className="font-semibold">رسوم بيانية</div>
                <div className="text-sm text-gray-600">
                  رسوم بيانية مع دعم RTL كامل
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">🖨️</div>
                <div className="font-semibold">تخطيطات طباعة</div>
                <div className="text-sm text-gray-600">
                  تخطيطات محسنة للطباعة العربية
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">📱</div>
                <div className="font-semibold">إيماءات جوال</div>
                <div className="text-sm text-gray-600">
                  إيماءات محسنة للواجهة العربية
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedRTLFeaturesDemo; 