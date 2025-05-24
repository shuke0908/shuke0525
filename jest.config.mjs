import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Next.js 프로젝트의 루트 경로
  dir: './',
});

// Jest 사용자 정의 설정
const config = {
  // 테스트 환경 설정
  testEnvironment: 'jsdom',
  
  // 테스트 매치 패턴
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.(test|spec).{js,jsx,ts,tsx}',
    '!**/__tests__/server/**',
    '!**/server/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // 모듈 파일 확장자
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // ESM 지원
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // 모듈 경로 매핑 (tsconfig.json과 일치)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@/context/(.*)$': '<rootDir>/src/context/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  
  // 테스트 설정 파일
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/pages/api/**',
    '!src/styles/**',
    '!server/**',
    '!**/server/**',
  ],
  
  // 커버리지 리포터
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  
  // 변환 무시 패턴
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@tanstack/react-query|axios))',
  ],
  
  // 테스트 타임아웃
  testTimeout: 10000,
  
  // 모의 함수 자동 정리
  clearMocks: true,
  restoreMocks: true,
  
  // 병렬 실행 설정
  maxWorkers: '50%',
  
  // 에러 처리
  errorOnDeprecated: true,
  
  // Verbose 출력
  verbose: false,
};

// Next.js Jest 설정과 병합
export default createJestConfig(config);
