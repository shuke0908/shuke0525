'use client';

import { useEffect } from 'react';
import { 
  initPerformanceMonitoring, 
  monitorMemoryUsage, 
  monitorNetworkPerformance,
  optimizeImageLoading,
  analyzeBundleSize 
} from '@/lib/performance';
import { isDevelopment } from '@/lib/config';

export function PerformanceMonitor() {
  useEffect(() => {
    // 성능 모니터링 초기화
    initPerformanceMonitoring();

    // 이미지 지연 로딩 최적화
    optimizeImageLoading();

    // 개발 환경에서만 추가 모니터링
    if (isDevelopment) {
      // 메모리 사용량 모니터링 (5초마다)
      const memoryInterval = setInterval(() => {
        monitorMemoryUsage();
      }, 5000);

      // 네트워크 성능 모니터링 (10초마다)
      const networkInterval = setInterval(() => {
        monitorNetworkPerformance();
      }, 10000);

      // 번들 크기 분석 (한 번만)
      setTimeout(() => {
        analyzeBundleSize();
      }, 2000);

      // 정리 함수
      return () => {
        clearInterval(memoryInterval);
        clearInterval(networkInterval);
      };
    }
  }, []);

  // 개발 환경에서만 성능 정보 표시
  if (!isDevelopment) {
    return null;
  }

  return (
    <div 
      id="performance-monitor" 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        fontFamily: 'monospace',
        maxWidth: '200px',
        display: 'none', // 기본적으로 숨김
      }}
    >
      <div>Performance Monitor</div>
      <div>Press Ctrl+Shift+P to toggle</div>
    </div>
  );
}

// 전역 성능 모니터 토글 함수
if (typeof window !== 'undefined' && isDevelopment) {
  (window as any).togglePerformanceMonitor = () => {
    const monitor = document.getElementById('performance-monitor');
    if (monitor) {
      monitor.style.display = monitor.style.display === 'none' ? 'block' : 'none';
    }
  };

  // 키보드 단축키 등록
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      (window as any).togglePerformanceMonitor();
    }
  });
} 