import { vi } from 'vitest'

// Mock data
export const mockCustomers = [
  {
    id: '1',
    full_name: 'أحمد محمد',
    phone: '+97450123456',
    email: 'ahmed@example.com',
    driver_license: 'DL123456',
    id_number: 'ID123456',
    nationality: 'قطري',
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    full_name: 'فاطمة علي',
    phone: '+97450123457',
    email: 'fatima@example.com',
    driver_license: 'DL123457',
    id_number: 'ID123457',
    nationality: 'قطرية',
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const mockVehicles = [
  {
    id: '1',
    license_plate: 'ABC123',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    color: 'أبيض',
    status: 'متاحة',
    mileage: 15000,
    vin: 'VIN123456789'
  },
  {
    id: '2',
    license_plate: 'XYZ789',
    make: 'Honda',
    model: 'Civic',
    year: 2022,
    color: 'أزرق',
    status: 'مؤجرة',
    mileage: 25000,
    vin: 'VIN987654321'
  }
]

export const mockAgreements = [
  {
    id: '1',
    customer_id: '1',
    vehicle_id: '1',
    agreement_number: 'AGR001',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    monthly_payment: 1500,
    security_deposit: 3000,
    status: 'نشط'
  }
]

export const mockPayments = [
  {
    id: '1',
    lease_id: '1',
    amount: 1500,
    due_date: '2024-01-01',
    payment_date: '2024-01-01',
    status: 'مدفوعة',
    payment_method: 'نقدي'
  }
]

// Supabase client mock
export const createSupabaseMock = () => {
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null
      })),
      neq: vi.fn(() => ({
        data: [],
        error: null
      })),
      gt: vi.fn(() => ({
        data: [],
        error: null
      })),
      lt: vi.fn(() => ({
        data: [],
        error: null
      })),
      order: vi.fn(() => ({
        data: [],
        error: null
      })),
      limit: vi.fn(() => ({
        data: [],
        error: null
      })),
      single: vi.fn(() => ({
        data: null,
        error: null
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null
      }))
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))

  return {
    from,
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' }, session: {} },
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({
          data: { path: 'test-path' },
          error: null
        })),
        download: vi.fn(() => Promise.resolve({
          data: new Blob(),
          error: null
        })),
        remove: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }
  }
}

// Mock specific queries
export const mockSupabaseQueries = {
  customers: {
    getAll: () => Promise.resolve({ data: mockCustomers, error: null }),
    getById: (id: string) => Promise.resolve({ 
      data: mockCustomers.find(c => c.id === id) || null, 
      error: null 
    }),
    create: (customer: any) => Promise.resolve({ 
      data: { ...customer, id: 'new-id' }, 
      error: null 
    }),
    update: (id: string, updates: any) => Promise.resolve({ 
      data: { ...mockCustomers.find(c => c.id === id), ...updates }, 
      error: null 
    }),
    delete: (id: string) => Promise.resolve({ data: null, error: null })
  },
  vehicles: {
    getAll: () => Promise.resolve({ data: mockVehicles, error: null }),
    getById: (id: string) => Promise.resolve({ 
      data: mockVehicles.find(v => v.id === id) || null, 
      error: null 
    }),
    create: (vehicle: any) => Promise.resolve({ 
      data: { ...vehicle, id: 'new-id' }, 
      error: null 
    }),
    update: (id: string, updates: any) => Promise.resolve({ 
      data: { ...mockVehicles.find(v => v.id === id), ...updates }, 
      error: null 
    }),
    delete: (id: string) => Promise.resolve({ data: null, error: null })
  },
  agreements: {
    getAll: () => Promise.resolve({ data: mockAgreements, error: null }),
    getById: (id: string) => Promise.resolve({ 
      data: mockAgreements.find(a => a.id === id) || null, 
      error: null 
    }),
    create: (agreement: any) => Promise.resolve({ 
      data: { ...agreement, id: 'new-id' }, 
      error: null 
    }),
    update: (id: string, updates: any) => Promise.resolve({ 
      data: { ...mockAgreements.find(a => a.id === id), ...updates }, 
      error: null 
    }),
    delete: (id: string) => Promise.resolve({ data: null, error: null })
  },
  payments: {
    getAll: () => Promise.resolve({ data: mockPayments, error: null }),
    getById: (id: string) => Promise.resolve({ 
      data: mockPayments.find(p => p.id === id) || null, 
      error: null 
    }),
    create: (payment: any) => Promise.resolve({ 
      data: { ...payment, id: 'new-id' }, 
      error: null 
    }),
    update: (id: string, updates: any) => Promise.resolve({ 
      data: { ...mockPayments.find(p => p.id === id), ...updates }, 
      error: null 
    }),
    delete: (id: string) => Promise.resolve({ data: null, error: null })
  }
} 