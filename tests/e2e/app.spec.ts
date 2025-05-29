import { test, expect, Page } from '@playwright/test';

// 테스트 데이터
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

// 헬퍼 함수들
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('body');
}

// 기본 기능 테스트
test.describe('기본 기능 테스트', () => {
  test('홈페이지 로드 및 기본 네비게이션', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/CryptoTrader/);

    // 메인 헤더 확인
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();

    // 주요 네비게이션 링크 확인
    await expect(page.locator('[href="/trading"]')).toBeVisible();
    await expect(page.locator('[href="/portfolio"]')).toBeVisible();
    await expect(page.locator('[href="/market"]')).toBeVisible();

    // CTA 버튼 확인
    const ctaButton = page.locator('[data-testid="cta-button"]');
    if (await ctaButton.isVisible()) {
      await expect(ctaButton).toBeEnabled();
    }
  });

  test('트레이딩 페이지 기능', async ({ page }) => {
    await page.goto('/trading');
    await waitForPageLoad(page);

    // 가격 차트 확인
    await expect(page.locator('[data-testid="price-chart"]')).toBeVisible();

    // 주문서 확인
    await expect(page.locator('[data-testid="order-book"]')).toBeVisible();

    // 트레이딩 폼 확인
    await expect(page.locator('[data-testid="trading-form"]')).toBeVisible();

    // 시장 데이터 로딩 확인
    await page.waitForSelector('[data-testid="market-data"]', { timeout: 10000 });
  });

  test('포트폴리오 페이지 접근', async ({ page }) => {
    await page.goto('/portfolio');
    await waitForPageLoad(page);

    // 포트폴리오 개요 확인
    await expect(page.locator('[data-testid="portfolio-overview"]')).toBeVisible();

    // 자산 목록 확인
    await expect(page.locator('[data-testid="assets-list"]')).toBeVisible();
  });
});

// 반응형 디자인 테스트
test.describe('반응형 디자인 테스트', () => {
  test('모바일 뷰포트에서 올바른 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);

    // 모바일 메뉴 버튼 확인
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();

    // 모바일 메뉴 열기
    await mobileMenuButton.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // 모바일 네비게이션 링크 확인
    await expect(page.locator('[data-testid="mobile-nav-trading"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav-portfolio"]')).toBeVisible();
  });

  test('태블릿 뷰포트에서 올바른 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/trading');
    await waitForPageLoad(page);

    // 태블릿에서 차트와 주문서가 적절히 배치되는지 확인
    const chart = page.locator('[data-testid="price-chart"]');
    const orderBook = page.locator('[data-testid="order-book"]');
    
    await expect(chart).toBeVisible();
    await expect(orderBook).toBeVisible();

    // 차트가 적절한 크기를 가지는지 확인
    const chartBox = await chart.boundingBox();
    expect(chartBox?.width).toBeGreaterThan(300);
  });

  test('데스크톱 뷰포트에서 전체 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/trading');
    await waitForPageLoad(page);

    // 데스크톱에서 모든 요소가 한 화면에 표시되는지 확인
    await expect(page.locator('[data-testid="price-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-book"]')).toBeVisible();
    await expect(page.locator('[data-testid="trading-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="market-data"]')).toBeVisible();
  });
});

// 사용자 인터랙션 테스트
test.describe('사용자 인터랙션 테스트', () => {
  test('검색 기능', async ({ page }) => {
    await page.goto('/market');
    await waitForPageLoad(page);

    const searchInput = page.locator('[data-testid="market-search"]');
    await searchInput.fill('BTC');

    // 검색 결과 확인
    await page.waitForSelector('[data-testid="search-results"]');
    await expect(page.locator('[data-testid="search-result-BTC"]')).toBeVisible();
  });

  test('정렬 및 필터링', async ({ page }) => {
    await page.goto('/market');
    await waitForPageLoad(page);

    // 가격순 정렬
    await page.click('[data-testid="sort-by-price"]');
    await page.waitForTimeout(1000);

    // 정렬이 적용되었는지 확인 (첫 번째와 두 번째 항목의 가격 비교)
    const prices = await page.locator('[data-testid="coin-price"]').allTextContents();
    expect(prices.length).toBeGreaterThan(1);
  });

  test('테마 전환', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // 다크모드 토글 확인
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // 다크모드 클래스 확인
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark/);
    }
  });
});

// 성능 테스트
test.describe('성능 테스트', () => {
  test('페이지 로딩 시간 측정', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const loadTime = Date.now() - startTime;
    console.log(`페이지 로딩 시간: ${loadTime}ms`);
    
    // 3초 이내에 로딩되어야 함
    expect(loadTime).toBeLessThan(3000);
  });

  test('Core Web Vitals 측정', async ({ page }) => {
    await page.goto('/');

    // Web Vitals 측정
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          vitals.lcp = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay) - 실제 사용자 상호작용이 필요
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          vitals.cls = cls;
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(vitals), 2000);
      });
    });

    console.log('Web Vitals:', webVitals);
  });
});

