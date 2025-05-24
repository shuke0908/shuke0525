import { QueryClient, type QueryFunction } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { UnifiedApiClient, ApiError } from './api-client-unified';
import { logApiConfig } from './api-config';

// 통합 API 클라이언트 인스턴스 생성 (환경변수 기반 동적 URL)
export const apiClient = new UnifiedApiClient();

// 개발 환경에서만 API 설정 정보 출력
if (process.env.NODE_ENV === 'development') {
  logApiConfig();
}

// 하위 호환성을 위한 re-export
export { apiClient as apiRequest };

type QueryFnOptions = {
  on401?: 'throw' | 'returnNull' | 'redirect';
};

const defaultQueryFnOptions: QueryFnOptions = {
  on401: 'throw',
};

export function getQueryFn<T>(
  options: QueryFnOptions = {}
): QueryFunction<T, readonly unknown[]> {
  const opts = { ...defaultQueryFnOptions, ...options };

  return async function queryFn({ queryKey }): Promise<T> {
    const [endpoint] = queryKey as string[];

    // endpoint가 undefined인 경우 처리
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint in queryKey');
    }

    try {
      const result = await apiClient.get<T>(
        endpoint,
        {},
        {
          showErrorToast: false, // QueryClient에서 별도로 에러 처리
        }
      );

      // 결과가 undefined인 경우 에러 throw
      if (result === undefined) {
        throw new Error('API request returned undefined');
      }

      return result;
    } catch (error) {
      // Special handling for 401 Unauthorized
      if (error instanceof ApiError && error._status === 401) {
        switch (opts.on401) {
          case 'returnNull':
            // QueryFunction은 undefined를 반환할 수 없으므로 에러를 throw
            throw new Error('Unauthorized access');
          case 'redirect':
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw new Error('Redirecting to login');
          case 'throw':
          default:
            throw error;
        }
      }

      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
      queryFn: getQueryFn(),
    },
    mutations: {
      onError: error => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    },
  },
});
