import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CustomerService } from './customer-service'
import { supabase } from '../integrations/supabase/client'

describe('CustomerService Integration Tests', () => {
  let customerService: CustomerService
  let createdCustomerIds: string[] = []

  beforeEach(() => {
    customerService = new CustomerService()
    createdCustomerIds = []
  })

  afterEach(async () => {
    // تنظيف البيانات المضافة أثناء الاختبارات
    for (const id of createdCustomerIds) {
      await supabase.from('profiles').delete().eq('id', id)
    }
  })

  describe('إنشاء عميل جديد', () => {
    it('يجب أن ينشئ عميل جديد بنجاح', async () => {
      const customerData = {
        name: 'أحمد محمد الاختبار',
        email: 'test@example.com',
        phone: '+974 5555 1234',
        nationality: 'قطري',
        id_number: '12345678901',
        driver_license: 'DL123456789',
        address: 'الدوحة، قطر'
      }

      const customer = await customerService.createCustomer(customerData)
      
      expect(customer).toBeDefined()
      expect(customer.id).toBeDefined()
      expect(customer.name).toBe(customerData.name)
      expect(customer.email).toBe(customerData.email)
      expect(customer.phone).toBe(customerData.phone)
      expect(customer.status).toBe('active')
      
      createdCustomerIds.push(customer.id)
    })

    it('يجب أن يفشل في إنشاء عميل بدون بيانات مطلوبة', async () => {
      const incompleteData = {
        name: 'عميل ناقص البيانات'
        // بدون email أو phone
      }

      await expect(customerService.createCustomer(incompleteData as any))
        .rejects.toThrow()
    })

    it('يجب أن يفشل في إنشاء عميل بنفس البريد الإلكتروني', async () => {
      const customerData = {
        name: 'العميل الأول',
        email: 'duplicate@example.com',
        phone: '+974 5555 1111',
        nationality: 'قطري',
        id_number: '11111111111',
        driver_license: 'DL111111111',
        address: 'الدوحة، قطر'
      }

      // إنشاء العميل الأول
      const firstCustomer = await customerService.createCustomer(customerData)
      createdCustomerIds.push(firstCustomer.id)

      // محاولة إنشاء عميل ثانٍ بنفس البريد الإلكتروني
      const duplicateData = {
        ...customerData,
        name: 'العميل الثاني',
        phone: '+974 5555 2222'
      }

      await expect(customerService.createCustomer(duplicateData))
        .rejects.toThrow()
    })
  })

  describe('جلب بيانات العميل', () => {
    it('يجب أن يجلب بيانات العميل بنجاح', async () => {
      // إنشاء عميل للاختبار
      const customerData = {
        name: 'عميل للجلب',
        email: 'fetch@example.com',
        phone: '+974 5555 3333',
        nationality: 'قطري',
        id_number: '33333333333',
        driver_license: 'DL333333333',
        address: 'الدوحة، قطر'
      }

      const createdCustomer = await customerService.createCustomer(customerData)
      createdCustomerIds.push(createdCustomer.id)

      // جلب بيانات العميل
      const fetchedCustomer = await customerService.getCustomerById(createdCustomer.id)
      
      expect(fetchedCustomer).toBeDefined()
      expect(fetchedCustomer.id).toBe(createdCustomer.id)
      expect(fetchedCustomer.name).toBe(customerData.name)
      expect(fetchedCustomer.email).toBe(customerData.email)
    })

    it('يجب أن يعيد null للعميل غير الموجود', async () => {
      const customer = await customerService.getCustomerById('non-existent-id')
      
      expect(customer).toBeNull()
    })
  })

  describe('تحديث بيانات العميل', () => {
    it('يجب أن يحدث بيانات العميل بنجاح', async () => {
      // إنشاء عميل للاختبار
      const customerData = {
        name: 'عميل للتحديث',
        email: 'update@example.com',
        phone: '+974 5555 4444',
        nationality: 'قطري',
        id_number: '44444444444',
        driver_license: 'DL444444444',
        address: 'الدوحة، قطر'
      }

      const createdCustomer = await customerService.createCustomer(customerData)
      createdCustomerIds.push(createdCustomer.id)

      // تحديث بيانات العميل
      const updatedData = {
        name: 'عميل محدث',
        phone: '+974 5555 5555'
      }

      const updatedCustomer = await customerService.updateCustomer(
        createdCustomer.id,
        updatedData
      )
      
      expect(updatedCustomer).toBeDefined()
      expect(updatedCustomer.name).toBe(updatedData.name)
      expect(updatedCustomer.phone).toBe(updatedData.phone)
      expect(updatedCustomer.email).toBe(customerData.email) // البريد الإلكتروني لم يتغير
    })

    it('يجب أن يفشل في تحديث عميل غير موجود', async () => {
      const updatedData = {
        name: 'عميل محدث'
      }

      await expect(customerService.updateCustomer('non-existent-id', updatedData))
        .rejects.toThrow()
    })
  })

  describe('البحث عن العملاء', () => {
    it('يجب أن يبحث عن العملاء بالاسم', async () => {
      // إنشاء عميل للاختبار
      const customerData = {
        name: 'عميل للبحث الخاص',
        email: 'search@example.com',
        phone: '+974 5555 6666',
        nationality: 'قطري',
        id_number: '66666666666',
        driver_license: 'DL666666666',
        address: 'الدوحة، قطر'
      }

      const createdCustomer = await customerService.createCustomer(customerData)
      createdCustomerIds.push(createdCustomer.id)

      // البحث عن العميل
      const searchResults = await customerService.searchCustomers('عميل للبحث الخاص')
      
      expect(searchResults).toBeDefined()
      expect(searchResults.length).toBeGreaterThan(0)
      expect(searchResults[0].name).toContain('عميل للبحث الخاص')
    })

    it('يجب أن يعيد نتائج فارغة للبحث غير المطابق', async () => {
      const searchResults = await customerService.searchCustomers('عميل غير موجود نهائياً')
      
      expect(searchResults).toBeDefined()
      expect(searchResults.length).toBe(0)
    })
  })
}) 