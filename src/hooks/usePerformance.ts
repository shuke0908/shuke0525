import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

// Debounce 훅 - 연속된 호출을 지연시킴
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 콜백 함수용 debounce 훅
export function useDebouncedCallback<T extends (..._args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 최신 콜백 참조 유지
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Throttle 훅 - 일정 간격으로만 실행
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current)
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// 콜백 함수용 throttle 훅
export function useThrottledCallback<T extends (..._args: any[]) => any>(
  callback: T,
  limit: number = 300
): T {
  const callbackRef = useRef(callback);
  const lastRan = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: any[]) => {
      if (Date.now() - lastRan.current >= limit) {
        callbackRef.current(...args);
        lastRan.current = Date.now();
      }
    },
    [limit]
  ) as T;

  return throttledCallback;
}

// 최적화된 이벤트 핸들러 훅
export function useOptimizedEventHandler<T extends (..._args: any[]) => any>(
  handler: T,
  dependencies: any[] = [],
  debounceMs: number = 0,
  throttleMs: number = 0
): T {
  const optimizedHandler = useMemo(() => {
    let result = handler;

    if (debounceMs > 0) {
      let timeoutId: NodeJS.Timeout;
      result = ((..._args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handler(..._args), debounceMs);
      }) as T;
    } else if (throttleMs > 0) {
      let lastCall = 0;
      result = ((..._args: any[]) => {
        const now = Date.now();
        if (now - lastCall >= throttleMs) {
          lastCall = now;
          handler(..._args);
        }
      }) as T;
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler, debounceMs, throttleMs, ...dependencies]);

  return optimizedHandler;
}

// 메모리 사용량 모니터링 훅
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// 렌더링 성능 측정 훅
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();

    if (lastRenderTime.current > 0) {
      const renderTime = now - lastRenderTime.current;
      renderTimes.current.push(renderTime);

      // 최근 10개 렌더링 시간만 유지
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }
    }

    lastRenderTime.current = now;
  });

  const getAverageRenderTime = useCallback(() => {
    const times = renderTimes.current;
    return times.length > 0
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;
  }, []);

  const logPerformance = useCallback(() => {
    console.log(`${componentName} Performance:`, {
      renderCount: renderCount.current,
      averageRenderTime: getAverageRenderTime(),
      recentRenderTimes: renderTimes.current,
    });
  }, [componentName, getAverageRenderTime]);

  return {
    renderCount: renderCount.current,
    averageRenderTime: getAverageRenderTime(),
    logPerformance,
  };
}

// 복잡한 계산을 위한 워커 스레드 훅
export function useWorker<T, R>(
  workerFunction: (_data: T) => R,
  dependencies: any[] = []
) {
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (data: T) => {
      setLoading(true);
      setError(null);

      try {
        // Web Worker가 지원되는지 확인
        if (typeof Worker !== 'undefined') {
          const workerCode = `
            self.onmessage = function(e) {
              const result = (${workerFunction.toString()})(e.data);
              self.postMessage(result);
            };
          `;

          const blob = new Blob([workerCode], {
            type: 'application/javascript',
          });
          const workerUrl = URL.createObjectURL(blob);
          const worker = new Worker(workerUrl);

          const promise = new Promise<R>((resolve, reject) => {
            worker.onmessage = e => {
              resolve(e.data);
            };
            worker.onerror = e => {
              reject(new Error(e.message));
            };
            worker.postMessage(data);
          });

          const result = await promise;
          worker.terminate();
          URL.revokeObjectURL(workerUrl);

          setResult(result);
        } else {
          // 폴백: 메인 스레드에서 실행
          const result = workerFunction(data);
          setResult(result);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workerFunction, ...dependencies]
  );

  return { result, loading, error, execute };
}
