// Environment Variables Diagnostic Test
console.log('🔍 ENVIRONMENT VARIABLES DIAGNOSTIC TEST');
console.log('=====================================');

// Check if running in browser
console.log('Environment:', typeof window !== 'undefined' ? 'Browser' : 'Server');

// Log all available environment variables
console.log('All import.meta.env keys:', Object.keys(import.meta.env));
console.log('All import.meta.env values:', import.meta.env);

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