import { toast } from "@/hooks/use-toast";
import { QueryClient } from "@tanstack/react-query";

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  showErrorToast?: boolean;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
};

const defaultOptions: RequestOptions = {
  showErrorToast: true,
  headers: {
    'Content-Type': 'application/json',
  },
  requiresAuth: true,
};

export async function apiRequest<T>(
  method: string,
  url: string,
  body?: any,
  options: RequestOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  
  const fetchOptions: RequestInit = {
    method,
    headers: opts.headers,
    credentials: opts.requiresAuth ? 'include' : undefined,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to fetch: ${response.statusText}`;
      
      if (opts.showErrorToast) {
        toast({
          title: `Error ${response.status}`,
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      throw new ApiError(errorMessage, response.status);
    }
    
    // For 204 No Content responses, return empty object
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    if (opts.showErrorToast) {
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    throw new ApiError(errorMessage, 0);
  }
}

export function handleApiError(error: unknown, fallbackMessage: string = "An unexpected error occurred"): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallbackMessage;
}

export function invalidateQueries(queryClient: QueryClient, queryKeys: string | string[]): void {
  const keys = Array.isArray(queryKeys) ? queryKeys : [queryKeys];
  
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}

export async function makeApiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { 
    method = 'GET', 
    data, 
    headers: customHeaders, 
    includeAuth = true,
    timeout = 30000 
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  
  // 헤더 구성 (undefined 값 제거)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  // 인증 토큰 추가
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // fetch 옵션 구성 (undefined 값 제거)
  const fetchOptions: RequestInit = {
    method,
    headers
  };

  // credentials 추가 (undefined가 아닌 경우에만)
  if (includeAuth) {
    fetchOptions.credentials = 'include';
  }

  // body 추가
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        await response.text()
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0,
      String(error)
    );
  }
}