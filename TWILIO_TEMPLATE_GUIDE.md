# 📋 دليل إنشاء قالب Twilio - تقرير مع PDF

## 🎯 تفاصيل القالب المطلوب

### معلومات أساسية:
- **اسم القالب:** `report_with_pdf`
- **اللغة:** العربية (Arabic - ar)
- **النوع:** MEDIA Template
- **الفئة:** BUSINESS_UPDATE
- **الغرض:** إرسال التقارير مع ملفات PDF مرفقة

---

## 📝 محتوى القالب الكامل

### Header (العنوان):
```
Type: TEXT
Content: 📊 تقرير جديد متاح
```

### Body (المحتوى الرئيسي):
```
📋 *اسم التقرير:* {{1}}
📊 *النوع:* {{2}}
📅 *تاريخ الإنشاء:* {{3}}
⏰ *وقت الإنشاء:* {{4}}
📁 *حجم الملف:* {{5}}

🔍 *حالة التقرير:* جاهز للتحميل

لتحميل التقرير، انقر على الملف المرفق أعلاه.
```

### Footer (التذييل):
```
🏢 شركة الأرف لتأجير السيارات
📱 نظام التقارير الآلي
```

### Media (الملف المرفق):
```
Type: DOCUMENT
Support Variable: YES
Max File Size: 16MB
Supported Formats: PDF, DOC, DOCX, XLS, XLSX
```

---

## 🔧 خطوات الإنشاء في Twilio Console

### الخطوة 1: الوصول إلى Content Templates
1. اذهب إلى: https://console.twilio.com
2. سجل دخولك
3. من القائمة الجانبية: **Messaging** → **Content Manager**
4. اضغط **Create new Content**

### الخطوة 2: اختيار نوع المحتوى
```
✅ Content Type: WhatsApp
✅ Message Type: Template
✅ Click "Next"
```

### الخطوة 3: المعلومات الأساسية
```
Template Name: report_with_pdf
Language: Arabic (ar)
Category: BUSINESS_UPDATE
Click "Next"
```

### الخطوة 4: تكوين Header
```
☑️ Add Header: YES
Header Type: TEXT
Header Content: 📊 تقرير جديد متاح
```

### الخطوة 5: تكوين Body
```
Body Text:
📋 *اسم التقرير:* {{1}}
📊 *النوع:* {{2}}
📅 *تاريخ الإنشاء:* {{3}}
⏰ *وقت الإنشاء:* {{4}}
📁 *حجم الملف:* {{5}}

🔍 *حالة التقرير:* جاهز للتحميل

لتحميل التقرير، انقر على الملف المرفق أعلاه.

Variables:
- Variable 1: اسم التقرير
- Variable 2: نوع التقرير  
- Variable 3: تاريخ الإنشاء
- Variable 4: وقت الإنشاء
- Variable 5: حجم الملف
```

### الخطوة 6: تكوين Footer
```
☑️ Add Footer: YES
Footer Text: 🏢 شركة الأرف لتأجير السيارات
📱 نظام التقارير الآلي
```

### الخطوة 7: تكوين Media
```
☑️ Add Media: YES
Media Type: DOCUMENT
☑️ Media supports variable: YES
Max File Size: 16MB
Supported Formats: PDF, DOC, DOCX, XLS, XLSX
```

### الخطوة 8: مراجعة وإرسال
```
1. راجع جميع التفاصيل
2. تأكد من صحة المتغيرات
3. اضغط "Submit for Approval"
4. انتظر الموافقة (24-48 ساعة عادة)
```

---

## 📋 نموذج JSON للقالب

```json
{
  "name": "report_with_pdf",
  "language": "ar",
  "category": "BUSINESS_UPDATE",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "📊 تقرير جديد متاح"
    },
    {
      "type": "BODY",
      "text": "📋 *اسم التقرير:* {{1}}\n📊 *النوع:* {{2}}\n📅 *تاريخ الإنشاء:* {{3}}\n⏰ *وقت الإنشاء:* {{4}}\n📁 *حجم الملف:* {{5}}\n\n🔍 *حالة التقرير:* جاهز للتحميل\n\nلتحميل التقرير، انقر على الملف المرفق أعلاه.",
      "example": {
        "body_text": [
          ["تقرير الأسطول الشهري", "🚗 تقرير الأسطول", "الثلاثاء 23 يناير 2024", "02:30 م", "1.2 ميجابايت"]
        ]
      }
    },
    {
      "type": "FOOTER",
      "text": "🏢 شركة الأرف لتأجير السيارات\n📱 نظام التقارير الآلي"
    },
    {
      "type": "ATTACHMENT",
      "format": "DOCUMENT"
    }
  ]
}
```

---

