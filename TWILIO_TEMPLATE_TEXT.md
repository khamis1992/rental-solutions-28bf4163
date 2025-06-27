# 📋 نصوص قالب Twilio - للنسخ المباشر

## 📊 Header Text:
```
📊 تقرير جديد متاح
```

## 📝 Body Text:
```
📋 *اسم التقرير:* {{1}}
📊 *النوع:* {{2}}
📅 *تاريخ الإنشاء:* {{3}}
⏰ *وقت الإنشاء:* {{4}}
📁 *حجم الملف:* {{5}}

🔍 *حالة التقرير:* جاهز للتحميل

لتحميل التقرير، انقر على الملف المرفق أعلاه.
```

## 🏢 Footer Text:
```
🏢 شركة الأرف لتأجير السيارات
📱 نظام التقارير الآلي
```

## ⚙️ Template Settings:
- **Name:** `report_with_pdf`
- **Language:** Arabic (ar)
- **Category:** BUSINESS_UPDATE
- **Media Type:** DOCUMENT
- **Variables:** 5 variables ({{1}} to {{5}})

## 🔧 Variable Examples:
1. **{{1}}** - اسم التقرير: "تقرير الأسطول الشهري - يناير 2024"
2. **{{2}}** - نوع التقرير: "🚗 تقرير الأسطول"
3. **{{3}}** - تاريخ الإنشاء: "الثلاثاء 23 يناير 2024"
4. **{{4}}** - وقت الإنشاء: "02:30 م"
5. **{{5}}** - حجم الملف: "1.2 ميجابايت"

---

## 🎯 خطوات سريعة:
1. اذهب إلى: https://console.twilio.com
2. Messaging → Content Manager → Create new Content
3. WhatsApp → Template → Business Update
4. انسخ النصوص أعلاه ⬆️
5. فعل Media → Document
6. Submit للموافقة 