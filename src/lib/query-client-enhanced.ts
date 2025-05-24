import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Performance monitoring
interface QueryMetrics {
  queryKey: string;
  duration: number;
  timestamp: number;
  status: 'success' | 'error' | 'loading';
  cacheHit?: boolean;
}

class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 1000;

  logQuery(metric: QueryMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

const performanceMonitor = new QueryPerformanceMonitor();

// Query Client 생성
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('Query error:', error, 'Query:', query.queryKey);
    },
    onSuccess: (_data, query) => {
      const queryKey = Array.isArray(query.queryKey) 
        ? query.queryKey.join('-') 
        : String(query.queryKey);
      
      performanceMonitor.logQuery({
        queryKey,
        duration: Date.now() - (query.state.dataUpdatedAt || Date.now()),
        timestamp: Date.now(),
        status: 'success',
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Mutation error:', error);
    },
    onSuccess: (data) => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      console.log('Mutation success:', data);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// 사전 정의된 쿼리들
export const queries = {
  // 인증 관련
  auth: {
    profile: () => ({
      queryKey: ['auth', 'profile'] as const,
      queryFn: async () => {
        const { authApi } = await import('./api-client-unified');
        return authApi.getProfile();
      },
      staleTime: 5 * 60 * 1000,
    }),
    balance: () => ({
      queryKey: ['auth', 'balance'] as const,
      queryFn: async () => {
        const { userApi } = await import('./api-client-unified');
        return userApi.getBalance();
      },
      staleTime: 30 * 1000, // 30초
    }),
  },
};

// 퍼포먼스 유틸리티
export const queryPerformance = {
  getMetrics: () => performanceMonitor.getMetrics(),
  clearMetrics: () => performanceMonitor.clearMetrics(),
  
  // 느린 쿼리 감지
  getSlowQueries: (threshold = 1000) => {
    return performanceMonitor
      .getMetrics()
      .filter(metric => metric.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  },
  
  // 쿼리 성공률
  getSuccessRate: () => {
    const metrics = performanceMonitor.getMetrics();
    if (metrics.length === 0) return 0;
    
    const successCount = metrics.filter(m => m.status === 'success').length;
    return (successCount / metrics.length) * 100;
  },
};

// 캐시 유틸리티
export const cacheUtils = {
  // 특정 패턴의 쿼리 무효화
  invalidateQueries: (pattern: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = Array.isArray(query.queryKey) 
          ? query.queryKey.join('-') 
          : String(query.queryKey);
        return key.includes(pattern);
      },
    });
  },
  
  // 캐시 크기 정보
  getCacheInfo: () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cacheSize: JSON.stringify(queryCache).length, // 대략적인 크기
    };
  },
  
  // 오래된 캐시 정리
  cleanup: () => {
    queryClient.getQueryCache().clear();
    queryClient.getMutationCache().clear();
  },
};

export { performanceMonitor };
export default queryClient;