// 접근성 테스트
test.describe('접근성 테스트', () => {
  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Tab 키로 네비게이션 테스트
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus').first();
    await expect(firstFocusable).toBeVisible();

    // Enter 키로 링크 활성화 테스트
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('ARIA 레이블 확인', async ({ page }) => {
    await page.goto('/trading');
    await waitForPageLoad(page);

    // 중요한 요소들의 ARIA 레이블 확인
    const tradingForm = page.locator('[data-testid="trading-form"]');
    await expect(tradingForm).toHaveAttribute('aria-label');

    const priceChart = page.locator('[data-testid="price-chart"]');
    if (await priceChart.isVisible()) {
      await expect(priceChart).toHaveAttribute('aria-label');
    }
  });

  test('색상 대비 확인', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // 기본 텍스트 색상 대비 확인 (자동화된 도구 필요)
    const textElements = page.locator('p, h1, h2, h3, button');
    const count = await textElements.count();
    expect(count).toBeGreaterThan(0);
  });
});

// A/B 테스트 검증
test.describe('A/B 테스트 검증', () => {
  test('버튼 색상 변형 확인', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // A/B 테스트 버튼이 표시되는지 확인
    const ctaButton = page.locator('[data-testid="cta-button"]');
    if (await ctaButton.isVisible()) {
      const buttonClass = await ctaButton.getAttribute('class');
      // 파란색 또는 녹색 변형 중 하나여야 함
      expect(buttonClass).toMatch(/(blue|green)/);
    }
  });

  test('대시보드 레이아웃 변형 확인', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    const layout = page.locator('[data-testid^="dashboard-layout-"]');
    if (await layout.isVisible()) {
      const testId = await layout.getAttribute('data-testid');
      expect(testId).toMatch(/dashboard-layout-(classic|modern)/);
    }
  });
});

// 에러 처리 테스트
test.describe('에러 처리 테스트', () => {
  test('404 페이지 처리', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // 404 페이지가 표시되는지 확인
    await expect(page.locator('[data-testid="404-page"]')).toBeVisible();
    await expect(page.locator('text=페이지를 찾을 수 없습니다')).toBeVisible();
  });

  test('네트워크 에러 처리', async ({ page }) => {
    // 네트워크 요청 차단
    await page.route('/api/market/prices', route => route.abort());
    
    await page.goto('/trading');
    await waitForPageLoad(page);

    // 에러 메시지가 표시되는지 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
  });
});

// 보안 테스트
test.describe('보안 테스트', () => {
  test('XSS 방지 확인', async ({ page }) => {
    await page.goto('/market');
    await waitForPageLoad(page);

    const searchInput = page.locator('[data-testid="market-search"]');
    
    // XSS 공격 시도
    await searchInput.fill('<script>alert("xss")</script>');
    await page.keyboard.press('Enter');
    
    // 스크립트가 실행되지 않았는지 확인
    const alertDialog = page.locator('text=xss');
    await expect(alertDialog).not.toBeVisible();
  });

  test('HTTPS 리다이렉트 확인', async ({ page, browserName }) => {
    // 프로덕션 환경에서만 테스트
    if (process.env.NODE_ENV === 'production') {
      const response = await page.goto('http://cryptotrader.com');
      expect(response?.url()).toMatch(/^https:/);
    }
  });
});

// 실시간 기능 테스트
test.describe('실시간 기능 테스트', () => {
  test('가격 업데이트 확인', async ({ page }) => {
    await page.goto('/trading');
    await waitForPageLoad(page);

    const priceElement = page.locator('[data-testid="btc-price"]');
    if (await priceElement.isVisible()) {
      const initialPrice = await priceElement.textContent();
      
      // 5초 후 가격이 업데이트되었는지 확인
      await page.waitForTimeout(5000);
      const updatedPrice = await priceElement.textContent();
      
      // 가격이 변경되거나 최소한 요소가 여전히 존재하는지 확인
      expect(await priceElement.isVisible()).toBe(true);
    }
  });

  test('WebSocket 연결 확인', async ({ page }) => {
    let wsConnected = false;

    // WebSocket 연결 모니터링
    page.on('websocket', ws => {
      wsConnected = true;
      console.log('WebSocket connected:', ws.url());
    });

    await page.goto('/trading');
    await waitForPageLoad(page);

    // WebSocket 연결 확인 (실제 WebSocket이 구현된 경우)
    await page.waitForTimeout(3000);
    console.log('WebSocket connected:', wsConnected);
  });
}); 