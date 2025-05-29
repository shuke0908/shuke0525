import dynamic from 'next/dynamic';
import React from 'react';
import type { ComponentType } from 'react';

// 안전한 동적 import를 위한 헬퍼
const createSafeImport = (path: string, componentName: string) => {
  return dynamic(
    () => import(path).catch(() => ({ 
      default: () => React.createElement('div', { 
        className: 'p-4 text-center text-gray-500' 
      }, `${componentName} 컴포넌트를 불러올 수 없습니다.`) 
    })),
    {
      loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />,
      ssr: false
    }
  );
};

// Admin 컴포넌트들 동적 import - 안전한 버전
export const AdminDashboard = createSafeImport('@/components/admin/AdminDashboard', 'AdminDashboard');
export const AdminUserManagement = createSafeImport('@/components/admin/AdminUserManagement', 'AdminUserManagement');
export const AdminDeposits = createSafeImport('@/components/admin/AdminDeposits', 'AdminDeposits');

// Trading 컴포넌트들 동적 import
export const FlashTradeModule = dynamic(() => import('@/components/trading/FlashTradeModule').then(mod => ({ default: mod.default || mod.FlashTradeModule })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: true // 트레이딩은 SSR 유지
});

export const QuickTradeModule = dynamic(() => import('@/components/trading/QuickTradeModule').then(mod => ({ default: mod.default || mod.QuickTradeModule })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: true
});

export const QuantAIModule = createSafeImport('@/components/trading/QuantAIModule', 'QuantAIModule');

// Wallet 컴포넌트들 동적 import
export const WalletOverview = createSafeImport('@/components/wallet/WalletOverview', 'WalletOverview');
export const DepositModule = createSafeImport('@/components/wallet/DepositModule', 'DepositModule');
export const WithdrawalModule = createSafeImport('@/components/wallet/WithdrawalModule', 'WithdrawalModule');

// Chart 컴포넌트들 동적 import (무거운 차트 라이브러리)
export const TradingChart = createSafeImport('@/components/charts/TradingChart', 'TradingChart');
export const AnalyticsChart = createSafeImport('@/components/charts/AnalyticsChart', 'AnalyticsChart');

// Support 컴포넌트들 동적 import
export const SupportChat = createSafeImport('@/components/support/SupportChat', 'SupportChat');
export const KYCVerification = createSafeImport('@/components/kyc/KYCVerification', 'KYCVerification');

// 큰 라이브러리들을 동적으로 로드하는 유틸리티
export const loadChartLibrary = async () => {
  const recharts = await import('recharts');
  // chart.js는 설치되지 않은 경우 안전하게 처리
  try {
    const chartjs = await import('chart.js');
    return { recharts, chartjs };
  } catch {
    return { recharts, chartjs: null };
  }
};

export const loadCryptoLibrary = async () => {
  const crypto = await import('crypto-js');
  return crypto;
};

// 조건부 동적 import 헬퍼
export const createConditionalImport = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  condition: boolean,
  fallback?: ComponentType<any>
) => {
  if (condition) {
    return dynamic(importFn, {
      loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded" />,
      ssr: false
    });
  }
  return fallback || (() => null);
};

// 성능 모니터링을 위한 import 타이밍 측정
export const timedImport = async function<T>(
  importFn: () => Promise<T>,
  componentName: string
): Promise<T> {
  const start = performance.now();
  const module = await importFn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Dynamic import [${componentName}]: ${(end - start).toFixed(2)}ms`);
  }
  
  return module;
}; 