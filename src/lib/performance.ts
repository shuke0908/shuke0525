import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';

// Google Analytics gtag 함수 선언
declare global {
  var gtag: (command: string, action: string, options?: any) => void;
}

// Metric 타입 정의
interface Metric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

// 성능 메트릭 수집
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  const sendToAnalytics = (metric: Metric) => {
    // 개발 환경에서는 콘솔에 출력
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`[Performance] ${metric.name}:`, metric.value, metric);
    }
    
    // 프로덕션에서는 분석 서비스로 전송
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Google Analytics 4 또는 다른 분석 서비스로 전송
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          custom_parameter_1: metric.value,
          custom_parameter_2: metric.id,
          custom_parameter_3: metric.delta,
        });
      }
    }
  };

  // Core Web Vitals 측정
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// 컴포넌트 렌더링 성능 측정
export function measureComponentPerformance(componentName: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = ((...args: any[]) => {
      const start = performance.now();
      const result = method.apply(target, args);
      const end = performance.now();
      
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`[Component Performance] ${componentName}.${propertyName}: ${end - start}ms`);
      }
      
      return result;
    }) as any;
    
    return descriptor;
  };
}

// 메모리 사용량 모니터링
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) return;
  
  const memory = (performance as any).memory;
  const memoryInfo = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
  
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('[Memory Usage]', memoryInfo);
  }
  
  // 메모리 사용량이 80% 이상이면 경고
  if (memoryInfo.usagePercentage > 80) {
    console.warn('[Memory Warning] High memory usage detected:', memoryInfo.usagePercentage.toFixed(2) + '%');
  }
  
  return memoryInfo;
}

// 네트워크 성능 모니터링
export function monitorNetworkPerformance() {
  if (typeof window === 'undefined' || !('connection' in navigator)) return;
  
  const connection = (navigator as any).connection;
  const networkInfo = {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
  
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('[Network Info]', networkInfo);
  }
  
  return networkInfo;
}

// 이미지 지연 로딩 최적화
export function optimizeImageLoading() {
  if (typeof window === 'undefined') return;
  
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// 번들 크기 분석
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;
  
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const bundleInfo = {
    scriptCount: scripts.length,
    styleCount: styles.length,
    totalResources: scripts.length + styles.length,
  };
  
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('[Bundle Analysis]', bundleInfo);
  }
  
  return bundleInfo;
}

// 캐시 최적화
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 기본 5분
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
  
  // 만료된 캐시 정리
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// 정기적으로 캐시 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup();
  }, 5 * 60 * 1000);
}

// 디바운스 유틸리티
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 스로틀 유틸리티
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 가상 스크롤링을 위한 유틸리티
export function calculateVirtualScrollItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan: number = 5
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);
  
  return {
    startIndex,
    endIndex,
    visibleCount,
    offsetY: startIndex * itemHeight,
  };
} 