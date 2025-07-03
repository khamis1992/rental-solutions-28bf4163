/**
 * نظام فحص وتحقق من متغيرات البيئة
 * Environment Variables Validation System
 */

export interface EnvVariable {
  key: string;
  required: boolean;
  sensitive: boolean;
  description: string;
  defaultValue?: string;
  validationPattern?: RegExp;
}

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  present: string[];
  suggestions: string[];
}

/**
 * قائمة جميع متغيرات البيئة المطلوبة والاختيارية
 */
export const ENV_VARIABLES: EnvVariable[] = [
  // متغيرات Supabase الأساسية
  {
    key: 'VITE_SUPABASE_URL',
    required: true,
    sensitive: false,
    description: 'Supabase Project URL',
    validationPattern: /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    sensitive: true,
    description: 'Supabase Anonymous/Public Key',
    validationPattern: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
  },
  {
    key: 'VITE_SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    sensitive: true,
    description: 'Supabase Service Role Key (for admin operations)'
  },

  // متغيرات Twilio/WhatsApp
  {
    key: 'VITE_TWILIO_ACCOUNT_SID',
    required: false,
    sensitive: true,
    description: 'Twilio Account SID for WhatsApp',
    validationPattern: /^AC[a-f0-9]{32}$/
  },
  {
    key: 'VITE_TWILIO_AUTH_TOKEN',
    required: false,
    sensitive: true,
    description: 'Twilio Auth Token'
  },
  {
    key: 'VITE_TWILIO_WHATSAPP_NUMBER',
    required: false,
    sensitive: false,
    description: 'Twilio WhatsApp Number',
    defaultValue: 'whatsapp:+14155238886',
    validationPattern: /^whatsapp:\+\d{10,15}$/
  },

  // متغيرات الذكاء الاصطناعي
  {
    key: 'VITE_OPENAI_API_KEY',
    required: false,
    sensitive: true,
    description: 'OpenAI API Key for contract extraction',
    validationPattern: /^sk-[A-Za-z0-9]{20,}$/
  },
  {
    key: 'VITE_GOOGLE_VISION_API_KEY',
    required: false,
    sensitive: true,
    description: 'Google Vision API Key for OCR'
  },

  // متغيرات المراقبة
  {
    key: 'VITE_PERFORMANCE_MONITORING',
    required: false,
    sensitive: false,
    description: 'Enable performance monitoring',
    defaultValue: 'true'
  },
  {
    key: 'VITE_ERROR_REPORTING',
    required: false,
    sensitive: false,
    description: 'Enable error reporting',
    defaultValue: 'true'
  },

  // متغيرات الإشعارات
  {
    key: 'VITE_VAPID_PUBLIC_KEY',
    required: false,
    sensitive: false,
    description: 'VAPID Public Key for push notifications'
  },
  {
    key: 'VITE_VAPID_PRIVATE_KEY',
    required: false,
    sensitive: true,
    description: 'VAPID Private Key for push notifications'
  }
];

/**
 * فحص وتحقق من جميع متغيرات البيئة
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    missing: [],
    present: [],
    suggestions: []
  };

  console.group('🔍 فحص متغيرات البيئة');

  for (const envVar of ENV_VARIABLES) {
    const value = import.meta.env[envVar.key];
    const hasValue = value !== undefined && value !== null && value !== '';

    if (hasValue) {
      result.present.push(envVar.key);
      
      // التحقق من صحة القيمة إذا كان هناك نمط للتحقق
      if (envVar.validationPattern && !envVar.validationPattern.test(value)) {
        result.errors.push(`❌ ${envVar.key}: القيمة غير صحيحة (${envVar.description})`);
        result.isValid = false;
      } else {
        const displayValue = envVar.sensitive 
          ? `${value.substring(0, 10)}...`
          : value;
        console.log(`✅ ${envVar.key}: ${displayValue}`);
      }
    } else {
      if (envVar.required) {
        result.missing.push(envVar.key);
        result.errors.push(`❌ ${envVar.key}: مطلوب - ${envVar.description}`);
        result.isValid = false;
      } else {
        result.warnings.push(`⚠️ ${envVar.key}: غير موجود - ${envVar.description}`);
        
        if (envVar.defaultValue) {
          result.suggestions.push(`💡 يمكنك إضافة ${envVar.key}=${envVar.defaultValue}`);
        }
      }
    }
  }

  console.groupEnd();

  // إضافة اقتراحات عامة
  if (result.missing.length > 0) {
    result.suggestions.push(
      '📁 تأكد من وجود ملف .env في المجلد الجذر',
      '🔄 أعد تشغيل الخادم بعد إضافة المتغيرات',
      '🌐 في بيئة الإنتاج، أضف المتغيرات في لوحة تحكم المنصة'
    );
  }

  return result;
}

/**
 * عرض تقرير مفصل عن حالة متغيرات البيئة
 */
