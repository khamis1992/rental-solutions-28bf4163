import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Comprehensive Arabic translations for the entire system
const translations: Record<string, string> = {
  // Common UI Elements
  'common.loading': 'جاري التحميل...',
  'common.error': 'خطأ',
  'common.success': 'تم بنجاح',
  'common.cancel': 'إلغاء',
  'common.save': 'حفظ',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.add': 'إضافة',
  'common.search': 'بحث',
  'common.filter': 'تصفية',
  'common.export': 'تصدير',
  'common.import': 'استيراد',
  'common.refresh': 'تحديث',
  'common.view': 'عرض',
  'common.details': 'التفاصيل',
  'common.status': 'الحالة',
  'common.date': 'التاريخ',
  'common.amount': 'المبلغ',
  'common.total': 'الإجمالي',
  'common.actions': 'الإجراءات',
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.confirm': 'تأكيد',
  'common.back': 'رجوع',
  'common.next': 'التالي',
  'common.previous': 'السابق',
  'common.submit': 'إرسال',
  'common.close': 'إغلاق',
  'common.open': 'فتح',
  'common.select': 'اختيار',
  'common.clear': 'مسح',
  'common.reset': 'إعادة تعيين',
  'common.update': 'تحديث',
  'common.create': 'إنشاء',
  'common.remove': 'إزالة',
  'common.download': 'تحميل',
  'common.upload': 'رفع',
  'common.print': 'طباعة',
  'common.copy': 'نسخ',
  'common.paste': 'لصق',
  'common.cut': 'قص',
  'common.undo': 'تراجع',
  'common.redo': 'إعادة',
  'common.help': 'مساعدة',
  'common.settings': 'الإعدادات',
  'common.preferences': 'التفضيلات',
  'common.profile': 'الملف الشخصي',
  'common.account': 'الحساب',
  'common.logout': 'تسجيل الخروج',
  'common.login': 'تسجيل الدخول',
  'common.register': 'تسجيل جديد',
  'common.password': 'كلمة المرور',
  'common.email': 'البريد الإلكتروني',
  'common.name': 'الاسم',
  'common.phone': 'الهاتف',
  'common.address': 'العنوان',
  'common.city': 'المدينة',
  'common.country': 'البلد',
  'common.description': 'الوصف',
  'common.notes': 'ملاحظات',
  'common.type': 'النوع',
  'common.category': 'الفئة',
  'common.priority': 'الأولوية',
  'common.urgent': 'عاجل',
  'common.normal': 'عادي',
  'common.low': 'منخفض',
  'common.high': 'مرتفع',
  'common.medium': 'متوسط',
  'common.active': 'نشط',
  'common.inactive': 'غير نشط',
  'common.enabled': 'مفعل',
  'common.disabled': 'معطل',
  'common.available': 'متاح',
  'common.unavailable': 'غير متاح',
  'common.online': 'متصل',
  'common.offline': 'غير متصل',
  'common.pending': 'في الانتظار',
  'common.approved': 'موافق عليه',
  'common.rejected': 'مرفوض',
  'common.completed': 'مكتمل',
  'common.in_progress': 'قيد التنفيذ',
  'common.scheduled': 'مجدول',
  'common.overdue': 'متأخر',
  'common.expired': 'منتهي الصلاحية',
  'common.valid': 'صالح',
  'common.invalid': 'غير صالح',
  'common.required': 'مطلوب',
  'common.optional': 'اختياري',
  'common.all': 'الكل',
  'common.none': 'لا شيء',
  'common.other': 'أخرى',
  'common.unknown': 'غير معروف',
  'common.new': 'جديد',
  'common.old': 'قديم',
  'common.recent': 'حديث',
  'common.today': 'اليوم',
  'common.yesterday': 'أمس',
  'common.tomorrow': 'غداً',
  'common.week': 'أسبوع',
  'common.month': 'شهر',
  'common.year': 'سنة',
  'common.daily': 'يومي',
  'common.weekly': 'أسبوعي',
  'common.monthly': 'شهري',
  'common.yearly': 'سنوي',

  // Navigation
  'navigation.dashboard': 'لوحة التحكم',
  'navigation.vehicles': 'المركبات',
  'navigation.customers': 'العملاء',
  'navigation.agreements': 'العقود',
  'navigation.maintenance': 'الصيانة',
  'navigation.legal': 'القانونية',
  'navigation.financials': 'الإدارة المالية',
  'navigation.reports': 'التقارير',
  'navigation.settings': 'الإعدادات',
  'navigation.traffic_fines': 'المخالفات المرورية',
  'navigation.documents': 'المستندات',
  'navigation.users': 'إدارة المستخدمين',
  'navigation.report_builder': 'منشئ التقارير',

  // Vehicle Management
  'vehicle.status.available': 'متاح',
  'vehicle.status.rented': 'مؤجر',
  'vehicle.status.maintenance': 'صيانة',
  'vehicle.status.out_of_service': 'خارج الخدمة',
  'vehicle.add': 'إضافة مركبة',
  'vehicle.edit': 'تعديل مركبة',
  'vehicle.delete': 'حذف مركبة',
  'vehicle.details': 'تفاصيل المركبة',
  'vehicle.license_plate': 'رقم اللوحة',
  'vehicle.make': 'الماركة',
  'vehicle.model': 'الموديل',
  'vehicle.year': 'سنة الصنع',
  'vehicle.color': 'اللون',
  'vehicle.vin': 'رقم الهيكل',
  'vehicle.mileage': 'المسافة المقطوعة',
  'vehicle.fuel_type': 'نوع الوقود',
  'vehicle.transmission': 'ناقل الحركة',
  'vehicle.insurance': 'التأمين',
  'vehicle.registration': 'التسجيل',
  'vehicle.inspection': 'الفحص',
  'vehicle.search_placeholder': 'البحث عن مركبة...',

  // Customer Management
  'customer.add': 'إضافة عميل',
  'customer.edit': 'تعديل عميل',
  'customer.delete': 'حذف عميل',
  'customer.details': 'تفاصيل العميل',
  'customer.full_name': 'الاسم الكامل',
  'customer.national_id': 'رقم الهوية',
  'customer.license_number': 'رقم الرخصة',
  'customer.phone_number': 'رقم الهاتف',
  'customer.email_address': 'البريد الإلكتروني',
  'customer.address': 'العنوان',
  'customer.date_of_birth': 'تاريخ الميلاد',
  'customer.search_placeholder': 'البحث عن عميل...',

  // Agreement Management
  'agreement.add': 'إضافة عقد',
  'agreement.edit': 'تعديل عقد',
  'agreement.delete': 'حذف عقد',
  'agreement.details': 'تفاصيل العقد',
  'agreement.number': 'رقم العقد',
  'agreement.start_date': 'تاريخ البداية',
  'agreement.end_date': 'تاريخ النهاية',
  'agreement.daily_rate': 'السعر اليومي',
  'agreement.total_amount': 'المبلغ الإجمالي',
  'agreement.deposit': 'العربون',
  'agreement.status.active': 'نشط',
  'agreement.status.completed': 'مكتمل',
  'agreement.status.cancelled': 'ملغي',
  'agreement.search_placeholder': 'البحث في العقود...',

  // Maintenance
  'maintenance.scheduled': 'مجدولة',
  'maintenance.in_progress': 'قيد التنفيذ',
  'maintenance.completed': 'مكتملة',
  'maintenance.overdue': 'متأخرة',
  'maintenance.add': 'إضافة صيانة',
  'maintenance.edit': 'تعديل صيانة',
  'maintenance.delete': 'حذف صيانة',
  'maintenance.details': 'تفاصيل الصيانة',
  'maintenance.type': 'نوع الصيانة',
  'maintenance.description': 'وصف الصيانة',
  'maintenance.cost': 'التكلفة',
  'maintenance.date': 'تاريخ الصيانة',
  'maintenance.mechanic': 'الميكانيكي',
  'maintenance.notes': 'ملاحظات الصيانة',

  // Financial Management
  'financial.revenue': 'الإيرادات',
  'financial.expenses': 'المصروفات',
  'financial.profit': 'الربح',
  'financial.loss': 'الخسارة',
  'financial.payment': 'الدفع',
  'financial.invoice': 'الفاتورة',
  'financial.receipt': 'الإيصال',
  'financial.balance': 'الرصيد',
  'financial.due_date': 'تاريخ الاستحقاق',
  'financial.paid': 'مدفوع',
  'financial.unpaid': 'غير مدفوع',
  'financial.partial': 'جزئي',

  // Legal Management
  'legal.case': 'القضية',
  'legal.document': 'الوثيقة',
  'legal.contract': 'العقد',
  'legal.compliance': 'الامتثال',
  'legal.regulation': 'اللائحة',
  'legal.deadline': 'الموعد النهائي',
  'legal.status.open': 'مفتوحة',
  'legal.status.closed': 'مغلقة',
  'legal.status.pending': 'في الانتظار',

  // Traffic Fines
  'traffic_fine.violation': 'المخالفة',
  'traffic_fine.amount': 'مبلغ المخالفة',
  'traffic_fine.date': 'تاريخ المخالفة',
  'traffic_fine.location': 'موقع المخالفة',
  'traffic_fine.status.paid': 'مدفوعة',
  'traffic_fine.status.unpaid': 'غير مدفوعة',
  'traffic_fine.status.disputed': 'متنازع عليها',

  // Reports
  'report.generate': 'إنشاء تقرير',
  'report.export': 'تصدير التقرير',
  'report.print': 'طباعة التقرير',
  'report.schedule': 'جدولة التقرير',
  'report.type.financial': 'تقرير مالي',
  'report.type.vehicle': 'تقرير المركبات',
  'report.type.customer': 'تقرير العملاء',
  'report.type.maintenance': 'تقرير الصيانة',

  // User Management
  'user.profile': 'الملف الشخصي',
  'user.admin': 'مشرف',
  'user.manager': 'مدير',
  'user.employee': 'موظف',
  'user.role': 'الدور',
  'user.permissions': 'الصلاحيات',
  'user.last_login': 'آخر تسجيل دخول',
  'user.created_at': 'تاريخ الإنشاء',

  // System Settings
  'settings.general': 'عام',
  'settings.security': 'الأمان',
  'settings.notifications': 'الإشعارات',
  'settings.backup': 'النسخ الاحتياطي',
  'settings.system': 'النظام',
  'settings.company': 'الشركة',
  'settings.localization': 'التوطين',

  // Form Validation
  'validation.required': 'هذا الحقل مطلوب',
  'validation.email': 'يرجى إدخال بريد إلكتروني صحيح',
  'validation.phone': 'يرجى إدخال رقم هاتف صحيح',
  'validation.min_length': 'يجب أن يكون الحد الأدنى {min} أحرف',
  'validation.max_length': 'يجب أن لا يتجاوز {max} حرف',
  'validation.numeric': 'يجب أن يكون رقماً',
  'validation.positive': 'يجب أن يكون رقماً موجباً',
  'validation.date': 'يرجى إدخال تاريخ صحيح',

  // Messages
  'message.save_success': 'تم الحفظ بنجاح',
  'message.delete_success': 'تم الحذف بنجاح',
  'message.update_success': 'تم التحديث بنجاح',
  'message.create_success': 'تم الإنشاء بنجاح',
  'message.error_occurred': 'حدث خطأ',
  'message.network_error': 'خطأ في الشبكة',
  'message.permission_denied': 'ليس لديك صلاحية',
  'message.not_found': 'غير موجود',
  'message.confirm_delete': 'هل أنت متأكد من الحذف؟',
  'message.unsaved_changes': 'لديك تغييرات غير محفوظة',
  'message.loading': 'جاري التحميل...',
  'message.no_data': 'لا توجد بيانات',
  'message.search_no_results': 'لا توجد نتائج للبحث',

  // Pagination
  'pagination.showing': 'عرض',
  'pagination.to': 'إلى',
  'pagination.of': 'من',
  'pagination.items': 'عنصر',
  'pagination.page': 'صفحة',
  'pagination.first': 'الأولى',
  'pagination.last': 'الأخيرة',
  'pagination.next': 'التالي',
  'pagination.previous': 'السابق',

  // Date and Time
  'date.today': 'اليوم',
  'date.yesterday': 'أمس',
  'date.tomorrow': 'غداً',
  'date.this_week': 'هذا الأسبوع',
  'date.last_week': 'الأسبوع الماضي',
  'date.this_month': 'هذا الشهر',
  'date.last_month': 'الشهر الماضي',
  'date.this_year': 'هذا العام',
  'date.last_year': 'العام الماضي',

  // File Operations
  'file.upload': 'رفع ملف',
  'file.download': 'تحميل ملف',
  'file.delete': 'حذف ملف',
  'file.size': 'حجم الملف',
  'file.type': 'نوع الملف',
  'file.name': 'اسم الملف',
  'file.select': 'اختيار ملف',
  'file.drag_drop': 'اسحب وأفلت الملف هنا',

  // Dashboard
  'dashboard.overview': 'نظرة عامة',
  'dashboard.statistics': 'الإحصائيات',
  'dashboard.recent_activity': 'النشاط الحديث',
  'dashboard.quick_actions': 'إجراءات سريعة',
  'dashboard.notifications': 'الإشعارات',
  'dashboard.alerts': 'التنبيهات',

  // Status Messages
  'status.online': 'متصل',
  'status.offline': 'غير متصل',
  'status.connecting': 'جاري الاتصال...',
  'status.disconnected': 'منقطع',
  'status.syncing': 'جاري المزامنة...',
  'status.synced': 'تمت المزامنة',
  'status.error': 'خطأ',
  'status.warning': 'تحذير',
  'status.info': 'معلومات',
  'status.success': 'نجح',
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always use Arabic - no language switching
  const [language] = useState<Language>('ar');
  const isRTL = true; // Always RTL for Arabic

  // Set document direction and language on mount
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    localStorage.setItem('language', 'ar');
  }, []);

  // Translation function
  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  // Dummy setLanguage function for compatibility (does nothing)
  const setLanguage = (lang: Language) => {
    // No-op since we only support Arabic
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    isRTL,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
