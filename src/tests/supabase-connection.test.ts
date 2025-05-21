import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { supabase, testConnection, checkSupabaseHealth } from '../lib/supabase';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        count: vi.fn(),
        head: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        single: vi.fn()
      }))
    })),
    rpc: vi.fn()
  }))
}));

describe('Supabase Connection Tests', () => {
  it('should test connection', async () => {
    const result = await testConnection();
    expect(typeof result).toBe('boolean');
  });
  
  it('should check Supabase health', async () => {
    const result = await checkSupabaseHealth();
    expect(result).toHaveProperty('isHealthy');
    expect(result).toHaveProperty('timestamp');
  });
});
