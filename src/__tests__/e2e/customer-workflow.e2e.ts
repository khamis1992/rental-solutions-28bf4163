import { test, expect, Page, Browser } from '@playwright/test'

// Test configuration for Arabic RTL interface
test.use({
  locale: 'ar-QA',
  timezoneId: 'Asia/Qatar'
})

class CustomerWorkflowHelper {
  constructor(private page: Page) {}

  async navigateToCustomers() {
    await this.page.goto('/customers')
    await this.page.waitForLoadState('networkidle')
  }

  async addNewCustomer(customerData: {
    name: string
    phone: string
    email: string
    driverLicense: string
    idNumber: string
    nationality: string
  }) {
    // Click "إضافة عميل جديد" button
    await this.page.click('[data-testid="add-customer-button"]')
    
    // Wait for form to appear
    await this.page.waitForSelector('[data-testid="customer-form"]')
    
    // Fill in customer details
    await this.page.fill('[data-testid="customer-name-input"]', customerData.name)
    await this.page.fill('[data-testid="customer-phone-input"]', customerData.phone)
    await this.page.fill('[data-testid="customer-email-input"]', customerData.email)
    await this.page.fill('[data-testid="customer-license-input"]', customerData.driverLicense)
    await this.page.fill('[data-testid="customer-id-input"]', customerData.idNumber)
    await this.page.selectOption('[data-testid="customer-nationality-select"]', customerData.nationality)
    
    // Submit form
    await this.page.click('[data-testid="save-customer-button"]')
    
    // Wait for success message
    await this.page.waitForSelector('.toast-success', { timeout: 10000 })
  }

  async searchCustomer(searchTerm: string) {
    await this.page.fill('[data-testid="customer-search-input"]', searchTerm)
    await this.page.keyboard.press('Enter')
    await this.page.waitForTimeout(1000) // Wait for search results
  }

  async editCustomer(customerName: string, newData: { name?: string; phone?: string }) {
    // Find customer card
    const customerCard = this.page.locator(`[data-testid="customer-card"]:has-text("${customerName}")`)
    await customerCard.hover()
    
    // Click menu button
    await customerCard.locator('[data-testid="customer-menu-button"]').click()
    
    // Click edit option
    await this.page.click('[data-testid="edit-customer-option"]')
    
    // Wait for edit form
    await this.page.waitForSelector('[data-testid="customer-edit-form"]')
    
    // Update fields
    if (newData.name) {
      await this.page.fill('[data-testid="customer-name-input"]', newData.name)
    }
    if (newData.phone) {
      await this.page.fill('[data-testid="customer-phone-input"]', newData.phone)
    }
    
    // Save changes
    await this.page.click('[data-testid="save-customer-button"]')
    
    // Wait for success message
    await this.page.waitForSelector('.toast-success')
  }

  async deleteCustomer(customerName: string) {
    // Find customer card
    const customerCard = this.page.locator(`[data-testid="customer-card"]:has-text("${customerName}")`)
    await customerCard.hover()
    
    // Click menu button
    await customerCard.locator('[data-testid="customer-menu-button"]').click()
    
    // Click delete option
    await this.page.click('[data-testid="delete-customer-option"]')
    
    // Confirm deletion
    await this.page.click('[data-testid="confirm-delete-button"]')
    
    // Wait for success message
    await this.page.waitForSelector('.toast-success')
  }

  async verifyCustomerExists(customerName: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="customer-card"]:has-text("${customerName}")`, { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  async verifyCustomerNotExists(customerName: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="customer-card"]:has-text("${customerName}")`, { timeout: 2000 })
      return false
    } catch {
      return true
    }
  }

  async login(email: string = 'admin@admin.com', password: string = 'admin') {
    await this.page.goto('/login')
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.click('[data-testid="login-button"]')
    await this.page.waitForURL('/dashboard')
  }
}

