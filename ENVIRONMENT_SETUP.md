# دليل إعداد البيئة والمفاتيح الحساسة

## 🔐 أمان المفاتيح

تم إزالة جميع المفاتيح الحساسة من الكود المصدري لضمان الأمان ومطابقة سياسات GitHub.

## 📁 ملفات البيئة

### 1. ملف .env (للتطوير المحلي)
```bash
# انسخ env.example إلى .env وضع المفاتيح الحقيقية
cp env.example .env
```

ثم حرر `.env` وضع المفاتيح الفعلية:
```env
VITE_GOOGLE_VISION_API_KEY=your_actual_google_vision_api_key
VITE_OPENAI_API_KEY=your_actual_openai_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🌐 البيئات المختلفة

### التطوير المحلي (Development)
```bash
# 1. انسخ ملف المثال
cp env.example .env

# 2. ضع المفاتيح التجريبية في .env
# 3. تأكد أن .env في .gitignore (✅ موجود)
```

### البيئة التجريبية (Staging)
```bash
# استخدم نفس المفاتيح التطويرية
# أو مفاتيح منفصلة للاختبار
```

### الإنتاج (Production)

#### أ) Vercel
```bash
# في لوحة تحكم Vercel:
# Settings → Environment Variables
VITE_GOOGLE_VISION_API_KEY=your_production_key
VITE_OPENAI_API_KEY=your_production_key
```

#### ب) Netlify
```bash
# في لوحة تحكم Netlify:
# Site Settings → Environment Variables
```

#### ج) Docker
```dockerfile
# في docker-compose.yml
environment:
  - VITE_GOOGLE_VISION_API_KEY=${GOOGLE_VISION_API_KEY}
  - VITE_OPENAI_API_KEY=${OPENAI_API_KEY}
```

## 🔧 اختبار المفاتيح

### فحص Google Vision API
```bash
# اذهب إلى: http://localhost:8081/google-vision-test
# ستظهر حالة المفتاح والاختبار
```

### فحص ChatGPT API
```bash
# اذهب إلى: http://localhost:8081/chatgpt-contract-test
# جرب رفع ملف عقد للاختبار
```

## ⚠️ تحذيرات أمنية

### ❌ لا تفعل أبداً:
- رفع ملف .env إلى Git
- كتابة المفاتيح في الكود مباشرة
- مشاركة المفاتيح في الرسائل أو الدردشة
- استخدام نفس المفاتيح في التطوير والإنتاج

### ✅ افعل دائماً:
- استخدم متغيرات البيئة
- استخدم خدمات إدارة المفاتيح في الإنتاج
- قم بتدوير المفاتيح بانتظام
- راقب استخدام API keys

## 🚀 نشر التطبيق

### 1. التحضير للنشر
```bash
# تأكد من عدم وجود مفاتيح في الكود
git grep -r "sk-proj\|AIzaSy" src/

# إذا وجدت أي شيء، أزله قبل الرفع
```

### 2. إعداد CI/CD
```yaml
# في GitHub Actions (.github/workflows/deploy.yml)
env:
  VITE_GOOGLE_VISION_API_KEY: ${{ secrets.GOOGLE_VISION_API_KEY }}
  VITE_OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 3. GitHub Secrets
```bash
# في GitHub Repository:
# Settings → Secrets and Variables → Actions
# أضف المفاتيح كـ Repository Secrets
```

## 🔍 استكشاف الأخطاء

### خطأ: "API key not found"
```bash
# تحقق من ملف .env
cat .env | grep VITE_

# تحقق من تحميل المتغيرات
console.log(import.meta.env.VITE_GOOGLE_VISION_API_KEY)
```

### خطأ: "403 Forbidden"
```bash
# المفتاح غير صحيح أو منتهي الصلاحية
# أو تم تجاوز الحد المسموح للاستخدام
```

## 📋 قائمة التحقق

- [ ] تم نسخ env.example إلى .env
- [ ] تم إدخال جميع المفاتيح في .env
- [ ] تم التأكد أن .env في .gitignore
- [ ] تم اختبار Google Vision API
- [ ] تم اختبار ChatGPT API
- [ ] تم إعداد متغيرات الإنتاج
- [ ] لا توجد مفاتيح مكشوفة في الكود

## 🆘 دعم

إذا واجهت مشاكل:
1. تأكد من صحة المفاتيح
2. تحقق من اتصال الإنترنت
3. راجع console للأخطاء
4. اختبر المفاتيح في Google Cloud Console
5. اختبر المفاتيح في OpenAI Platform 