## 🧪 مثال على الاستخدام

### مثال للاختبار:
```json
{
  "to": "+97466707063",
  "type": "template",
  "template": {
    "name": "report_with_pdf",
    "language": {
      "code": "ar"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "تقرير الأسطول الشهري - يناير 2024"
          },
          {
            "type": "text", 
            "text": "🚗 تقرير الأسطول"
          },
          {
            "type": "text",
            "text": "الثلاثاء 23 يناير 2024"
          },
          {
            "type": "text",
            "text": "02:30 م"
          },
          {
            "type": "text",
            "text": "1.2 ميجابايت"
          }
        ]
      },
      {
        "type": "attachment",
        "parameters": [
          {
            "type": "document",
            "document": {
              "link": "https://example.com/reports/fleet-jan-2024.pdf",
              "filename": "تقرير_الأسطول_يناير_2024.pdf"
            }
          }
        ]
      }
    ]
  }
}
```

---

## ⚠️ نصائح مهمة للموافقة

### ✅ ما يزيد من فرص الموافقة:
1. **محتوى واضح ومفيد** للمستقبل
2. **استخدام الفئة الصحيحة** (BUSINESS_UPDATE)
3. **متغيرات محددة** وذات معنى
4. **نص مهذب وواضح** بدون أخطاء إملائية
5. **غرض تجاري مشروع** (إرسال التقارير)

### ❌ ما يقلل من فرص الموافقة:
1. محتوى ترويجي أو إعلاني
2. رسائل عامة أو غير محددة
3. استخدام فئة خاطئة
4. متغيرات غير واضحة
5. أخطاء في النحو أو الإملاء

---

## 🔄 بعد الموافقة

### 1. الحصول على Content SID:
بعد موافقة WhatsApp، ستحصل على معرف مثل:
```
HXabcd1234567890abcd1234567890abcd
```

### 2. تحديث الكود:
```typescript
// في supabase/functions/send-whatsapp/index.ts
const templateSids = {
  // ... القوالب الأخرى
  'report_with_pdf': 'HXabcd1234567890abcd1234567890abcd', // ضع المعرف الحقيقي هنا
  // ... باقي القوالب
};
```

### 3. اختبار القالب:
```bash
curl -X POST "your-supabase-url/functions/v1/send-whatsapp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "to": "+97466707063",
    "messageType": "report_with_pdf",
    "variables": {
      "1": "تقرير اختبار",
      "2": "🧪 تقرير تجريبي",
      "3": "اليوم",
      "4": "الآن", 
      "5": "500 كيلوبايت"
    },
    "mediaUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  }'
```

---

## 📊 النتيجة المتوقعة

عند إرسال الرسالة، سيستقبل المستخدم:

```
📊 تقرير جديد متاح

📋 اسم التقرير: تقرير الأسطول الشهري - يناير 2024
📊 النوع: 🚗 تقرير الأسطول  
📅 تاريخ الإنشاء: الثلاثاء 23 يناير 2024
⏰ وقت الإنشاء: 02:30 م
📁 حجم الملف: 1.2 ميجابايت

🔍 حالة التقرير: جاهز للتحميل

لتحميل التقرير، انقر على الملف المرفق أعلاه.

🏢 شركة الأرف لتأجير السيارات
📱 نظام التقارير الآلي

[📎 ملف PDF مرفق: تقرير_الأسطول_يناير_2024.pdf]
```

---

## 📋 نسخ للاستخدام المباشر

### نص Header:
```
📊 تقرير جديد متاح
```

### نص Body:
```
📋 *اسم التقرير:* {{1}}
📊 *النوع:* {{2}}
📅 *تاريخ الإنشاء:* {{3}}
⏰ *وقت الإنشاء:* {{4}}
📁 *حجم الملف:* {{5}}

🔍 *حالة التقرير:* جاهز للتحميل

لتحميل التقرير، انقر على الملف المرفق أعلاه.
```

### نص Footer:
```
🏢 شركة الأرف لتأجير السيارات
📱 نظام التقارير الآلي
```

---

## 🎯 ملخص سريع

1. **اذهب إلى:** https://console.twilio.com
2. **انتقل إلى:** Messaging → Content Manager
3. **اختر:** Create new Content → WhatsApp → Template
4. **املأ المعلومات:**
   - Name: `report_with_pdf`
   - Language: Arabic (ar)
   - Category: BUSINESS_UPDATE
5. **أضف المحتوى** كما هو موضح أعلاه
6. **فعل Media** نوع Document
7. **اضغط Submit** وانتظر الموافقة

**🕒 وقت الموافقة المتوقع:** 24-48 ساعة  
**✅ معدل النجاح:** عالي (بسبب المحتوى التجاري المفيد)
