'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { abTestingService, UserContext, ABTestExperiment, FeatureFlag } from '@/lib/ab-testing';
import { useMobile } from '@/hooks/useMobile';

interface ABTestContextType {
  userContext: UserContext | null;
  isFeatureEnabled: (flagId: string) => boolean;
  getVariant: (experimentId: string) => string | null;
  trackConversion: (experimentId: string, eventName?: string, properties?: Record<string, any>) => void;
  experiments: ABTestExperiment[];
  featureFlags: FeatureFlag[];
}

const ABTestContext = createContext<ABTestContextType | null>(null);

interface ABTestProviderProps {
  children: ReactNode;
  userId?: string;
  userSegment?: string;
}

export function ABTestProvider({ children, userId, userSegment }: ABTestProviderProps) {
  const { isMobile, isTablet } = useMobile();
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [experiments, setExperiments] = useState<ABTestExperiment[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);

  // 사용자 컨텍스트 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 세션 ID 생성 또는 가져오기
    let sessionId = sessionStorage.getItem('ab_test_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ab_test_session_id', sessionId);
    }

    // 디바이스 타입 결정
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';

    // 신규 사용자 여부 (쿠키 또는 로컬 스토리지 기반)
    const isNewUser = !localStorage.getItem('user_visited_before');
    if (isNewUser) {
      localStorage.setItem('user_visited_before', 'true');
    }

    // 지리적 위치 (선택사항 - IP 기반 또는 브라우저 API)
    let geoLocation: string | undefined;
    try {
      geoLocation = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      // fallback
    }

    const context: UserContext = {
      userId,
      sessionId,
      userAgent: navigator.userAgent,
      geoLocation,
      deviceType,
      isNewUser,
      userSegment,
    };

    setUserContext(context);
  }, [userId, userSegment, isMobile, isTablet]);

  // 실험 및 피처 플래그 로드
  useEffect(() => {
    setExperiments(abTestingService.getAllExperiments());
    setFeatureFlags(abTestingService.getAllFeatureFlags());
  }, []);

  const isFeatureEnabled = (flagId: string): boolean => {
    if (!userContext) return false;
    return abTestingService.isFeatureEnabled(flagId, userContext);
  };

  const getVariant = (experimentId: string): string | null => {
    if (!userContext) return null;
    return abTestingService.assignUserToVariant(experimentId, userContext);
  };

  const trackConversion = (experimentId: string, eventName?: string, properties?: Record<string, any>): void => {
    if (!userContext) return;
    abTestingService.trackConversion(experimentId, userContext, eventName, properties);
  };

  const value: ABTestContextType = {
    userContext,
    isFeatureEnabled,
    getVariant,
    trackConversion,
    experiments,
    featureFlags,
  };

  return (
    <ABTestContext.Provider value={value}>
      {children}
    </ABTestContext.Provider>
  );
}

// Hook for using AB Test context
export function useABTest() {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }
  return context;
}

// Individual hooks for convenience
export function useFeatureFlag(flagId: string): boolean {
  const { isFeatureEnabled } = useABTest();
  return isFeatureEnabled(flagId);
}

export function useExperimentVariant(experimentId: string): string | null {
  const { getVariant } = useABTest();
  return getVariant(experimentId);
}

export function useConversionTracking(experimentId: string) {
  const { trackConversion } = useABTest();
  
  return (eventName?: string, properties?: Record<string, any>) => {
    trackConversion(experimentId, eventName, properties);
  };
} 