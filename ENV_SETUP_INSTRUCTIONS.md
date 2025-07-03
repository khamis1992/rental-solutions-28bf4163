# 🔧 تعليمات إعداد ملف البيئة (.env)

## 🚨 المشكلة الحالية
```
❌ Environment variables missing!
❌ URL present: false  
❌ Key present: false
```

هذا يعني أن ملف `.env` غير موجود أو لا يحتوي على المتغيرات المطلوبة.

---

## ⚡ الحل السريع (30 ثانية)

### 1. أنشئ ملف `.env` في المجلد الجذر
```bash
# في نفس مجلد package.json
touch .env
```

### 2. انسخ والصق هذا المحتوى في الملف:
```env
# ========================================
# 🔑 متغيرات Supabase الأساسية (مطلوبة)
# ========================================
VITE_SUPABASE_URL=https://vqdlsidkucrownbfuouq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_JYMd-MhBMD2vM1YnGkY1dQs6eStk6Q1OKJ9Y

# ========================================
# 📱 متغيرات WhatsApp/Twilio (اختيارية)
# ========================================
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ========================================
# 🤖 متغيرات الذكاء الاصطناعي (اختيارية)
# ========================================
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key

# ========================================
# 📊 متغيرات المراقبة
# ========================================
VITE_PERFORMANCE_MONITORING=true
VITE_ERROR_REPORTING=true
```

### 3. احفظ الملف وأعد تشغيل الخادم
```bash
# أوقف الخادم (Ctrl+C) ثم شغله مرة أخرى
npm run dev
```

### 4. تحقق من النجاح
افتح المتصفح → F12 → Console
يجب أن تظهر:
```
✅ Environment variables loaded successfully!
✅ VITE_SUPABASE_URL: Present
✅ VITE_SUPABASE_ANON_KEY: Present
```

---

## 🌐 للنشر في بيئة الإنتاج

### Netlify
1. اذهب إلى [Netlify Dashboard](https://app.netlify.com)
2. اختر موقعك → **Site Settings** → **Environment Variables**
3. أضف هذه المتغيرات:
   ```
   VITE_SUPABASE_URL = https://vqdlsidkucrownbfuouq.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOيJIUzI1NiIs...
   ```

### Vercel
1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروعك → **Settings** → **Environment Variables**
3. أضف المتغيرات لجميع البيئات

### GitHub Pages
1. Repository → **Settings** → **Secrets and Variables** → **Actions**
2. أضف المتغيرات كـ Secrets

---

## 🔍 استكشاف الأخطاء

### المشكلة: "ملف .env موجود لكن المتغيرات لا تعمل"
**الحلول:**
1. تأكد أن الملف في نفس مجلد `package.json`
2. تأكد من عدم وجود مسافات حول `=`
3. أعد تشغيل الخادم
4. امسح كاش المتصفح (Ctrl+Shift+R)

### المشكلة: "Cannot find module './utils/env-validator'"
**الحل:**
```bash
npm install
# أو
yarn install
```

### المشكلة: "الموقع لا يعمل في الإنتاج"
**الحل:**
تأكد من إضافة متغيرات البيئة في منصة النشر (Netlify/Vercel)

---

## 📋 قائمة فحص شاملة

- [ ] ملف `.env` موجود في المجلد الجذر
- [ ] لا توجد مسافات في أسماء المتغيرات
- [ ] المتغيرات تبدأ بـ `VITE_`
- [ ] لا توجد أقواس أو اقتباسات إضافية
- [ ] تم إعادة تشغيل الخادم
- [ ] تم مسح كاش المتصفح
- [ ] Console يظهر "✅ Environment variables loaded"

---

## 🆘 مساعدة إضافية

إذا استمرت المشكلة:
1. احذف مجلد `node_modules` و `package-lock.json`
2. شغل `npm install`
3. تحقق من إصدار Node.js (يفضل 18+)
4. تأكد من أنك في المجلد الصحيح

**نصيحة**: استخدم `ls -la` أو `dir` للتأكد من وجود الملف. 