const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء تطبيق هجرة نظام التسجيل الشامل...');

try {
  // التحقق من وجود ملف الهجرة
  const migrationFile = path.join(__dirname, 'supabase/migrations/20250130_create_comprehensive_logging_system.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ ملف الهجرة غير موجود:', migrationFile);
    process.exit(1);
  }

  console.log('✅ ملف الهجرة موجود');
  
  // تطبيق الهجرة
  console.log('📄 تطبيق الهجرة...');
  execSync('npx supabase db push', { stdio: 'inherit' });
  
  console.log('✅ تم تطبيق الهجرة بنجاح!');
  console.log('🎉 نظام التسجيل الشامل جاهز للاستخدام');
  
  console.log('\n📋 الخطوات التالية:');
  console.log('1. افتح التطبيق في المتصفح');
  console.log('2. انتقل إلى إدارة النظام > اختبار نظام التسجيل');
  console.log('3. اختبر جميع الوظائف للتأكد من العمل');
  console.log('4. انتقل إلى إدارة السجلات الشاملة لمراجعة السجلات');
  
} catch (error) {
  console.error('❌ حدث خطأ أثناء تطبيق الهجرة:', error.message);
  process.exit(1);
} 