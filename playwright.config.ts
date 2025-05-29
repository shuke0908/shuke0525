import { defineConfig, devices } from '@playwright/test';

// 환경 설정
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const isCI = !!process.env.CI;

export default defineConfig({
  // 테스트 파일 위치
  testDir: './tests/e2e',
  
  // 병렬 실행 설정
  fullyParallel: true,
  
  // CI에서 실패 시 재시도 금지
  forbidOnly: isCI,
  
  // 실패 시 재시도 횟수
  retries: isCI ? 2 : 0,
  
  // 병렬 작업자 수
  workers: isCI ? 1 : undefined,
  
  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    isCI ? ['github'] : ['list']
  ],
  
  // 전역 설정
  use: {
    // 기본 URL
    baseURL,
    
    // 브라우저 컨텍스트 설정
    viewport: { width: 1280, height: 720 },
    
    // 테스트 실행 시 스크린샷
    screenshot: 'only-on-failure',
    
    // 비디오 녹화
    video: 'retain-on-failure',
    
    // 네트워크 활동 추적
    trace: 'retain-on-failure',
    
    // 사용자 에이전트
    userAgent: 'Playwright E2E Tests',
    
    // 액션 타임아웃
    actionTimeout: 10000,
    
    // 네비게이션 타임아웃
    navigationTimeout: 30000,
  },
  
  // 테스트 실행 전 서버 시작
  webServer: [
    {
      command: 'npm run build && npm start',
      url: baseURL,
      timeout: 120 * 1000,
      reuseExistingServer: !isCI,
      env: {
        NODE_ENV: 'test'
      }
    }
  ],
  
  // 프로젝트별 설정 (브라우저별)
  projects: [
    // 데스크톱 브라우저
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.spec.ts', '**/*.test.ts']
    },
    
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/*.spec.ts', '**/*.test.ts']
    },
    
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/*.spec.ts', '**/*.test.ts']
    },
    
    // 모바일 브라우저
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/mobile-*.spec.ts', '**/responsive-*.spec.ts']
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/mobile-*.spec.ts', '**/responsive-*.spec.ts']
    },
    
    // 태블릿
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
      testMatch: ['**/tablet-*.spec.ts', '**/responsive-*.spec.ts']
    },
    
    // 성능 테스트 (데스크톱만)
    {
      name: 'Performance Tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/performance-*.spec.ts'],
      timeout: 60000
    },
    
    // 접근성 테스트
    {
      name: 'Accessibility Tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/accessibility-*.spec.ts'],
      timeout: 30000
    },
    
    // 시각적 회귀 테스트
    {
      name: 'Visual Tests',
      use: { 
        ...devices['Desktop Chrome'],
        // 시각적 테스트를 위한 일관된 설정
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1
      },
      testMatch: ['**/visual-*.spec.ts']
    }
  ],
  
  // 전역 설정
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  
  // 테스트 실행 시간 제한
  timeout: 30000,
  
  // expect 설정
  expect: {
    // 시각적 비교 임계값
    threshold: 0.2,
    
    // 스크린샷 비교 모드
    mode: 'strict'
  },
  
  // 출력 디렉토리
  outputDir: 'test-results/',
  
  // 메타데이터
  metadata: {
    testType: 'e2e',
    environment: process.env.NODE_ENV || 'test',
    baseURL
  }
}); 