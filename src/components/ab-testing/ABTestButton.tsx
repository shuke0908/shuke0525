'use client';

import React from 'react';
import { EnhancedButton, EnhancedButtonProps } from '@/components/ui/enhanced-button';
import { useExperimentVariant, useConversionTracking } from './ABTestProvider';
import { cn } from '@/lib/utils';
import { useABTest } from './ABTestProvider';

interface ABTestButtonProps extends EnhancedButtonProps {
  experimentId?: string;
  conversionEvent?: string;
  conversionProperties?: Record<string, any>;
}

export function ABTestButton({ 
  experimentId = 'button_color_test',
  conversionEvent = 'button_click',
  conversionProperties,
  className,
  onClick,
  ...props 
}: ABTestButtonProps) {
  const variant = useExperimentVariant(experimentId);
  const trackConversion = useConversionTracking(experimentId);

  // 변형에 따른 스타일 적용
  const getVariantClassName = () => {
    switch (variant) {
      case 'green':
        return 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500';
      case 'blue':
      default:
        return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // A/B 테스트 컨버전 추적
    trackConversion(conversionEvent, {
      variant,
      timestamp: new Date().toISOString(),
      ...conversionProperties,
    });

    // 원래 클릭 핸들러 호출
    onClick?.(e);
  };

  return (
    <EnhancedButton
      {...props}
      className={cn(
        // 기본 스타일을 제거하고 변형별 스타일 적용
        'bg-transparent', // 기본 배경 제거
        getVariantClassName(),
        className
      )}
      onClick={handleClick}
    />
  );
}

// 특정 실험을 위한 전용 컴포넌트들
export function DashboardLayoutTest({ children, className }: { children: React.ReactNode; className?: string }) {
  const variant = useExperimentVariant('dashboard_layout_test');
  const trackConversion = useConversionTracking('dashboard_layout_test');

  // 레이아웃 변형에 따른 스타일
  const getLayoutClassName = () => {
    switch (variant) {
      case 'modern':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6';
      case 'classic':
      default:
        return 'flex flex-col space-y-4 p-4';
    }
  };

  React.useEffect(() => {
    // 페이지 진입 시 노출 이벤트는 자동으로 추적됨 (ABTestProvider에서)
    // 여기서는 추가적인 인터랙션 추적을 설정할 수 있음
  }, []);

  return (
    <div 
      className={cn(getLayoutClassName(), className)}
      data-testid={`dashboard-layout-${variant}`}
    >
      {children}
    </div>
  );
}

export function MobileUITest({ children, className }: { children: React.ReactNode; className?: string }) {
  const variant = useExperimentVariant('mobile_ui_test');
  const trackConversion = useConversionTracking('mobile_ui_test');

  // 모바일 UI 변형에 따른 스타일
  const getMobileUIClassName = () => {
    switch (variant) {
      case 'enhanced':
        return 'enhanced-mobile-ui touch-manipulation backdrop-blur-sm';
      case 'original':
      default:
        return 'original-mobile-ui';
    }
  };

  // 사용자 만족도 추적 (스크롤, 체류 시간 등)
  React.useEffect(() => {
    let startTime = Date.now();
    let hasScrolled = false;

    const handleScroll = () => {
      if (!hasScrolled) {
        hasScrolled = true;
        trackConversion('user_engagement', {
          variant,
          action: 'scroll',
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleBeforeUnload = () => {
      const engagementTime = Date.now() - startTime;
      if (engagementTime > 30000) { // 30초 이상 체류
        trackConversion('engagement_time', {
          variant,
          duration: engagementTime,
          timestamp: new Date().toISOString(),
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [variant, trackConversion]);

  return (
    <div 
      className={cn(getMobileUIClassName(), className)}
      data-testid={`mobile-ui-${variant}`}
    >
      {children}
    </div>
  );
}

// 피처 플래그 기반 컴포넌트
export function ConditionalFeature({ 
  flagId, 
  children, 
  fallback = null 
}: { 
  flagId: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  const { isFeatureEnabled } = useABTest();
  
  return isFeatureEnabled(flagId) ? <>{children}</> : <>{fallback}</>;
}

// A/B 테스트 디버깅 컴포넌트 (개발 환경에서만 표시)
export function ABTestDebugger() {
  const { userContext, experiments, featureFlags, isFeatureEnabled } = useABTest();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">A/B Test Debug</h3>
      
      <div className="mb-2">
        <strong>User Context:</strong>
        <pre className="text-xs">{JSON.stringify(userContext, null, 2)}</pre>
      </div>

      <div className="mb-2">
        <strong>Active Experiments:</strong>
        {experiments.filter(e => e.enabled).map(exp => {
          const variant = useExperimentVariant(exp.id);
          return (
            <div key={exp.id} className="text-xs">
              {exp.name}: {variant || 'not assigned'}
            </div>
          );
        })}
      </div>

      <div>
        <strong>Feature Flags:</strong>
        {featureFlags.map(flag => {
          const enabled = isFeatureEnabled(flag.id);
          return (
            <div key={flag.id} className="text-xs">
              {flag.name}: {enabled ? '✅' : '❌'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// A/B 테스트 결과 요약 컴포넌트
export function ABTestSummary({ experimentId }: { experimentId: string }) {
  const [results, setResults] = React.useState<any>(null);

  React.useEffect(() => {
    // 실제 환경에서는 API에서 결과를 가져와야 함
    const experimentResults = abTestingService.getExperimentResults(experimentId);
    setResults(experimentResults);
  }, [experimentId]);

  if (!results) {
    return <div>결과 로딩 중...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4">실험 결과: {experimentId}</h3>
      
      {Object.entries(results).map(([variantId, data]: [string, any]) => (
        <div key={variantId} className="mb-4 p-4 border rounded">
          <h4 className="font-semibold">{variantId}</h4>
          <p>노출 수: {data.exposures}</p>
          <p>컨버전 수: {data.conversions}</p>
          <p>컨버전율: {data.conversionRate.toFixed(2)}%</p>
        </div>
      ))}
    </div>
  );
} 