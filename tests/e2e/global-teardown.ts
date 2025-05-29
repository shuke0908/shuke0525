import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');
  
  try {
    // 테스트 결과 정리
    await cleanupTestResults();
    
    // 테스트 데이터 정리 (필요한 경우)
    await cleanupTestData();
    
    // 리포트 생성
    await generateTestReport();
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

async function cleanupTestResults() {
  // 테스트 결과 디렉토리 정리
  const testResultsDir = path.join(process.cwd(), 'test-results');
  
  if (fs.existsSync(testResultsDir)) {
    // 오래된 스크린샷 및 비디오 파일 정리
    const files = fs.readdirSync(testResultsDir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(testResultsDir, file.name);
      
      if (file.isFile()) {
        const stats = fs.statSync(filePath);
        const now = new Date();
        const fileAge = now.getTime() - stats.mtime.getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7일
        
        // 7일 이상 된 파일 삭제
        if (fileAge > maxAge) {
          try {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Removed old test file: ${file.name}`);
          } catch (error) {
            console.warn(`⚠️ Failed to remove file ${file.name}:`, error);
          }
        }
      }
    }
  }
  
  console.log('📂 Test results cleaned up');
}

async function cleanupTestData() {
  // 테스트 중 생성된 임시 데이터 정리
  console.log('🧽 Test data cleaned up');
}

async function generateTestReport() {
  // 테스트 실행 통계 생성
  const reportData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'test',
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    testSummary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    }
  };
  
  // 결과 JSON 파일이 있다면 읽어서 통계 생성
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
  
  if (fs.existsSync(resultsPath)) {
    try {
      const resultsContent = fs.readFileSync(resultsPath, 'utf8');
      const results = JSON.parse(resultsContent);
      
      if (results.suites) {
        for (const suite of results.suites) {
          for (const spec of suite.specs) {
            for (const test of spec.tests) {
              reportData.testSummary.totalTests++;
              
              const outcome = test.results[0]?.status;
              switch (outcome) {
                case 'passed':
                  reportData.testSummary.passedTests++;
                  break;
                case 'failed':
                  reportData.testSummary.failedTests++;
                  break;
                case 'skipped':
                  reportData.testSummary.skippedTests++;
                  break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse test results:', error);
    }
  }
  
  // 리포트 저장
  const reportPath = path.join(process.cwd(), 'test-results', 'test-summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log('📊 Test report generated:', reportPath);
  console.log('📈 Test Summary:', reportData.testSummary);
  
  // CI 환경에서 성과 출력
  if (process.env.CI) {
    const { totalTests, passedTests, failedTests, skippedTests } = reportData.testSummary;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log(`\n📊 E2E Test Results:`);
    console.log(`   Total: ${totalTests}`);
    console.log(`   Passed: ${passedTests} (${passRate}%)`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Skipped: ${skippedTests}`);
    
    // GitHub Actions 출력
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::set-output name=total_tests::${totalTests}`);
      console.log(`::set-output name=passed_tests::${passedTests}`);
      console.log(`::set-output name=failed_tests::${failedTests}`);
      console.log(`::set-output name=pass_rate::${passRate}`);
    }
  }
}

export default globalTeardown; 