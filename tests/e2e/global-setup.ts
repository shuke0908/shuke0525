import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  const { baseURL } = config.projects[0].use;
  
  // 브라우저 실행
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 애플리케이션이 준비될 때까지 대기
    console.log(`📡 Waiting for application at ${baseURL}...`);
    await page.goto(baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 기본 상태 확인
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Application is ready');
    
    // 테스트 데이터 초기화 (필요한 경우)
    await setupTestData(page);
    
    // A/B 테스트 설정 초기화
    await setupABTestData(page);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  // localStorage 초기화
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // 테스트용 사용자 데이터 설정
  await page.evaluate(() => {
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      preferences: {
        theme: 'light',
        currency: 'USD'
      }
    };
    
    localStorage.setItem('user', JSON.stringify(testUser));
    localStorage.setItem('auth_token', 'test-auth-token');
  });
  
  console.log('📊 Test data initialized');
}

async function setupABTestData(page: any) {
  // A/B 테스트 데이터 초기화
  await page.evaluate(() => {
    // 일관된 테스트를 위해 고정된 실험 할당
    const abTestAssignments = {
      'test-user-123': {
        'button_color_test': 'blue',
        'dashboard_layout_test': 'modern',
        'mobile_ui_test': 'enhanced'
      }
    };
    
    localStorage.setItem('ab_test_assignments', JSON.stringify(abTestAssignments));
    
    // 피처 플래그 설정
    const featureFlags = {
      'advanced_charts': true,
      'new_trading_interface': true,
      'dark_mode_v2': false,
      'push_notifications': true,
      'social_trading': false
    };
    
    localStorage.setItem('feature_flags', JSON.stringify(featureFlags));
  });
  
  console.log('🧪 A/B test data initialized');
}

export default globalSetup; 