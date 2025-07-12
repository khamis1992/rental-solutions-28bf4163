#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 تطبيق الحلول الطارئة لمشكلة تجمد النظام...');

// Function to backup and replace files
function replaceFile(originalPath, safePath, backupSuffix = '-backup') {
  try {
    const originalFile = path.resolve(originalPath);
    const safeFile = path.resolve(safePath);
    const backupFile = originalFile.replace('.tsx', `${backupSuffix}.tsx`);

    // Create backup if original exists
    if (fs.existsSync(originalFile)) {
      fs.copyFileSync(originalFile, backupFile);
      console.log(`✅ تم إنشاء نسخة احتياطية: ${backupFile}`);
    }

    // Replace with safe version
    if (fs.existsSync(safeFile)) {
      fs.copyFileSync(safeFile, originalFile);
      console.log(`✅ تم استبدال: ${originalFile}`);
    } else {
      console.log(`⚠️ الملف الآمن غير موجود: ${safeFile}`);
    }
  } catch (error) {
    console.error(`❌ خطأ في استبدال ${originalPath}:`, error.message);
  }
}

// Function to update imports in a file
function updateImports(filePath, replacements) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ الملف غير موجود: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    replacements.forEach(({ from, to }) => {
      const regex = new RegExp(from, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, to);
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ تم تحديث الـ imports في: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ خطأ في تحديث ${filePath}:`, error.message);
  }
}

// Step 1: Replace core files
console.log('\n📝 الخطوة 1: استبدال الملفات الأساسية...');

replaceFile('src/App.tsx', 'src/App-Safe.tsx');
replaceFile('src/contexts/SettingsContext.tsx', 'src/contexts/SafeSettingsContext.tsx');
replaceFile('src/contexts/AuthContext.tsx', 'src/contexts/SafeAuthContext.tsx');
replaceFile('src/pages/SystemSettings.tsx', 'src/pages/SafeSystemSettings.tsx');

// Step 2: Update main entry point
console.log('\n📝 الخطوة 2: تحديث نقطة الدخول الرئيسية...');

const mainFiles = ['src/main.tsx', 'src/index.tsx'];
mainFiles.forEach(mainFile => {
  if (fs.existsSync(mainFile)) {
    try {
      let content = fs.readFileSync(mainFile, 'utf8');
      
      // Add emergency imports if not already present
      const emergencyImports = [
        "import '@/utils/emergency-reset';",
        "import '@/utils/loop-detector';"
      ];
      
      emergencyImports.forEach(importLine => {
        if (!content.includes(importLine)) {
          // Add after other imports
          const lines = content.split('\n');
          const lastImportIndex = lines.findLastIndex(line => line.includes('import'));
          if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, importLine);
            content = lines.join('\n');
          }
        }
      });
      
      fs.writeFileSync(mainFile, content, 'utf8');
      console.log(`✅ تم تحديث: ${mainFile}`);
    } catch (error) {
      console.error(`❌ خطأ في تحديث ${mainFile}:`, error.message);
    }
  }
});

// Step 3: Update component imports
console.log('\n📝 الخطوة 3: تحديث استيرادات المكونات...');

const importReplacements = [
  { from: 'useSettings', to: 'useSafeSettings' },
  { from: 'useAuth(?!Context)', to: 'useSafeAuth' },
  { from: 'SettingsProvider', to: 'SafeSettingsProvider' },
  { from: 'AuthProvider', to: 'SafeAuthProvider' }
];

// Find all TypeScript/React files
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      findTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

const tsxFiles = findTsxFiles('src');
tsxFiles.forEach(file => {
  updateImports(file, importReplacements);
});

// Step 4: Create emergency reset script
console.log('\n📝 الخطوة 4: إنشاء سكريبت الطوارئ...');

const emergencyScript = `
<!DOCTYPE html>
<html>
<head>
    <title>إعادة تعيين طارئة</title>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; direction: rtl;">
    <h1>🚨 إعادة تعيين طارئة</h1>
    <p>في حالة تجمد النظام، استخدم الأزرار التالية:</p>
    
    <button onclick="clearStorage()" style="padding: 15px 30px; margin: 10px; font-size: 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
        مسح التخزين المحلي
    </button>
    
    <button onclick="clearCache()" style="padding: 15px 30px; margin: 10px; font-size: 16px; background: #fd7e14; color: white; border: none; border-radius: 5px; cursor: pointer;">
        مسح الذاكرة المؤقتة
    </button>
    
    <button onclick="fullReset()" style="padding: 15px 30px; margin: 10px; font-size: 16px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
        إعادة تعيين كاملة
    </button>
    
    <div id="status" style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;"></div>
    
    <script>
        function log(message) {
            document.getElementById('status').innerHTML += '<div>' + message + '</div>';
        }
        
        function clearStorage() {
            try {
                localStorage.clear();
                sessionStorage.clear();
                log('✅ تم مسح التخزين المحلي');
            } catch (e) {
                log('❌ فشل في مسح التخزين: ' + e.message);
            }
        }
        
        async function clearCache() {
            try {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    log('✅ تم مسح الذاكرة المؤقتة');
                }
                
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                    log('✅ تم إيقاف Service Workers');
                }
            } catch (e) {
                log('❌ فشل في مسح الذاكرة المؤقتة: ' + e.message);
            }
        }
        
        async function fullReset() {
            clearStorage();
            await clearCache();
            log('🔄 إعادة توجيه إلى الصفحة الرئيسية...');
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 2000);
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('public/emergency-reset.html', emergencyScript);
console.log('✅ تم إنشاء صفحة الطوارئ: public/emergency-reset.html');

// Step 5: Update package.json scripts
console.log('\n📝 الخطوة 5: تحديث سكريبتات package.json...');

try {
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['emergency-reset'] = 'node scripts/apply-emergency-fixes.js';
    packageJson.scripts['safe-dev'] = 'npm run emergency-reset && npm run dev';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ تم تحديث package.json');
  }
} catch (error) {
  console.error('❌ خطأ في تحديث package.json:', error.message);
}

console.log('\n🎉 تم تطبيق جميع الحلول الطارئة بنجاح!');
console.log('\n📋 الخطوات التالية:');
console.log('1. npm run dev - لتشغيل التطبيق');
console.log('2. افتح /emergency-reset.html في حالة الطوارئ');
console.log('3. استخدم F12 → Console → emergencyReset() للإعادة السريعة');
console.log('4. راقب console للتحذيرات والأخطاء');

console.log('\n⚠️ ملاحظات مهمة:');
console.log('- تم إنشاء نسخ احتياطية من الملفات الأصلية');
console.log('- يمكن العودة للملفات الأصلية في أي وقت');
console.log('- راجع docs/emergency-freeze-fix-plan.md للتفاصيل'); 