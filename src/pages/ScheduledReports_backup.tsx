import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { useScheduledReports } from "@/hooks/useScheduledReports";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Mail, 
  FileText, 
  Users,
  Car, 
  CreditCard,
  Gavel,
  PlayCircle,
  PauseCircle,
  Search,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  BarChart3,
  PieChart,
  Loader2,
  Eye,
  Play,
  Pause,
  Filter,
  Download,
  MessageCircle,
  Settings
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppReportsSettings } from '@/components/reports/WhatsAppReportsSettings';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

const reportTypeIcons = {
  fleet: Car,
  financial: CreditCard,
  customers: Users,
  maintenance: Clock,
  legal: Gavel
};

const reportTypeNames = {
  fleet: "تقرير الأسطول",
  financial: "التقرير المالي",
  customers: "تقرير العملاء",
  maintenance: "تقرير الصيانة",
  legal: "التقرير القانوني"
};

const frequencyNames = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  quarterly: "ربع سنوي"
};

const statusNames = {
  active: "نشط",
  paused: "متوقف"
};

const formSchema = z.object({
  name: z.string().min(3, { message: "يجب أن يكون اسم التقرير 3 أحرف على الأقل" }),
  type: z.string(),
  frequency: z.string(),
  recipients: z.string().min(1, { message: "يرجى إدخال بريد إلكتروني صحيح" }),
  format: z.string(),
});

