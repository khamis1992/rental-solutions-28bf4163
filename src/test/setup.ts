import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// إعداد MSW للـ API mocking
export const server = setupServer(...handlers)

// بدء server قبل جميع الاختبارات
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// تنظيف DOM بعد كل اختبار
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// إيقاف server بعد جميع الاختبارات
afterAll(() => {
  server.close()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'http://localhost:54321'
process.env.VITE_SUPABASE_ANON_KEY = 'test-key'
process.env.VITE_GOOGLE_VISION_API_KEY = 'test-vision-key'
process.env.VITE_OPENAI_API_KEY = 'test-openai-key' 