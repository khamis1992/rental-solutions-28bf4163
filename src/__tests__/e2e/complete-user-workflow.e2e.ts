import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    await page.fill('[data-testid="email-input"]', 'admin@rental-solutions.qa');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete customer onboarding to payment workflow', async ({ page }) => {
    await page.click('[data-testid="customers-nav"]');
    await expect(page).toHaveURL('/customers');

    await page.click('[data-testid="add-customer-button"]');
    
    await page.fill('[data-testid="customer-name"]', 'أحمد محمد الكعبي');
    await page.fill('[data-testid="customer-phone"]', '+97450123456');
    await page.fill('[data-testid="customer-email"]', 'ahmed@example.com');
    await page.fill('[data-testid="customer-license"]', 'DL123456789');
    await page.selectOption('[data-testid="customer-nationality"]', 'قطري');
    
    await page.click('[data-testid="save-customer-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await page.click('[data-testid="vehicles-nav"]');
    await page.click('[data-testid="add-vehicle-button"]');
    
    await page.fill('[data-testid="vehicle-plate"]', 'ABC123');
    await page.fill('[data-testid="vehicle-model"]', 'تويوتا كامري');
    await page.fill('[data-testid="vehicle-year"]', '2023');
    await page.fill('[data-testid="vehicle-color"]', 'أبيض');
    
    await page.click('[data-testid="save-vehicle-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await page.click('[data-testid="agreements-nav"]');
    await page.click('[data-testid="add-agreement-button"]');
    
    await page.click('[data-testid="customer-selector"]');
    await page.click('[data-testid="customer-option"]:has-text("أحمد محمد الكعبي")');
    
    await page.click('[data-testid="vehicle-selector"]');
    await page.click('[data-testid="vehicle-option"]:has-text("ABC123")');
    
    await page.fill('[data-testid="monthly-amount"]', '1500');
    await page.fill('[data-testid="start-date"]', '2024-01-01');
    await page.fill('[data-testid="end-date"]', '2024-12-31');
    
    await page.click('[data-testid="save-agreement-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await page.click('[data-testid="add-payment-button"]');
    
    await page.fill('[data-testid="payment-amount"]', '1500');
    await page.fill('[data-testid="payment-date"]', '2024-01-01');
    await page.selectOption('[data-testid="payment-method"]', 'نقدي');
    
    await page.click('[data-testid="save-payment-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-history"]')).toContainText('1500');
  });

  test('should handle Arabic RTL interface correctly', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    const navigation = page.locator('[data-testid="main-navigation"]');
    await expect(navigation).toHaveCSS('direction', 'rtl');
    
    await page.click('[data-testid="customers-nav"]');
    
    const customerTable = page.locator('[data-testid="customers-table"]');
    await expect(customerTable).toHaveCSS('direction', 'rtl');
    
    const arabicText = page.locator('text=العملاء');
    await expect(arabicText).toBeVisible();
  });

  test('should maintain performance under load', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    
    await page.click('[data-testid="customers-nav"]');
    
    const navigationTime = Date.now();
    await page.waitForLoadState('networkidle');
    
    const customerLoadTime = Date.now() - navigationTime;
    expect(customerLoadTime).toBeLessThan(2000);
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });
    
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
    expect(performanceMetrics.loadComplete).toBeLessThan(3000);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    await page.route('**/api/**', route => route.abort());
    
    await page.click('[data-testid="customers-nav"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    await page.unroute('**/api/**');
    
    await page.click('[data-testid="retry-button"]');
    
    await expect(page.locator('[data-testid="customers-table"]')).toBeVisible();
  });

  test('should validate form inputs correctly', async ({ page }) => {
    await page.click('[data-testid="customers-nav"]');
    await page.click('[data-testid="add-customer-button"]');
    
    await page.fill('[data-testid="customer-email"]', 'invalid-email');
    await page.click('[data-testid="save-customer-button"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    
    await page.fill('[data-testid="customer-phone"]', 'invalid-phone');
    await page.click('[data-testid="save-customer-button"]');
    
    await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
    
    await page.fill('[data-testid="customer-name"]', '');
    await page.click('[data-testid="save-customer-button"]');
    
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
  });

  test('should support PWA functionality', async ({ page, context }) => {
    await page.goto('/');
    
    const serviceWorkerPromise = page.waitForEvent('serviceworker');
    await page.reload();
    const serviceWorker = await serviceWorkerPromise;
    
    expect(serviceWorker).toBeTruthy();
    
    await context.setOffline(true);
    
    await page.reload();
    
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    await context.setOffline(false);
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });
});