const ScheduledReports = () => {
  const navigate = useNavigate();
  const { 
    reports, 
    isLoading, 
    runReportNow, 
    updateReportStatus, 
    deleteReport, 
    createReport 
  } = useScheduledReports();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [isRunningReport, setIsRunningReport] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "fleet",
      frequency: "monthly",
      recipients: "",
      format: "pdf",
    },
  });

  // تطبيق الفلاتر والبحث
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reportTypeNames[report.type as keyof typeof reportTypeNames].includes(searchQuery);
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesType = filterType === "all" || report.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // إحصائيات محدثة
  const activeReports = reports.filter(r => r.status === "active").length;
  const pausedReports = reports.filter(r => r.status === "paused").length;

  // وظائف التحكم في التقارير
  const handleToggleStatus = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const newStatus = report.status === "active" ? "paused" : "active";
      await updateReportStatus(reportId, newStatus);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReport(reportId);
    setDeleteDialogOpen(false);
    setSelectedReport(null);
  };

  const handleRunReport = async (reportId: string) => {
    setIsRunningReport(true);
    try {
      const result = await runReportNow(reportId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('فشل في تشغيل التقرير');
    } finally {
      setIsRunningReport(false);
      setRunDialogOpen(false);
      setSelectedReport(null);
    }
  };

  const handleCreateReport = async (data: any) => {
    const reportData = {
      ...data,
      recipients: data.recipients.split(',').map((email: string) => email.trim()),
      status: 'active' as const,
      nextRunDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // أسبوع من الآن
    };

    const success = await createReport(reportData);
    if (success) {
      setOpen(false);
      form.reset();
    }
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <PageContainer className="py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">جاري تحميل التقارير المجدولة...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <PageContainer className="py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    التقارير المجدولة
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">
                    إدارة وأتمتة إنشاء التقارير وتسليمها بشكل دوري + إشعارات واتساب
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">التقارير النشطة</p>
                    <p className="text-3xl font-bold mt-2">{activeReports}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="h-4 w-4 text-emerald-200 mr-1" />
                      <span className="text-emerald-200 text-xs">جاهزة للتشغيل + واتساب</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">التقارير المتوقفة</p>
                    <p className="text-3xl font-bold mt-2">{pausedReports}</p>
                    <div className="flex items-center mt-2">
                      <XCircle className="h-4 w-4 text-amber-200 mr-1" />
                      <span className="text-amber-200 text-xs">معلقة مؤقتاً</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <PauseCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">إشعارات الواتساب</p>
                    <p className="text-3xl font-bold mt-2">2</p>
                    <div className="flex items-center mt-2">
                      <MessageCircle className="h-4 w-4 text-green-200 mr-1" />
                      <span className="text-green-200 text-xs">رقم نشط</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              التقارير المجدولة
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              إعدادات الواتساب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {/* أدوات البحث والفلترة */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
                  <div className="flex-1 w-full lg:max-w-md">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="البحث في التقارير..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 h-12 border-2 bg-white/90 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full lg:w-auto">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-12 min-w-[150px] border-2 bg-white/90">
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="paused">متوقف</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="h-12 min-w-[150px] border-2 bg-white/90">
                        <SelectValue placeholder="النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        <SelectItem value="fleet">🚗 الأسطول</SelectItem>
                        <SelectItem value="financial">💰 المالي</SelectItem>
                        <SelectItem value="customers">👥 العملاء</SelectItem>
                        <SelectItem value="maintenance">🔧 الصيانة</SelectItem>
                        <SelectItem value="legal">⚖️ القانوني</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                          <Plus className="h-4 w-4 mr-2" />
                          إنشاء تقرير جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-right text-2xl">إنشاء تقرير مجدول جديد</DialogTitle>
                          <DialogDescription className="text-right">
                            إعداد تقرير تلقائي ليتم إنشاؤه وتسليمه وفقاً لجدولة متكررة
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleCreateReport)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel className="text-right text-base font-medium">اسم التقرير</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="مثال: تقرير حالة الأسطول الشهري" 
                                        {...field} 
                                        className="text-right h-12 border-2 focus:border-blue-500"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-right text-base font-medium">نوع التقرير</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-12 border-2">
                                          <SelectValue placeholder="اختر النوع" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="fleet">🚗 تقرير الأسطول</SelectItem>
                                        <SelectItem value="financial">💰 التقرير المالي</SelectItem>
                                        <SelectItem value="customers">👥 تقرير العملاء</SelectItem>
                                        <SelectItem value="maintenance">🔧 تقرير الصيانة</SelectItem>
                                        <SelectItem value="legal">⚖️ التقرير القانوني</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-right text-base font-medium">التكرار</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-12 border-2">
                                          <SelectValue placeholder="اختر التكرار" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="daily">🔄 يومي</SelectItem>
                                        <SelectItem value="weekly">📅 أسبوعي</SelectItem>
                                        <SelectItem value="monthly">🗓️ شهري</SelectItem>
                                        <SelectItem value="quarterly">📆 ربع سنوي</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="recipients"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-right text-base font-medium">المستلمون</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="admin@company.com, manager@company.com" 
                                      {...field} 
                                      className="text-right h-12 border-2 focus:border-blue-500"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-right text-sm">
                                    أدخل عناوين البريد الإلكتروني مفصولة بفواصل
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="format"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-right text-base font-medium">تنسيق الملف</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 border-2">
                                        <SelectValue placeholder="اختر التنسيق" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pdf">📄 PDF</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter className="gap-3">
                              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                إلغاء
                              </Button>
                              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
                                إنشاء التقرير
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* قائمة التقارير */}
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const IconComponent = reportTypeIcons[report.type as keyof typeof reportTypeIcons];
                return (
                  <Card key={report.id} className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
                            <IconComponent className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{report.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {reportTypeNames[report.type as keyof typeof reportTypeNames]}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {frequencyNames[report.frequency as keyof typeof frequencyNames]}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                التشغيل التالي: {report.nextRunDate}
                              </span>
                              {report.lastRun && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  آخر تشغيل: {report.lastRun}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={report.status === 'active' ? 'default' : 'secondary'}
                            className={`px-3 py-1 ${
                              report.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {statusNames[report.status as keyof typeof statusNames]}
                          </Badge>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRunReport(report.id)}
                              disabled={isRunningReport}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {isRunningReport ? 'جاري التشغيل...' : 'تشغيل الآن + واتساب'}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(report.id)}
                              className="border-2 hover:bg-gray-50"
                            >
                              {report.status === 'active' ? (
                                <>
                                  <Pause className="h-4 w-4 mr-1" />
                                  إيقاف
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  تفعيل
                                </>
                              )}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  حذف التقرير
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredReports.length === 0 && (
                <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد تقارير</h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || filterStatus !== 'all' || filterType !== 'all' 
                        ? 'لا توجد تقارير تطابق معايير البحث الحالية' 
                        : 'لم يتم إنشاء أي تقارير مجدولة بعد'}
                    </p>
                    {!searchQuery && filterStatus === 'all' && filterType === 'all' && (
                      <Button 
                        onClick={() => setOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        إنشاء أول تقرير
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="whatsapp">
            <WhatsAppReportsSettings />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حذف التقرير "{selectedReport?.name}"؟ 
                هذا الإجراء لا يمكن التراجع عنه.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedReport && handleDeleteReport(selectedReport.id)}
              >
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </div>
  );
};

export default ScheduledReports;