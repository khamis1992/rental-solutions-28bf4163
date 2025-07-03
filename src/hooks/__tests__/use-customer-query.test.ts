import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockCustomer, mockSupabaseClient } from '@/__tests__/setup';
import React from 'react';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCustomerQuery Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch customers successfully', async () => {
    const mockCustomers = [
      createMockCustomer(),
      createMockCustomer({ id: 'test-customer-2', full_name: 'عميل آخر' })
    ];

    mockSupabaseClient.from().select().eq().order().then.mockResolvedValue({
      data: mockCustomers,
      error: null
    });

    // Dynamic import to avoid module loading issues
    const { useCustomerQuery } = await import('@/hooks/customers/use-customer-query');
    
    const { result } = renderHook(() => useCustomerQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCustomers);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Database connection failed');
    
    mockSupabaseClient.from().select().eq().order().then.mockRejectedValue(mockError);

    const { useCustomerQuery } = await import('@/hooks/customers/use-customer-query');
    
    const { result } = renderHook(() => useCustomerQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should be loading initially', async () => {
    // Mock a slow response
    mockSupabaseClient.from().select().eq().order().then.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: [], error: null }), 1000))
    );

    const { useCustomerQuery } = await import('@/hooks/customers/use-customer-query');
    
    const { result } = renderHook(() => useCustomerQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should refetch data when refetch is called', async () => {
    const mockCustomers = [createMockCustomer()];
    
    mockSupabaseClient.from().select().eq().order().then.mockResolvedValue({
      data: mockCustomers,
      error: null
    });

    const { useCustomerQuery } = await import('@/hooks/customers/use-customer-query');
    
    const { result } = renderHook(() => useCustomerQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Clear previous calls
    vi.clearAllMocks();
    
    // Call refetch
    result.current.refetch();

    // Should trigger another API call
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });
  });
}); 