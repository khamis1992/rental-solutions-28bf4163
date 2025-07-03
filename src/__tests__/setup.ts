/**
 * ملف إعداد شامل لاختبارات Vitest
 * يتضمن جميع الإعدادات المطلوبة للاختبارات المتطورة
 */

import '@testing-library/jest-dom/vitest';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// تنظيف React Testing Library بعد كل اختبار
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch globally
global.fetch = vi.fn();

// Mock URL.createObjectURL
window.URL.createObjectURL = vi.fn();

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Custom matchers للاختبارات العربية
expect.extend({
  toBeValidArabicText(received: string) {
    const arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d\u060C\u061B\u061F\u0640]+$/;
    const pass = arabicRegex.test(received);
    
    if (pass) {
      return {
        message: () => `Expected "${received}" not to be valid Arabic text`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected "${received}" to be valid Arabic text`,
        pass: false,
      };
    }
  },
  
  toHaveRTLDirection(received: HTMLElement) {
    const direction = received.style.direction || received.getAttribute('dir');
    const pass = direction === 'rtl';
    
    if (pass) {
      return {
        message: () => `Expected element not to have RTL direction`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to have RTL direction`,
        pass: false,
      };
    }
  }
});

// Global test helpers
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
  })),
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
    })),
  },
};

// Mock data generators
export const createMockCustomer = (overrides = {}) => ({
  id: 'test-customer-id',
  full_name: 'عميل تجريبي',
  phone: '+97450000000',
  email: 'test@example.com',
  driver_license: 'DL123456',
  nationality: 'قطري',
  status: 'active' as const,
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockVehicle = (overrides = {}) => ({
  id: 'test-vehicle-id',
  plate_number: 'ABC123',
  model: 'تويوتا كامري',
  year: 2023,
  color: 'أبيض',
  status: 'متاح',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockAgreement = (overrides = {}) => ({
  id: 'test-agreement-id',
  customer_id: 'test-customer-id',
  vehicle_id: 'test-vehicle-id',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  monthly_amount: 1500,
  status: 'نشط',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockPayment = (overrides = {}) => ({
  id: 'test-payment-id',
  agreement_id: 'test-agreement-id',
  amount: 1500,
  due_date: new Date().toISOString(),
  status: 'مدفوع',
  payment_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  ...overrides
});

console.log('🧪 Test setup completed - Ready for comprehensive testing!'); 