import { vi } from 'vitest';

let mockReturnValue = { data: [], error: null };

export const configureMockReturn = (value: any) => {
  mockReturnValue = value;
};

export const mockSupabaseClient = {
  from: vi.fn(() => {
    const mockQuery: any = vi.fn().mockImplementation(() => Promise.resolve(mockReturnValue));
    
    mockQuery.select = vi.fn().mockReturnValue(mockQuery);
    mockQuery.insert = vi.fn().mockReturnValue(mockQuery);
    mockQuery.update = vi.fn().mockReturnValue(mockQuery);
    mockQuery.delete = vi.fn().mockReturnValue(mockQuery);
    mockQuery.eq = vi.fn().mockReturnValue(mockQuery);
    mockQuery.order = vi.fn().mockReturnValue(mockQuery);
    mockQuery.limit = vi.fn().mockReturnValue(mockQuery);
    mockQuery.range = vi.fn().mockReturnValue(mockQuery);
    mockQuery.or = vi.fn().mockReturnValue(mockQuery);
    mockQuery.ilike = vi.fn().mockReturnValue(mockQuery);
    mockQuery.single = vi.fn().mockImplementation(() => Promise.resolve(mockReturnValue));
    
    mockQuery.then = vi.fn((resolve) => Promise.resolve(mockReturnValue).then(resolve));
    mockQuery.catch = vi.fn((reject) => Promise.resolve(mockReturnValue).catch(reject));
    
    return mockQuery;
  }),
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