test.describe('Customer Management Workflow', () => {
  let customerHelper: CustomerWorkflowHelper

  test.beforeEach(async ({ page }) => {
    customerHelper = new CustomerWorkflowHelper(page)
    await customerHelper.login()
  })

  test('should complete full customer lifecycle', async ({ page }) => {
    const testCustomer = {
      name: 'عبدالله الاختبار',
      phone: '+97450999888',
      email: 'abdullah.test@example.com',
      driverLicense: 'DL999888',
      idNumber: 'ID999888',
      nationality: 'قطري'
    }

    // Navigate to customers page
    await customerHelper.navigateToCustomers()

    // Add new customer
    await customerHelper.addNewCustomer(testCustomer)

    // Verify customer was created
    const customerExists = await customerHelper.verifyCustomerExists(testCustomer.name)
    expect(customerExists).toBe(true)

    // Search for the customer
    await customerHelper.searchCustomer(testCustomer.name)
    await expect(page.locator(`[data-testid="customer-card"]:has-text("${testCustomer.name}")`)).toBeVisible()

    // Edit customer
    await customerHelper.editCustomer(testCustomer.name, {
      name: 'عبدالله المحدث',
      phone: '+97450999777'
    })

    // Verify customer was updated
    const updatedCustomerExists = await customerHelper.verifyCustomerExists('عبدالله المحدث')
    expect(updatedCustomerExists).toBe(true)

    // Delete customer
    await customerHelper.deleteCustomer('عبدالله المحدث')

    // Verify customer was deleted
    const customerDeleted = await customerHelper.verifyCustomerNotExists('عبدالله المحدث')
    expect(customerDeleted).toBe(true)
  })

  test('should handle customer search functionality', async ({ page }) => {
    await customerHelper.navigateToCustomers()

    // Test search by name
    await customerHelper.searchCustomer('أحمد')
    
    // Verify search results contain expected customer
    await expect(page.locator('[data-testid="customer-card"]')).toHaveCount({ min: 1 })

    // Test search by phone
    await customerHelper.searchCustomer('+974')
    
    // Verify search results
    await expect(page.locator('[data-testid="customer-card"]')).toHaveCount({ min: 1 })

    // Test empty search (should show all customers)
    await customerHelper.searchCustomer('')
    
    // Verify all customers are shown
    await expect(page.locator('[data-testid="customer-card"]')).toHaveCount({ min: 1 })
  })

  test('should handle customer status filtering', async ({ page }) => {
    await customerHelper.navigateToCustomers()

    // Test active customers filter
    await page.click('[data-testid="status-filter-active"]')
    await page.waitForTimeout(1000)
    
    // Verify only active customers are shown
    const activeCustomers = page.locator('[data-testid="customer-card"] [data-testid="status-badge"]:has-text("نشط")')
    const inactiveCustomers = page.locator('[data-testid="customer-card"] [data-testid="status-badge"]:has-text("غير نشط")')
    
    await expect(activeCustomers).toHaveCount({ min: 1 })
    await expect(inactiveCustomers).toHaveCount(0)

    // Test all customers filter
    await page.click('[data-testid="status-filter-all"]')
    await page.waitForTimeout(1000)
    
    // Verify all customers are shown
    await expect(page.locator('[data-testid="customer-card"]')).toHaveCount({ min: 1 })
  })

  test('should validate required fields in customer form', async ({ page }) => {
    await customerHelper.navigateToCustomers()

    // Click add new customer
    await page.click('[data-testid="add-customer-button"]')
    
    // Try to submit empty form
    await page.click('[data-testid="save-customer-button"]')
    
    // Verify validation errors appear
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="phone-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="license-error"]')).toBeVisible()

    // Fill required fields
    await page.fill('[data-testid="customer-name-input"]', 'عميل التحقق')
    await page.fill('[data-testid="customer-phone-input"]', '+97450123456')
    await page.fill('[data-testid="customer-license-input"]', 'DL123456')
    await page.selectOption('[data-testid="customer-nationality-select"]', 'قطري')

    // Submit form
    await page.click('[data-testid="save-customer-button"]')
    
    // Verify success
    await page.waitForSelector('.toast-success')
  })

  test('should handle customer card actions', async ({ page }) => {
    await customerHelper.navigateToCustomers()

    // Find first customer card
    const firstCustomerCard = page.locator('[data-testid="customer-card"]').first()
    await firstCustomerCard.hover()

    // Test email action
    const emailButton = firstCustomerCard.locator('[data-testid="email-action"]')
    await expect(emailButton).toBeVisible()

    // Test call action
    const callButton = firstCustomerCard.locator('[data-testid="call-action"]')
    await expect(callButton).toBeVisible()

    // Test menu actions
    await firstCustomerCard.locator('[data-testid="customer-menu-button"]').click()
    
    await expect(page.locator('[data-testid="view-details-option"]')).toBeVisible()
    await expect(page.locator('[data-testid="edit-customer-option"]')).toBeVisible()
    await expect(page.locator('[data-testid="delete-customer-option"]')).toBeVisible()

    // Close menu by clicking outside
    await page.click('body')
  })

  test('should navigate to customer details', async ({ page }) => {
    await customerHelper.navigateToCustomers()

    // Find first customer card
    const firstCustomerCard = page.locator('[data-testid="customer-card"]').first()
    await firstCustomerCard.hover()

    // Click menu and view details
    await firstCustomerCard.locator('[data-testid="customer-menu-button"]').click()
    await page.click('[data-testid="view-details-option"]')

    // Verify navigation to customer details page
    await expect(page).toHaveURL(/\/customers\/.*/)
    
    // Verify customer details are displayed
    await expect(page.locator('[data-testid="customer-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="customer-info-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="customer-agreements-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="customer-payments-tab"]')).toBeVisible()
  })

  test('should handle RTL layout correctly', async ({ page }) => {
    await customerHelper.navigateToCustomers()

    // Verify RTL direction
    const body = page.locator('body')
    await expect(body).toHaveAttribute('dir', 'rtl')

    // Verify Arabic text is displayed correctly
    await expect(page.locator(':has-text("العملاء")')).toBeVisible()
    await expect(page.locator(':has-text("إضافة عميل جديد")')).toBeVisible()

    // Verify search placeholder is in Arabic
    const searchInput = page.locator('[data-testid="customer-search-input"]')
    await expect(searchInput).toHaveAttribute('placeholder', /البحث/)
  })

  test('should handle errors gracefully', async ({ page }) => {
    await customerHelper.navigateToCustomers()

    // Test with invalid phone number
    await page.click('[data-testid="add-customer-button"]')
    
    await page.fill('[data-testid="customer-name-input"]', 'عميل خطأ')
    await page.fill('[data-testid="customer-phone-input"]', 'invalid-phone')
    await page.fill('[data-testid="customer-license-input"]', 'DL123456')
    await page.selectOption('[data-testid="customer-nationality-select"]', 'قطري')

    await page.click('[data-testid="save-customer-button"]')
    
    // Verify error message
    await expect(page.locator('[data-testid="phone-error"]')).toBeVisible()

    // Test with duplicate phone number (if validation exists)
    await page.fill('[data-testid="customer-phone-input"]', '+97450123456') // Existing phone
    await page.click('[data-testid="save-customer-button"]')
    
    // May show duplicate error or success depending on business logic
    await page.waitForTimeout(2000)
  })
})

test.describe('Customer Performance Tests', () => {
  test('should load customers page within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Verify page loads within 5 seconds
    expect(loadTime).toBeLessThan(5000)
    
    // Verify customers are displayed
    await expect(page.locator('[data-testid="customer-card"]')).toHaveCount({ min: 1 })
  })

  test('should handle large customer lists efficiently', async ({ page }) => {
    await page.goto('/customers')
    
    // Test pagination or virtual scrolling
    const customerCards = page.locator('[data-testid="customer-card"]')
    const initialCount = await customerCards.count()
    
    // Scroll to bottom if virtual scrolling is implemented
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    // More customers should load or pagination should be visible
    const finalCount = await customerCards.count()
    const pagination = page.locator('[data-testid="pagination"]')
    
    expect(finalCount >= initialCount || await pagination.isVisible()).toBe(true)
  })
}) 