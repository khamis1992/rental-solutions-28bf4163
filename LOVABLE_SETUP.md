# إعداد المشروع في منصة Lovable.dev

## ✅ حالة التوافق
المشروع متوافق 100% مع منصة Lovable.dev ويحتوي على:
- React 18 + TypeScript
- Vite 5.x (محسن للأداء)
- Tailwind CSS + Radix UI
- lovable-tagger مُفعَل
- إعدادات Vite محسنة لـ Lovable.dev

## 📋 المتغيرات المطلوبة (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Vision API (لمسح البطاقات الشخصية)
VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key

# ChatGPT API (لمعالجة النصوص)
VITE_OPENAI_API_KEY=your_openai_api_key

# Twilio WhatsApp API (لإرسال الرسائل)
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Environment
VITE_ENV=development

# App Configuration
VITE_APP_NAME=نظام إدارة تأجير السيارات
VITE_APP_VERSION=1.0.0
VITE_APP_URL=http://localhost:8081
```

## 🔧 إعداد قاعدة البيانات

### 1. إعداد Supabase
```bash
# في مجلد supabase
supabase init
supabase start
supabase migration up
```

### 2. إعداد الجداول المطلوبة
الجداول الأساسية:
- `profiles` (العملاء)
- `vehicles` (المركبات)
- `leases` (العقود)
- `payments` (الدفعات)
- `traffic_fines` (المخالفات)
- `maintenance_records` (سجلات الصيانة)

## 🚀 التشغيل في Lovable.dev

### 1. استيراد المشروع
- رفع المشروع إلى GitHub
- ربط المستودع بـ Lovable.dev
- تعيين متغيرات البيئة

### 2. إعداد البيئة
```bash
npm install
npm run dev
```

### 3. إعداد الخدمات الخارجية
- **Supabase**: قاعدة البيانات والمصادقة
- **Google Vision**: مسح البطاقات الشخصية
- **OpenAI**: معالجة النصوص
- **Twilio**: إرسال رسائل WhatsApp

## 🎯 الميزات الرئيسية

### 1. إدارة العملاء
- إضافة وتعديل العملاء
- مسح البطاقات الشخصية
- تتبع السجلات المالية

### 2. إدارة المركبات
- إضافة وتعديل المركبات
- تتبع حالة المركبة
- إدارة الصيانة

### 3. إدارة العقود
- إنشاء عقود جديدة
- نظام دفعات أوتوماتيكي
- تتبع المدفوعات

### 4. التقارير والتحليلات
- تقارير مالية
- إحصائيات الأسطول
- تحليلات الأداء

## 📱 دعم الجوال
- تصميم متجاوب بالكامل
- دعم PWA (Progressive Web App)
- واجهة محسنة للجوال

## 🌐 دعم العربية
- دعم RTL كامل
- خطوط عربية محسنة
- واجهة باللغة العربية

## 🔐 الأمان
- مصادقة المستخدمين
- تشفير البيانات
- حماية API Keys

## 📊 مراقبة الأداء
- تتبع الأخطاء
- إحصائيات الأداء
- تحليلات الاستخدام

## 🛠️ أدوات التطوير
- TypeScript للأمان
- ESLint للجودة
- Prettier للتنسيق
- Testing مع Vitest

## 📦 البناء والنشر
```bash
# بناء المشروع
npm run build

# معاينة الإنتاج
npm run preview

# فحص الأنواع
npm run type-check
```

## 🆘 استكشاف الأخطاء

### مشاكل شائعة:
1. **عدم تحميل البيانات**: تحقق من إعدادات Supabase
2. **خطأ في API Keys**: تأكد من صحة المفاتيح
3. **مشاكل في الخطوط**: تحقق من تحميل الخطوط العربية

### الحلول:
- فحص console للأخطاء
- التحقق من network requests
- مراجعة متغيرات البيئة

## 📞 الدعم الفني
- مراجعة الوثائق
- فحص الأخطاء في Console
- التحقق من حالة الخدمات الخارجية

## 🔄 التحديثات
- تحديث dependencies بانتظام
- متابعة تحديثات Lovable.dev
- تحديث الخدمات الخارجية

---

**ملاحظة**: المشروع جاهز للتطوير في Lovable.dev ويحتاج فقط لتعيين متغيرات البيئة المطلوبة. 