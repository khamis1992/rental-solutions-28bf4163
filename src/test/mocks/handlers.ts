import { http, HttpResponse } from 'msw'

// Mock data
const mockCustomers = [
  {
    id: '1',
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '+974 5555 1234',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: 'فاطمة علي',
    email: 'fatima@example.com',
    phone: '+974 5555 5678',
    status: 'active',
    created_at: '2024-01-02T00:00:00.000Z'
  }
]

const mockVehicles = [
  {
    id: '1',
    license_plate: 'A 12345',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    status: 'available',
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    license_plate: 'B 67890',
    make: 'Honda',
    model: 'Civic',
    year: 2022,
    status: 'rented',
    created_at: '2024-01-02T00:00:00.000Z'
  }
]

const mockAgreements = [
  {
    id: '1',
    customer_id: '1',
    vehicle_id: '1',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    monthly_amount: 2000,
    total_amount: 24000,
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z'
  }
]

const mockPayments = [
  {
    id: '1',
    lease_id: '1',
    amount: 2000,
    due_date: '2024-01-01',
    paid_date: '2024-01-01',
    status: 'paid',
    created_at: '2024-01-01T00:00:00.000Z'
  }
]

export const handlers = [
  // Health check
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  }),

  // Customers API
  http.get('/api/customers', () => {
    return HttpResponse.json(mockCustomers)
  }),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = mockCustomers.find(c => c.id === params.id)
    if (!customer) {
      return HttpResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return HttpResponse.json(customer)
  }),

  http.post('/api/customers', async ({ request }) => {
    const newCustomer = await request.json() as any
    const customer = {
      id: String(mockCustomers.length + 1),
      ...newCustomer,
      created_at: new Date().toISOString()
    }
    mockCustomers.push(customer)
    return HttpResponse.json(customer, { status: 201 })
  }),

  // Vehicles API
  http.get('/api/vehicles', () => {
    return HttpResponse.json(mockVehicles)
  }),

  http.get('/api/vehicles/:id', ({ params }) => {
    const vehicle = mockVehicles.find(v => v.id === params.id)
    if (!vehicle) {
      return HttpResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }
    return HttpResponse.json(vehicle)
  }),

  // Agreements API
  http.get('/api/agreements', () => {
    return HttpResponse.json(mockAgreements)
  }),

  http.get('/api/agreements/:id', ({ params }) => {
    const agreement = mockAgreements.find(a => a.id === params.id)
    if (!agreement) {
      return HttpResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }
    return HttpResponse.json(agreement)
  }),

  // Payments API
  http.get('/api/payments', () => {
    return HttpResponse.json(mockPayments)
  }),

  // Supabase Auth API
  http.post('http://localhost:54321/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        role: 'admin'
      }
    })
  }),

  // Supabase REST API
  http.get('http://localhost:54321/rest/v1/profiles', () => {
    return HttpResponse.json(mockCustomers)
  }),

  http.get('http://localhost:54321/rest/v1/vehicles', () => {
    return HttpResponse.json(mockVehicles)
  }),

  http.get('http://localhost:54321/rest/v1/leases', () => {
    return HttpResponse.json(mockAgreements)
  }),

  http.get('http://localhost:54321/rest/v1/payments', () => {
    return HttpResponse.json(mockPayments)
  })
] 