import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerService } from '@/services/CustomerService'
import { mockCustomers, createSupabaseMock } from '../mocks/supabase'

// Mock Supabase
const mockSupabase = createSupabaseMock()

vi.mock('@/integrations/supabase', () => ({
  supabase: mockSupabase
}))

describe('CustomerService', () => {
  let customerService: CustomerService

  beforeEach(() => {
    vi.clearAllMocks()
    customerService = new CustomerService()
  })

  describe('getAllCustomers', () => {
    it('should fetch all customers successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockCustomers,
          error: null
        })
      })

      const result = await customerService.getAllCustomers()

      expect(result.data).toEqual(mockCustomers)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should handle errors when fetching customers', async () => {
      const mockError = { message: 'Database error' }
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      })

      const result = await customerService.getAllCustomers()

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('getCustomerById', () => {
    it('should fetch customer by id successfully', async () => {
      const customerId = '1'
      const expectedCustomer = mockCustomers[0]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: expectedCustomer,
              error: null
            })
          })
        })
      })

      const result = await customerService.getCustomerById(customerId)

      expect(result.data).toEqual(expectedCustomer)
      expect(result.error).toBeNull()
    })

    it('should handle customer not found', async () => {
      const customerId = 'non-existent'

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Customer not found' }
            })
          })
        })
      })

      const result = await customerService.getCustomerById(customerId)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      const newCustomer = {
        full_name: 'عميل جديد',
        phone: '+97450123458',
        email: 'new@example.com',
        driver_license: 'DL123458',
        id_number: 'ID123458',
        nationality: 'قطري',
        status: 'active' as const
      }

      const createdCustomer = { ...newCustomer, id: 'new-id' }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdCustomer,
              error: null
            })
          })
        })
      })

      const result = await customerService.createCustomer(newCustomer)

      expect(result.data).toEqual(createdCustomer)
      expect(result.error).toBeNull()
    })

    it('should handle validation errors when creating customer', async () => {
      const invalidCustomer = {
        full_name: '',
        phone: 'invalid-phone',
        driver_license: '',
        nationality: '',
        status: 'active' as const
      }

      const validationError = { message: 'Invalid customer data' }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: validationError
            })
          })
        })
      })

      const result = await customerService.createCustomer(invalidCustomer)

      expect(result.data).toBeNull()
      expect(result.error).toEqual(validationError)
    })
  })

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const customerId = '1'
      const updates = {
        full_name: 'اسم محدث',
        phone: '+97450123459'
      }

      const updatedCustomer = { ...mockCustomers[0], ...updates }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedCustomer,
                error: null
              })
            })
          })
        })
      })

      const result = await customerService.updateCustomer(customerId, updates)

      expect(result.data).toEqual(updatedCustomer)
      expect(result.error).toBeNull()
    })

    it('should handle errors when updating customer', async () => {
      const customerId = 'non-existent'
      const updates = { full_name: 'اسم محدث' }
      const updateError = { message: 'Customer not found for update' }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: updateError
              })
            })
          })
        })
      })

      const result = await customerService.updateCustomer(customerId, updates)

      expect(result.data).toBeNull()
      expect(result.error).toEqual(updateError)
    })
  })

  describe('deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      const customerId = '1'

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await customerService.deleteCustomer(customerId)

      expect(result.error).toBeNull()
    })

    it('should handle errors when deleting customer', async () => {
      const customerId = '1'
      const deleteError = { message: 'Cannot delete customer with active contracts' }

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: deleteError
          })
        })
      })

      const result = await customerService.deleteCustomer(customerId)

      expect(result.error).toEqual(deleteError)
    })
  })

  describe('searchCustomers', () => {
    it('should search customers by name', async () => {
      const searchTerm = 'أحمد'
      const filteredCustomers = mockCustomers.filter(c => 
        c.full_name.includes(searchTerm)
      )

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: filteredCustomers,
            error: null
          })
        })
      })

      const result = await customerService.searchCustomers(searchTerm)

      expect(result.data).toEqual(filteredCustomers)
      expect(result.error).toBeNull()
    })

    it('should search customers by phone', async () => {
      const searchTerm = '+974501'
      const filteredCustomers = mockCustomers.filter(c => 
        c.phone.includes(searchTerm)
      )

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: filteredCustomers,
            error: null
          })
        })
      })

      const result = await customerService.searchCustomers(searchTerm)

      expect(result.data).toEqual(filteredCustomers)
      expect(result.error).toBeNull()
    })

    it('should return empty array when no customers match search', async () => {
      const searchTerm = 'غير موجود'

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const result = await customerService.searchCustomers(searchTerm)

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('getCustomerStatistics', () => {
    it('should calculate customer statistics correctly', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockCustomers,
          error: null
        })
      })

      const stats = await customerService.getCustomerStatistics()

      expect(stats.total).toBe(mockCustomers.length)
      expect(stats.active).toBe(mockCustomers.filter(c => c.status === 'active').length)
      expect(stats.inactive).toBe(mockCustomers.filter(c => c.status === 'inactive').length)
      expect(stats.pending_review).toBe(mockCustomers.filter(c => c.status === 'pending_review').length)
    })

    it('should handle errors when calculating statistics', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      const stats = await customerService.getCustomerStatistics()

      expect(stats.total).toBe(0)
      expect(stats.active).toBe(0)
      expect(stats.inactive).toBe(0)
      expect(stats.pending_review).toBe(0)
    })
  })
})

