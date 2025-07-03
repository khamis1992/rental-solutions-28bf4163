import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { CustomerCard } from '@/components/customers/CustomerCard'
import { mockCustomers } from '../mocks/supabase'

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock supabase
vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}))

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('CustomerCard', () => {
  const mockCustomer = mockCustomers[0]
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders customer information correctly', () => {
    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={mockCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText(mockCustomer.full_name)).toBeInTheDocument()
    expect(screen.getByText(mockCustomer.phone)).toBeInTheDocument()
    expect(screen.getByText(mockCustomer.driver_license)).toBeInTheDocument()
    expect(screen.getByText(mockCustomer.nationality)).toBeInTheDocument()
  })

  it('displays customer status badge correctly', () => {
    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={mockCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    const statusBadge = screen.getByText('نشط')
    expect(statusBadge).toBeInTheDocument()
  })

  it('handles email action click', async () => {
    const mockOpen = vi.fn()
    Object.defineProperty(window, 'open', { 
      value: mockOpen,
      writable: true 
    })

    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={mockCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    const emailButton = screen.getByText('إيميل')
    fireEvent.click(emailButton)

    expect(mockOpen).toHaveBeenCalledWith(`mailto:${mockCustomer.email}`, '_blank')
  })

  it('handles phone call action click', async () => {
    const mockOpen = vi.fn()
    Object.defineProperty(window, 'open', { 
      value: mockOpen,
      writable: true 
    })

    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={mockCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    const phoneButton = screen.getByText('اتصال')
    fireEvent.click(phoneButton)

    expect(mockOpen).toHaveBeenCalledWith(`tel:${mockCustomer.phone}`, '_blank')
  })

  it('opens dropdown menu on menu button click', async () => {
    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={mockCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    // البحث عن زر القائمة باستخدام aria-haspopup
    const allButtons = screen.getAllByRole('button')
    const menuButton = allButtons.find(button => 
      button.getAttribute('aria-haspopup') === 'menu'
    )
    
    expect(menuButton).toBeDefined()
    fireEvent.click(menuButton!)

    // انتظار طويل لظهور عناصر القائمة
    await waitFor(() => {
      expect(screen.getByText('عرض التفاصيل')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText('تعديل العميل')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText('حذف العميل')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('calls onEdit when edit is clicked', async () => {
    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={mockCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    // البحث عن زر القائمة باستخدام aria-haspopup
    const allButtons = screen.getAllByRole('button')
    const menuButton = allButtons.find(button => 
      button.getAttribute('aria-haspopup') === 'menu'
    )
    
    expect(menuButton).toBeDefined()
    fireEvent.click(menuButton!)

    // انتظار ظهور عنصر التعديل
    const editButton = await screen.findByText('تعديل العميل', {}, { timeout: 3000 })
    fireEvent.click(editButton)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomer)
  })

  it('calls onDelete when delete is clicked', async () => {
    // Mock window.confirm
    const mockConfirm = vi.fn().mockReturnValue(true)
    Object.defineProperty(window, 'confirm', { 
      value: mockConfirm,
      writable: true 
    })

    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={mockCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    // البحث عن زر القائمة باستخدام aria-haspopup
    const allButtons = screen.getAllByRole('button')
    const menuButton = allButtons.find(button => 
      button.getAttribute('aria-haspopup') === 'menu'
    )
    
    expect(menuButton).toBeDefined()
    fireEvent.click(menuButton!)

    // انتظار ظهور عنصر الحذف
    const deleteButton = await screen.findByText('حذف العميل', {}, { timeout: 3000 })
    fireEvent.click(deleteButton)
    
    expect(mockConfirm).toHaveBeenCalledWith(`هل أنت متأكد من حذف ${mockCustomer.full_name}؟`)
    expect(mockOnDelete).toHaveBeenCalledWith(mockCustomer.id)
  })

  it('handles customer with missing optional fields', () => {
    const customerWithMissingFields = {
      ...mockCustomer,
      email: undefined,
      nationality: 'غير محددة'
    }

    const Wrapper = createTestWrapper()
    
    render(
      <CustomerCard
        customer={customerWithMissingFields}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText(customerWithMissingFields.full_name)).toBeInTheDocument()
    expect(screen.getByText(customerWithMissingFields.phone)).toBeInTheDocument()
  })

  it('applies correct status styling', () => {
    const activeCustomer = { ...mockCustomer, status: 'active' as const }
    const inactiveCustomer = { ...mockCustomer, status: 'inactive' as const }

    const Wrapper = createTestWrapper()
    
    const { rerender } = render(
      <CustomerCard
        customer={activeCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { wrapper: Wrapper }
    )

    const activeStatusBadge = screen.getByText('نشط')
    expect(activeStatusBadge).toBeInTheDocument()

    rerender(
      <CustomerCard
        customer={inactiveCustomer}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    )

    const inactiveStatusBadge = screen.getByText('غير نشط')
    expect(inactiveStatusBadge).toBeInTheDocument()
  })

  it('renders without errors when required props are provided', () => {
    const Wrapper = createTestWrapper()
    
    expect(() => {
      render(
        <CustomerCard
          customer={mockCustomer}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
        { wrapper: Wrapper }
      )
    }).not.toThrow()
  })
}) 