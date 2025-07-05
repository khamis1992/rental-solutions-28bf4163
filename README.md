# 🚗 العراف لتأجير السيارات | Rental Solutions

[![Deploy to Production](https://github.com/rental-solutions/platform/actions/workflows/production-deploy.yml/badge.svg)](https://github.com/rental-solutions/platform/actions/workflows/production-deploy.yml)
[![Tests](https://github.com/rental-solutions/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/rental-solutions/platform/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/rental-solutions/platform/branch/main/graph/badge.svg)](https://codecov.io/gh/rental-solutions/platform)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

نظام متكامل لإدارة تأجير السيارات باللغة العربية مع دعم RTL كامل، مبني بأحدث التقنيات والممارسات الأمنية.

## 🌟 المميزات الرئيسية

### 📊 لوحة التحكم
- **إحصائيات شاملة** - عرض الإحصائيات في الوقت الفعلي
- **تنبيهات ذكية** - تنبيهات للدفعات المتأخرة والصيانة
- **مخططات بيانية** - تحليلات بصرية للأداء

### 👥 إدارة العملاء
- **ملفات شخصية كاملة** - معلومات العملاء والوثائق
- **سجل الإيجارات** - تاريخ كامل للعمليات
- **تقييم الائتمان** - نظام تقييم للعملاء

### 🚗 إدارة المركبات
- **كتالوج شامل** - قاعدة بيانات للمركبات
- **جدولة الصيانة** - تتبع الصيانة الدورية
- **تتبع GPS** - مراقبة المركبات في الوقت الفعلي

### 📄 إدارة العقود
- **عقود رقمية** - إنشاء وتوقيع إلكتروني
- **تنبيهات الانتهاء** - تذكيرات تلقائية
- **تجديد تلقائي** - خيارات التجديد المرنة

### 💰 النظام المالي
- **فواتير احترافية** - تصميم عربي متقن
- **تتبع الدفعات** - سجل مالي شامل
- **تقارير مالية** - تحليلات مالية مفصلة

### 🔧 الصيانة والخدمات
- **جدولة الصيانة** - تخطيط الصيانة الوقائية
- **تتبع التكاليف** - مراقبة تكاليف الصيانة
- **سجل الأعطال** - قاعدة بيانات للمشاكل

## 🛠️ التقنيات المستخدمة

### Frontend
- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - للتطوير الآمن
- **Tailwind CSS** - تصميم responsive
- **Zustand** - إدارة الحالة
- **React Query** - إدارة البيانات
- **React Router** - التنقل

### Backend
- **Node.js** - بيئة تشغيل الخادم
- **Express** - إطار عمل الويب
- **TypeScript** - للتطوير الآمن
- **Prisma** - ORM قاعدة البيانات

### Database
- **Supabase** - قاعدة بيانات PostgreSQL
- **Redis** - تخزين مؤقت
- **MinIO** - تخزين الملفات

### DevOps
- **Docker** - حاويات التطبيق
- **Kubernetes** - إدارة الحاويات
- **AWS EKS** - خدمة Kubernetes
- **GitHub Actions** - CI/CD
- **Terraform** - إدارة البنية التحتية

### Monitoring
- **Prometheus** - جمع المقاييس
- **Grafana** - لوحات المراقبة
- **Sentry** - تتبع الأخطاء
- **ELK Stack** - تحليل السجلات

## 🚀 البدء السريع

### المتطلبات الأساسية
```bash
# Node.js v18 أو أحدث
node --version

# Docker
docker --version

# kubectl (للإنتاج)
kubectl version --client
```

### التثبيت المحلي
```bash
# استنساخ المشروع
git clone https://github.com/rental-solutions/platform.git
cd platform

# تثبيت التبعيات
npm install

# إعداد متغيرات البيئة
cp .env.example .env.local

# تشغيل قاعدة البيانات المحلية
docker-compose up -d

# تشغيل التطبيق
npm run dev
```

### إعداد قاعدة البيانات
```bash
# تشغيل المايجريشن
npm run db:migrate

# إدراج البيانات الأولية
npm run db:seed
```

## 🧪 الاختبارات

### تشغيل الاختبارات
```bash
# جميع الاختبارات
npm test

# اختبارات الوحدة
npm run test:unit

# اختبارات التكامل
npm run test:integration

# اختبارات E2E
npm run test:e2e

# تغطية الاختبارات
npm run test:coverage
```

### أنواع الاختبارات
- **Unit Tests** - اختبار المكونات الفردية
- **Integration Tests** - اختبار التكامل بين الخدمات
- **E2E Tests** - اختبار كامل للتطبيق
- **Performance Tests** - اختبار الأداء
- **Security Tests** - اختبار الأمان

## 🚢 النشر

### البيئات المتاحة
- **Development** - بيئة التطوير المحلية
- **Staging** - بيئة الاختبار
- **Production** - بيئة الإنتاج

### النشر التلقائي
```bash
# النشر إلى Staging
./scripts/deploy.sh deploy staging

# النشر إلى Production
./scripts/deploy.sh deploy production

# عرض حالة النشر
./scripts/deploy.sh status production

# الرجوع للإصدار السابق
./scripts/deploy.sh rollback production
```

### GitHub Actions
النشر التلقائي يتم عبر GitHub Actions:
1. **Code Quality** - فحص الكود والاختبارات
2. **Security Scan** - فحص الأمان
3. **Build** - بناء Docker images
4. **Deploy to Staging** - نشر للاختبار
5. **E2E Tests** - اختبارات شاملة
6. **Deploy to Production** - نشر للإنتاج

## 🔧 التكوين

### متغيرات البيئة
```env
# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API
VITE_API_URL=http://localhost:3000/api

# Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
GOOGLE_VISION_API_KEY=your-google-vision-key
```

### تكوين Kubernetes
```yaml
# إعداد Namespace
kubectl apply -f k8s/production/namespace.yaml

# إعداد Secrets
kubectl apply -f k8s/production/secrets.yaml

# إعداد ConfigMap
kubectl apply -f k8s/production/configmap.yaml

# نشر التطبيق
kubectl apply -f k8s/production/deployment.yaml
```

## 📊 المراقبة والتحليل

### المقاييس الرئيسية
- **Uptime** - وقت التشغيل
- **Response Time** - زمن الاستجابة
- **Error Rate** - معدل الأخطاء
- **Throughput** - معدل الطلبات
- **Resource Usage** - استخدام الموارد

### Dashboards
- **Application Metrics** - مقاييس التطبيق
- **Infrastructure Metrics** - مقاييس البنية التحتية
- **Business Metrics** - مقاييس الأعمال
- **User Analytics** - تحليل المستخدمين

### التنبيهات
```yaml
# مثال على قاعدة التنبيه
groups:
  - name: rental-solutions-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "معدل أخطاء عالي"
          description: "معدل الأخطاء أكثر من 10% لمدة 5 دقائق"
```

## 🔐 الأمان

### الممارسات الأمنية
- **Authentication** - JWT tokens
- **Authorization** - RBAC
- **Input Validation** - تنظيف البيانات
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content Security Policy
- **Rate Limiting** - حد الطلبات
- **HTTPS** - تشفير البيانات

### مراجعة الأمان
```bash
# فحص التبعيات
npm audit

# فحص الأمان
npm run security:scan

# فحص الكود
npm run security:code-scan
```

## 📚 التوثيق

### API Documentation
- **OpenAPI/Swagger** - توثيق تفاعلي
- **Postman Collection** - مجموعة اختبارات
- **API Examples** - أمثلة الاستخدام

### Architecture
- **System Design** - تصميم النظام
- **Database Schema** - مخطط قاعدة البيانات
- **Component Architecture** - هيكل المكونات

### Deployment
- **Infrastructure as Code** - Terraform
- **Kubernetes Manifests** - ملفات K8s
- **Docker Compose** - إعداد محلي

## 🤝 المساهمة

### إرشادات المساهمة
1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. كتابة الاختبارات
4. التأكد من تمرير جميع الاختبارات
5. إرسال Pull Request

### معايير الكود
- **TypeScript** - استخدام إجباري
- **ESLint** - قواعد الكود
- **Prettier** - تنسيق الكود
- **Testing** - تغطية 80% على الأقل
- **Documentation** - توثيق المكونات

### Review Process
- **Code Review** - مراجعة الكود
- **Testing** - اختبار الميزات
- **Security Review** - مراجعة الأمان
- **Performance Review** - مراجعة الأداء

## 📈 الأداء

### المقاييس المستهدفة
- **First Contentful Paint** - < 1.5s
- **Largest Contentful Paint** - < 2.5s
- **Time to Interactive** - < 3.5s
- **Cumulative Layout Shift** - < 0.1

### التحسينات
- **Code Splitting** - تقسيم الكود
- **Lazy Loading** - تحميل مؤجل
- **Caching** - تخزين مؤقت
- **CDN** - شبكة توزيع المحتوى
- **Bundle Analysis** - تحليل الحزم

## 🌍 الدعم الدولي

### اللغات المدعومة
- **العربية** - اللغة الأساسية
- **الإنجليزية** - لغة ثانوية

### الـ RTL Support
- **بيانات RTL** - دعم كامل
- **تصميم RTL** - تخطيط مناسب
- **خطوط عربية** - خطوط احترافية

## 📞 الدعم

### القنوات المتاحة
- **GitHub Issues** - للمشاكل التقنية
- **Email** - support@rental-solutions.qa
- **Documentation** - دليل المستخدم
- **Community** - منتدى المجتمع

### SLA
- **Response Time** - < 24 ساعة
- **Resolution Time** - < 72 ساعة
- **Availability** - 99.9%

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🙏 الشكر والتقدير

- **فريق التطوير** - للجهود المتميزة
- **المجتمع** - للمساهمات والاقتراحات
- **العملاء** - للثقة والدعم المستمر

---

<div align="center">
  <p>مع تحيات فريق العراف لتأجير السيارات</p>
  <p>🚗 نحو مستقبل أفضل في تأجير السيارات</p>
</div>
