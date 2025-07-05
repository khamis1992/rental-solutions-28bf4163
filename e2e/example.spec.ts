import { test, expect } from '@playwright/test'

test.describe('نظام إيجار السيارات - الاختبارات الأساسية', () => {
  test.beforeEach(async ({ page }) => {
    // الانتقال إلى الصفحة الرئيسية
    await page.goto('/')
  })

  test('يجب أن تظهر صفحة تسجيل الدخول @smoke', async ({ page }) => {
    // فحص وجود عنوان الصفحة
    await expect(page).toHaveTitle(/العراف لتأجير السيارات/)
    
    // فحص وجود نموذج تسجيل الدخول
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('يجب أن يعمل تسجيل الدخول بشكل صحيح', async ({ page }) => {
    // إدخال بيانات تسجيل الدخول
    await page.fill('input[type="email"]', 'admin@admin.com')
    await page.fill('input[type="password"]', 'password123')
    
    // النقر على زر تسجيل الدخول
    await page.click('button[type="submit"]')
    
    // فحص الانتقال إلى لوحة التحكم
    await expect(page).toHaveURL(/\/dashboard/)
    
    // فحص وجود عناصر لوحة التحكم
    await expect(page.locator('h1')).toContainText('لوحة التحكم')
  })

  test('يجب أن تعمل الملاحة بين الصفحات', async ({ page }) => {
    // تسجيل الدخول أولاً
    await page.fill('input[type="email"]', 'admin@admin.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // الانتظار حتى تحميل لوحة التحكم
    await page.waitForURL('**/dashboard')
    
    // فحص التنقل إلى صفحة العملاء
    await page.click('a[href="/customers"]')
    await expect(page).toHaveURL(/\/customers/)
    
    // فحص التنقل إلى صفحة المركبات
    await page.click('a[href="/vehicles"]')
    await expect(page).toHaveURL(/\/vehicles/)
    
    // فحص التنقل إلى صفحة العقود
    await page.click('a[href="/agreements"]')
    await expect(page).toHaveURL(/\/agreements/)
  })
})

test.describe('اختبارات إدارة العملاء', () => {
  test.beforeEach(async ({ page }) => {
    // تسجيل الدخول والانتقال إلى صفحة العملاء
    await page.goto('/')
    await page.fill('input[type="email"]', 'admin@admin.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    await page.goto('/customers')
  })

  test('يجب أن تعرض قائمة العملاء', async ({ page }) => {
    // فحص وجود عنوان الصفحة
    await expect(page.locator('h1')).toContainText('العملاء')
    
    // فحص وجود جدول العملاء أو قائمة العملاء
    await expect(page.locator('[data-testid="customers-list"]')).toBeVisible()
  })

  test('يجب أن يعمل البحث عن العملاء', async ({ page }) => {
    // البحث عن عميل
    const searchInput = page.locator('input[placeholder*="البحث"]')
    await searchInput.fill('أحمد')
    
    // فحص تحديث النتائج
    await expect(page.locator('[data-testid="customers-list"]')).toBeVisible()
  })
})

test.describe('اختبارات الأداء @production', () => {
  test('يجب أن تحمل الصفحة الرئيسية في وقت معقول', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // يجب أن تحمل الصفحة في أقل من 3 ثوانٍ
    expect(loadTime).toBeLessThan(3000)
  })

  test('يجب أن تكون الصفحة responsive', async ({ page }) => {
    // فحص على الشاشات الصغيرة
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // فحص أن العناصر ظاهرة ومرتبة بشكل صحيح
    await expect(page.locator('body')).toBeVisible()
    
    // فحص على الشاشات الكبيرة
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    await expect(page.locator('body')).toBeVisible()
  })
}) 