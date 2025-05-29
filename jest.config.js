const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공하여 next.config.js와 .env 파일을 로드
  dir: './',
})

// Jest에 전달할 커스텀 설정
const customJestConfig = {
  // 설정 옵션들
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // 모듈 매핑
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
  },
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/index.(js|jsx|ts|tsx)',
    '!src/**/*.stories.(js|jsx|ts|tsx)',
    '!src/**/*.config.(js|jsx|ts|tsx)',
    '!src/lib/dynamic-imports.tsx', // 동적 import는 테스트 제외
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 테스트 환경 설정
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // 무시할 패턴
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  
  // 모듈 파일 확장자
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // 변환 무시 패턴
  transformIgnorePatterns: [
    '/node_modules/(?!(framer-motion|@radix-ui)/)',
  ],
  
  // 전역 설정
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  
  // 병렬 실행 설정
  maxWorkers: '50%',
  
  // 테스트 결과 리포터
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-reports',
        filename: 'jest-report.html',
        expand: true,
      },
    ],
  ],
  
  // 모킹 설정
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // 테스트 타임아웃
  testTimeout: 10000,
  
  // verbose 출력
  verbose: true,
}

// createJestConfig는 next/jest가 비동기 config를 로드할 수 있도록 내보내짐
module.exports = createJestConfig(customJestConfig) 