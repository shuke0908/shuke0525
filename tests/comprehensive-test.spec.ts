import { test, expect, Page } from '@playwright/test';

// 테스트할 모든 라우트
const routes = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' }
];

// 콘솔 에러 수집을 위한 헬퍼
async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}\nStack: ${error.stack}`);
  });

  return errors;
}

// 네트워크 요청 모니터링
async function monitorNetworkRequests(page: Page) {
  const failedRequests: any[] = [];
  
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  return failedRequests;
}

test.describe('Comprehensive Application Test', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 콘솔 에러 수집 시작
    await collectConsoleErrors(page);
  });

  test('1. Dashboard Page - Complete Functionality Test', async ({ page }) => {
    console.log('🚀 Starting Dashboard comprehensive test...');
    
    const errors = await collectConsoleErrors(page);
    const failedRequests = await monitorNetworkRequests(page);

    try {
      // 1. 대시보드 페이지 로드
      console.log('📍 Step 1: Loading dashboard page...');
      await page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // 2. 페이지 로드 완료 확인
      console.log('📍 Step 2: Verifying page load...');
      await expect(page).toHaveTitle(/CryptoTrader|Dashboard/);
      
      // 3. JavaScript 에러 체크
      if (errors.length > 0) {
        console.error('❌ JavaScript errors detected:');
        errors.forEach(error => console.error(error));
        throw new Error(`JavaScript errors found: ${errors.join(', ')}`);
      }

      // 4. 핵심 UI 컴포넌트 존재 확인
      console.log('📍 Step 3: Checking core UI components...');
      
      // 대시보드 통계 카드들
      await expect(page.locator('text=Portfolio Value')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Daily Volume')).toBeVisible();
      await expect(page.locator('text=Total Profit')).toBeVisible();
      await expect(page.locator('text=Active Positions')).toBeVisible();

      // 거래 모듈들
      await expect(page.locator('text=Quick Trade')).toBeVisible();
      await expect(page.locator('text=Flash Trade')).toBeVisible();
      await expect(page.locator('text=Quant AI Trading')).toBeVisible();

      // 차트 및 투자 정보
      await expect(page.locator('text=Chart')).toBeVisible();
      await expect(page.locator('text=Active Investments')).toBeVisible();
      await expect(page.locator('text=Recent Transactions')).toBeVisible();

      // 5. 버튼 상호작용 테스트
      console.log('📍 Step 4: Testing button interactions...');
      
      // 새로고침 버튼 클릭
      const refreshButton = page.locator('button:has-text("Refresh")').first();
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        await page.waitForTimeout(1000);
      }

      // AI 전략 보기 버튼
      const aiButton = page.locator('button:has-text("View AI Strategies")').first();
      if (await aiButton.isVisible()) {
        await aiButton.click();
        await page.waitForTimeout(500);
      }

      // 6. 네트워크 요청 실패 체크
      if (failedRequests.length > 0) {
        console.warn('⚠️ Failed network requests detected:');
        failedRequests.forEach(req => {
          console.warn(`${req.status} ${req.statusText}: ${req.url}`);
        });
        // API 요청 실패는 경고로만 처리 (실제 백엔드가 없을 수 있음)
      }

      console.log('✅ Dashboard test completed successfully!');

    } catch (error) {
      console.error('❌ Dashboard test failed:', error);
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'test-results/dashboard-failure.png',
        fullPage: true 
      });
      
      // 페이지 HTML 저장
      const html = await page.content();
      console.log('📄 Page HTML length:', html.length);
      
      throw error;
    }
  });

  test('2. Home Page Test', async ({ page }) => {
    console.log('🚀 Starting Home page test...');
    
    const errors = await collectConsoleErrors(page);

    try {
      await page.goto('http://localhost:3000/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // 홈페이지 핵심 요소 확인
      await expect(page.locator('text=CryptoTrader')).toBeVisible({ timeout: 10000 });
      
      // 네비게이션 링크 테스트
      const dashboardLink = page.locator('a[href="/dashboard"]').first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await page.waitForURL('**/dashboard');
        await page.goBack();
      }

      if (errors.length > 0) {
        throw new Error(`Home page errors: ${errors.join(', ')}`);
      }

      console.log('✅ Home page test completed successfully!');

    } catch (error) {
      console.error('❌ Home page test failed:', error);
      await page.screenshot({ path: 'test-results/home-failure.png' });
      throw error;
    }
  });

  test('3. Login Page Test', async ({ page }) => {
    console.log('🚀 Starting Login page test...');
    
    const errors = await collectConsoleErrors(page);

    try {
      await page.goto('http://localhost:3000/login', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // 로그인 폼 요소 확인
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Login"), button:has-text("로그인")')).toBeVisible();

      if (errors.length > 0) {
        throw new Error(`Login page errors: ${errors.join(', ')}`);
      }

      console.log('✅ Login page test completed successfully!');

    } catch (error) {
      console.error('❌ Login page test failed:', error);
      await page.screenshot({ path: 'test-results/login-failure.png' });
      throw error;
    }
  });

  test('4. Register Page Test', async ({ page }) => {
    console.log('🚀 Starting Register page test...');
    
    const errors = await collectConsoleErrors(page);

    try {
      await page.goto('http://localhost:3000/register', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // 회원가입 폼 요소 확인
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Register"), button:has-text("회원가입")')).toBeVisible();

      if (errors.length > 0) {
        throw new Error(`Register page errors: ${errors.join(', ')}`);
      }

      console.log('✅ Register page test completed successfully!');

    } catch (error) {
      console.error('❌ Register page test failed:', error);
      await page.screenshot({ path: 'test-results/register-failure.png' });
      throw error;
    }
  });

  test('5. Cross-Page Navigation Test', async ({ page }) => {
    console.log('🚀 Starting cross-page navigation test...');
    
    try {
      // 홈 → 대시보드 → 로그인 순서로 네비게이션 테스트
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle');

      // 대시보드로 이동
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Portfolio Value, text=Dashboard')).toBeVisible({ timeout: 10000 });

      // 로그인으로 이동
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });

      console.log('✅ Cross-page navigation test completed successfully!');

    } catch (error) {
      console.error('❌ Navigation test failed:', error);
      await page.screenshot({ path: 'test-results/navigation-failure.png' });
      throw error;
    }
  });

  test('6. Performance and Load Test', async ({ page }) => {
    console.log('🚀 Starting performance test...');
    
    try {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/dashboard', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`📊 Dashboard load time: ${loadTime}ms`);
      
      // 5초 이내 로드 확인
      expect(loadTime).toBeLessThan(5000);
      
      // 메모리 사용량 체크 (가능한 경우)
      const metrics = await page.evaluate(() => {
        return {
          memory: (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize
          } : null,
          timing: performance.timing ? {
            loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
          } : null
        };
      });
      
      console.log('📊 Performance metrics:', metrics);
      
      console.log('✅ Performance test completed successfully!');

    } catch (error) {
      console.error('❌ Performance test failed:', error);
      throw error;
    }
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    // 테스트 실패 시 추가 디버그 정보 수집
    const url = page.url();
    console.log(`❌ Test failed on URL: ${url}`);
    
    // 콘솔 로그 수집
    const logs = await page.evaluate(() => {
      return (window as any).testLogs || [];
    });
    
    if (logs.length > 0) {
      console.log('📋 Console logs:', logs);
    }
  }
}); 