// Integration test class for CustomerService
class CustomerServiceTest {
  private service: CustomerService

  constructor() {
    this.service = new CustomerService()
  }

  async runAllTests() {
    console.log('🧪 بدء اختبارات خدمة العملاء...')
    
    try {
      await this.testCustomerLifecycle()
      await this.testSearchFunctionality()
      await this.testErrorHandling()
      
      console.log('✅ جميع اختبارات خدمة العملاء نجحت!')
    } catch (error) {
      console.error('❌ فشل في اختبارات خدمة العملاء:', error)
      throw error
    }
  }

  private async testCustomerLifecycle() {
    console.log('📝 اختبار دورة حياة العميل...')
    
    // إنشاء عميل جديد
    const newCustomer = {
      full_name: 'عميل تجريبي',
      phone: '+97450000000',
      email: 'test@example.com',
      driver_license: 'DL000000',
      id_number: 'ID000000',
      nationality: 'قطري',
      status: 'active' as const
    }

    // محاولة إنشاء العميل
    const createResult = await this.service.createCustomer(newCustomer)
    if (createResult.error) {
      throw new Error(`فشل في إنشاء العميل: ${createResult.error.message}`)
    }

    const customerId = createResult.data?.id
    if (!customerId) {
      throw new Error('لم يتم إرجاع ID للعميل الجديد')
    }

    // تحديث العميل
    const updateResult = await this.service.updateCustomer(customerId, {
      full_name: 'عميل محدث'
    })
    
    if (updateResult.error) {
      throw new Error(`فشل في تحديث العميل: ${updateResult.error.message}`)
    }

    // حذف العميل
    const deleteResult = await this.service.deleteCustomer(customerId)
    if (deleteResult.error) {
      throw new Error(`فشل في حذف العميل: ${deleteResult.error.message}`)
    }

    console.log('✅ اختبار دورة حياة العميل نجح')
  }

  private async testSearchFunctionality() {
    console.log('🔍 اختبار وظائف البحث...')
    
    // البحث بالاسم
    const nameSearchResult = await this.service.searchCustomers('أحمد')
    if (nameSearchResult.error) {
      throw new Error(`فشل في البحث بالاسم: ${nameSearchResult.error.message}`)
    }

    // البحث بالهاتف
    const phoneSearchResult = await this.service.searchCustomers('+974')
    if (phoneSearchResult.error) {
      throw new Error(`فشل في البحث بالهاتف: ${phoneSearchResult.error.message}`)
    }

    console.log('✅ اختبار وظائف البحث نجح')
  }

  private async testErrorHandling() {
    console.log('⚠️ اختبار معالجة الأخطاء...')
    
    // محاولة جلب عميل غير موجود
    const nonExistentResult = await this.service.getCustomerById('non-existent-id')
    if (!nonExistentResult.error) {
      console.warn('⚠️ لم يتم إرجاع خطأ للعميل غير الموجود (قد يكون طبيعياً)')
    }

    // محاولة إنشاء عميل ببيانات غير صالحة
    const invalidCustomer = {
      full_name: '',
      phone: 'invalid',
      driver_license: '',
      nationality: '',
      status: 'active' as const
    }

    const invalidResult = await this.service.createCustomer(invalidCustomer)
    if (!invalidResult.error) {
      console.warn('⚠️ لم يتم إرجاع خطأ للبيانات غير الصالحة')
    }

    console.log('✅ اختبار معالجة الأخطاء مكتمل')
  }
} 