export function displayEnvironmentReport(): void {
  const validation = validateEnvironmentVariables();
  
  console.group('📊 تقرير متغيرات البيئة');
  
  console.log('🌍 البيئة الحالية:', import.meta.env.MODE);
  console.log('📈 الحالة العامة:', validation.isValid ? '✅ صحيحة' : '❌ بها مشاكل');
  
  if (validation.present.length > 0) {
    console.group('✅ متغيرات موجودة (' + validation.present.length + ')');
    validation.present.forEach(key => console.log(`  • ${key}`));
    console.groupEnd();
  }

  if (validation.missing.length > 0) {
    console.group('❌ متغيرات مفقودة (' + validation.missing.length + ')');
    validation.missing.forEach(key => console.error(`  • ${key}`));
    console.groupEnd();
  }

  if (validation.errors.length > 0) {
    console.group('🚨 أخطاء');
    validation.errors.forEach(error => console.error(error));
    console.groupEnd();
  }

  if (validation.warnings.length > 0) {
    console.group('⚠️ تحذيرات');
    validation.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }

  if (validation.suggestions.length > 0) {
    console.group('💡 اقتراحات');
    validation.suggestions.forEach(suggestion => console.info(suggestion));
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * إنشاء ملف .env مثال بناءً على المتغيرات المفقودة
 */
export function generateEnvExample(missingOnly: boolean = false): string {
  const envContent: string[] = [
    '# ========================================',
    '# متغيرات البيئة - مثال',
    '# ========================================',
    ''
  ];

  const categoriesToInclude = missingOnly 
    ? ENV_VARIABLES.filter(v => !import.meta.env[v.key])
    : ENV_VARIABLES;

  // تجميع المتغيرات حسب النوع
  const groups = {
    supabase: categoriesToInclude.filter(v => v.key.includes('SUPABASE')),
    twilio: categoriesToInclude.filter(v => v.key.includes('TWILIO')),
    ai: categoriesToInclude.filter(v => v.key.includes('OPENAI') || v.key.includes('GOOGLE')),
    monitoring: categoriesToInclude.filter(v => v.key.includes('PERFORMANCE') || v.key.includes('ERROR')),
    notifications: categoriesToInclude.filter(v => v.key.includes('VAPID'))
  };

  Object.entries(groups).forEach(([groupName, variables]) => {
    if (variables.length === 0) return;

    const groupTitles = {
      supabase: '🔑 متغيرات Supabase',
      twilio: '📱 متغيرات WhatsApp/Twilio', 
      ai: '🤖 متغيرات الذكاء الاصطناعي',
      monitoring: '📊 متغيرات المراقبة',
      notifications: '🔔 متغيرات الإشعارات'
    };

    envContent.push(`# ${groupTitles[groupName as keyof typeof groupTitles]}`);
    
    variables.forEach(envVar => {
      envContent.push(`# ${envVar.description}`);
      const value = envVar.defaultValue || 'your_value_here';
      envContent.push(`${envVar.key}=${value}`);
      envContent.push('');
    });
  });

  return envContent.join('\n');
}

/**
 * فحص صحة اتصال Supabase
 */
export async function validateSupabaseConnection(): Promise<boolean> {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('❌ متغيرات Supabase مفقودة');
      return false;
    }

    // محاولة استدعاء بسيط للتحقق من الاتصال
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (response.ok) {
      console.log('✅ اتصال Supabase ناجح');
      return true;
    } else {
      console.error('❌ فشل اتصال Supabase:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اتصال Supabase:', error);
    return false;
  }
}

/**
 * تهيئة فحص متغيرات البيئة عند بدء التطبيق
 */
export function initializeEnvironmentValidation(): void {
  // فحص المتغيرات
  displayEnvironmentReport();
  
  // التحقق من اتصال Supabase في بيئة التطوير
  if (import.meta.env.DEV) {
    validateSupabaseConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('⚠️ تحقق من إعدادات Supabase في ملف .env');
      }
    });
  }

  // إظهار ملف .env مثال إذا كانت هناك متغيرات مفقودة
  const validation = validateEnvironmentVariables();
  if (validation.missing.length > 0) {
    console.group('📝 ملف .env مقترح للمتغيرات المفقودة');
    console.log(generateEnvExample(true));
    console.groupEnd();
  }
} 