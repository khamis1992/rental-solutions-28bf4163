// Environment Variables Diagnostic Test
import { validateEnvironmentVariables, displayEnvironmentReport, initializeEnvironmentValidation } from './utils/env-validator';
import { initializeProductionDetection } from './utils/production-env-detector';

console.log('🔍 ENVIRONMENT VARIABLES DIAGNOSTIC TEST');
console.log('=====================================');

// تهيئة نظام فحص البيئة الشامل
initializeEnvironmentValidation();
initializeProductionDetection();

// الفحص الأساسي القديم للمقارنة
console.group('🧪 الفحص الأساسي');
console.log('Environment:', typeof window !== 'undefined' ? 'Browser' : 'Server');
console.log('All import.meta.env keys:', Object.keys(import.meta.env));

// Check specific Supabase variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'undefined');

// Check if variables are properly loaded
if (supabaseUrl && supabaseKey) {
  console.log('✅ Environment variables loaded successfully!');
} else {
  console.error('❌ Environment variables missing!');
  console.error('URL present:', !!supabaseUrl);
  console.error('Key present:', !!supabaseKey);
}
console.groupEnd(); 