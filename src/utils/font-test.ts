
import { configurePdfMakeFonts, checkFontAvailability } from './font-loader';

export function testFontLoading(): void {
  console.log('Testing font loading...');
  
  try {
    // Configure fonts
    configurePdfMakeFonts();
    
    // Check availability
    const isAvailable = checkFontAvailability();
    
    console.log('Font loading test result:', {
      available: isAvailable,
      timestamp: new Date().toISOString()
    });
    
    if (isAvailable) {
      console.log('✅ Fonts loaded successfully');
    } else {
      console.warn('⚠️ Font loading may have issues');
    }
  } catch (error) {
    console.error('❌ Font loading test failed:', error);
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  testFontLoading();
}
