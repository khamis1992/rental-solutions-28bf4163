import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
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
  Settings,
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  MoreVertical,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  BarChart3,
  PieChart
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

const SCHEDULED_REPORTS = [
  {
    id: "1",
    name: "تقرير حالة الأسطول الشهري",
    type: "fleet",
    frequency: "monthly",
    recipients: ["admin@example.com", "manager@example.com"],
    format: "pdf",
    nextRunDate: "2023-07-01",
    status: "active",
    lastRun: "2023-06-01"
  },
  {
    id: "2",
    name: "الملخص المالي الأسبوعي",
    type: "financial",
    frequency: "weekly",
    recipients: ["finance@example.com"],
    format: "excel",
    nextRunDate: "2023-06-15",
    status: "active",
    lastRun: "2023-06-08"
  },
  {
    id: "3",
    name: "تقرير الاحتفاظ بالعملاء",
    type: "customers",
    frequency: "quarterly",
    recipients: ["marketing@example.com", "sales@example.com"],
    format: "pdf",
    nextRunDate: "2023-08-01",
    status: "paused",
    lastRun: "2023-05-01"
  },
  {
    id: "4",
    name: "جدولة الصيانة الأسبوعية",
    type: "maintenance",
    frequency: "weekly",
    recipients: ["maintenance@example.com"],
    format: "pdf",
    nextRunDate: "2023-06-18",
    status: "active",
    lastRun: "2023-06-11"
  },
  {
    id: "5",
    name: "مراجعة الامتثال القانوني الشهرية",
    type: "legal",
    frequency: "monthly",
    recipients: ["legal@example.com"],
    format: "pdf",
    nextRunDate: "2023-07-05",
    status: "active",
    lastRun: "2023-06-05"
  }
];

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
  const [open, setOpen] = useState(false);
  const [scheduledReports, setScheduledReports] = useState(SCHEDULED_REPORTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // table, grid
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);

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

  const getReportPriority = (report: any) => {
    const now = new Date();
    const nextRun = new Date(report.nextRunDate);
    const timeDiff = nextRun.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (report.status === "paused") return "low";
    if (daysDiff <= 1) return "urgent";
    if (daysDiff <= 7) return "high";
    if (daysDiff <= 30) return "medium";
    return "low";
  };

  const getPriorityColor = (priority: string) => {
    return "bg-white";
  };

  const getPriorityLabel = (priority: string) => {
    return "";
  };
    
  // تطبيق الفلاتر والبحث
  const filteredReports = scheduledReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reportTypeNames[report.type as keyof typeof reportTypeNames].includes(searchQuery);
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesType = filterType === "all" || report.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // إحصائيات محدثة
  const activeReports = scheduledReports.filter(r => r.status === "active").length;
  const pausedReports = scheduledReports.filter(r => r.status === "paused").length;
  const totalRecipients = scheduledReports.reduce((acc, r) => acc + r.recipients.length, 0);

  // وظائف جديدة
  const toggleReportStatus = (reportId: string) => {
    setScheduledReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, status: report.status === "active" ? "paused" : "active" }
          : report
      )
    );
    toast.success("تم تحديث حالة التقرير بنجاح");
  };

  const deleteReport = (reportId: string) => {
    setScheduledReports(prev => prev.filter(report => report.id !== reportId));
    setDeleteDialogOpen(false);
    setSelectedReport(null);
    toast.success("تم حذف التقرير بنجاح");
  };

  const runReportNow = (reportId: string) => {
    toast.success("تم تشغيل التقرير بنجاح");
    setRunDialogOpen(false);
    setSelectedReport(null);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <PageContainer className="py-8">
        {/* Header Section with Enhanced Design */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/reports')} 
                variant="outline" 
                className="flex items-center gap-2 border-2 hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4" />
                عرض جميع التقارير
              </Button>
              
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                    <Plus className="h-4 w-4" />
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
                    <form className="space-y-6">
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
                                <SelectItem value="excel">📊 Excel</SelectItem>
                                <SelectItem value="csv">📝 CSV</SelectItem>
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
                    إدارة وأتمتة إنشاء التقارير وتسليمها بشكل دوري
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">{activeReports} تقرير نشط</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600">{pausedReports} تقرير متوقف</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">{scheduledReports.length} إجمالي التقارير</span>
                </div>
              </div>
            </div>
          </div>

                    {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -mr-12 -mt-12"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">التقارير النشطة</p>
                    <p className="text-3xl font-bold mt-2">{activeReports}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="h-4 w-4 text-emerald-200 mr-1" />
                      <span className="text-emerald-200 text-xs">جاهزة للتشغيل</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -mr-12 -mt-12"></div>
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
            
            <Card className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -mr-12 -mt-12"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">إجمالي التقارير</p>
                    <p className="text-3xl font-bold mt-2">{scheduledReports.length}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-blue-200 mr-1" />
                      <span className="text-blue-200 text-xs">نمو مستمر</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Section */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
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
                      <SelectItem value="fleet">الأسطول</SelectItem>
                      <SelectItem value="financial">المالي</SelectItem>
                      <SelectItem value="customers">العملاء</SelectItem>
                      <SelectItem value="maintenance">الصيانة</SelectItem>
                      <SelectItem value="legal">القانوني</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex border-2 border-gray-200 rounded-lg bg-white/90 overflow-hidden">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className="rounded-none h-12 px-4"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none h-12 px-4"
                    >
                      <PieChart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Filter Results Info */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>عرض {filteredReports.length} من أصل {scheduledReports.length} تقرير</span>
                  {(searchQuery || filterStatus !== "all" || filterType !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterStatus("all");
                        setFilterType("all");
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      إزالة الفلاتر
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <span>تحديث تلقائي</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      
                {/* Enhanced Reports Table */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-right flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                إدارة التقارير المجدولة
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>مُحدث الآن</span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
                    <TableHead className="text-right font-bold text-gray-800 py-3 text-sm">الإجراءات</TableHead>
                    <TableHead className="text-right font-bold text-gray-800 text-sm">الحالة</TableHead>
                    <TableHead className="text-right font-bold text-gray-800 text-sm">التنسيق</TableHead>
                    <TableHead className="text-right font-bold text-gray-800 text-sm">التشغيل القادم</TableHead>
                    <TableHead className="text-right font-bold text-gray-800 text-sm">آخر تشغيل</TableHead>
                    <TableHead className="text-right font-bold text-gray-800 text-sm">المستلمون</TableHead>
                    <TableHead className="text-right font-bold text-gray-800 text-sm">التكرار</TableHead>
                    <TableHead className="text-right font-bold text-gray-800 text-sm">التقرير</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Search className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-600">لا توجد تقارير</p>
                            <p className="text-gray-500">لم يتم العثور على تقارير تطابق معايير البحث</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report, index) => {
                      const ReportIcon = reportTypeIcons[report.type as keyof typeof reportTypeIcons];
                      const priority = getReportPriority(report);
                      const priorityColor = getPriorityColor(priority);
                      
                      return (
                        <TableRow 
                          key={report.id} 
                          className="hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100"
                        >
                          <TableCell className="text-right py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setRunDialogOpen(true);
                                  }}
                                  className="text-right flex items-center gap-2 text-xs"
                                >
                                  <Send className="h-3 w-3" />
                                  تشغيل الآن
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleReportStatus(report.id)}
                                  className="text-right flex items-center gap-2 text-xs"
                                >
                                  {report.status === "active" ? (
                                    <>
                                      <PauseCircle className="h-3 w-3" />
                                      إيقاف مؤقت
                                    </>
                                  ) : (
                                    <>
                                      <PlayCircle className="h-3 w-3" />
                                      تفعيل
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-right flex items-center gap-2 text-xs">
                                  <Edit className="h-3 w-3" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-right flex items-center gap-2 text-xs">
                                  <Eye className="h-3 w-3" />
                                  عرض التفاصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-right flex items-center gap-2 text-xs">
                                  <Download className="h-3 w-3" />
                                  تحميل آخر تقرير
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 text-right flex items-center gap-2 text-xs"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Badge 
                              variant={report.status === "active" ? "default" : "secondary"}
                              className={`${
                                report.status === "active" 
                                  ? "bg-green-500 hover:bg-green-600 text-white" 
                                  : "bg-gray-400 hover:bg-gray-500 text-white"
                              } font-medium text-xs px-2 py-1`}
                            >
                              {statusNames[report.status as keyof typeof statusNames]}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Badge variant="outline" className="uppercase font-mono text-xs px-2 py-1">
                              {report.format}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <div className="text-xs">
                              <p className="font-medium text-gray-900">{report.nextRunDate}</p>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Clock className="h-2 w-2" />
                                القادم
                              </p>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right text-xs text-gray-600">
                            {report.lastRun}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {report.recipients.length} مستلم
                              </span>
                              <Mail className="h-3 w-3 text-blue-500" />
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-2 py-1">
                              {frequencyNames[report.frequency as keyof typeof frequencyNames]}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end gap-3">
                              <div className="text-right">
                                <p className="font-medium text-gray-900 text-sm">{report.name}</p>
                                <p className="text-xs text-gray-600">
                                  {reportTypeNames[report.type as keyof typeof reportTypeNames]}
                                </p>
                              </div>
                              <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                                <ReportIcon className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-xl text-red-600">تأكيد الحذف</DialogTitle>
              <DialogDescription className="text-right">
                هل أنت متأكد من حذف التقرير "{selectedReport?.name}"؟ 
                <br />
                <span className="text-red-600 font-medium">لا يمكن التراجع عن هذا الإجراء.</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedReport && deleteReport(selectedReport.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف التقرير
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Run Report Dialog */}
        <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-xl text-blue-600">تشغيل التقرير الآن</DialogTitle>
              <DialogDescription className="text-right">
                سيتم تشغيل التقرير "{selectedReport?.name}" فوراً وإرساله إلى جميع المستلمين المحددين.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Send className="h-5 w-5" />
                  <span className="font-medium">تفاصيل التشغيل:</span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>• المستلمون: {selectedReport?.recipients.length} شخص</p>
                  <p>• التنسيق: {selectedReport?.format.toUpperCase()}</p>
                  <p>• النوع: {selectedReport && reportTypeNames[selectedReport.type as keyof typeof reportTypeNames]}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRunDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={() => selectedReport && runReportNow(selectedReport.id)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                تشغيل التقرير
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </PageContainer>
    </div>
  );
};

export default ScheduledReports;