import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import config, { API_ENDPOINTS, isDevelopment, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX_REQUESTS } from './config';
import { cacheManager } from './performance';

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// API 에러 타입 정의
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// 요청 인터셉터 타입
interface RequestInterceptor {
  onFulfilled?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
  onRejected?: (error: any) => any;
}

// 응답 인터셉터 타입
interface ResponseInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
  onRejected?: (error: AxiosError) => any;
}

class ApiClient {
  private client: AxiosInstance;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    this.client = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: config.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 인증 토큰 추가
        const token = this.getAuthToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 요청 ID 추가 (디버깅용)
        if (isDevelopment) {
          config.headers['X-Request-ID'] = this.generateRequestId();
        }

        // 요청 로깅
        if (isDevelopment) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        // 응답 로깅
        if (isDevelopment) {
          console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 401 에러 처리 (토큰 만료)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const token = this.getAuthToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // 네트워크 에러 재시도
        if (this.shouldRetry(error) && !originalRequest._retry) {
          originalRequest._retry = true;
          return this.retryRequest(originalRequest);
        }

        // 에러 로깅
        if (isDevelopment) {
          console.error('[API Response Error]', {
            status: error.response?.status,
            message: error.message,
            url: error.config?.url,
            data: error.response?.data,
          });
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post(API_ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: newRefreshToken } = response.data.data;
    
    localStorage.setItem('auth_token', access_token);
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    }
  }

  private handleAuthError(): void {
    // 토큰 제거
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');

    // 로그인 페이지로 리다이렉트
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    // 네트워크 에러 또는 5xx 서버 에러인 경우 재시도
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private async retryRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    for (let i = 0; i < this.retryAttempts; i++) {
      try {
        await this.delay(this.retryDelay * Math.pow(2, i)); // 지수 백오프
        return await this.client(config);
      } catch (error) {
        if (i === this.retryAttempts - 1) {
          throw error;
        }
      }
    }
    throw new Error('Max retry attempts reached');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeError(error: AxiosError): ApiError {
    const response = error.response;
    const data = response?.data as any;

    return {
      message: data?.message || data?.error || error.message || 'An error occurred',
      status: response?.status || 0,
      code: data?.code,
      details: data?.details || data?.errors,
    };
  }

  // 중복 요청 방지
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // GET 요청
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    options?: {
      cache?: boolean;
      cacheTTL?: number;
      deduplicate?: boolean;
    }
  ): Promise<ApiResponse<T>> {
    const cacheKey = options?.cache ? `get_${url}_${JSON.stringify(params)}` : null;
    
    // 캐시에서 확인
    if (cacheKey) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestFn = async () => {
      const response = await this.client.get<ApiResponse<T>>(url, { params });
      
      // 캐시에 저장
      if (cacheKey && response.data.success) {
        cacheManager.set(cacheKey, response.data, options?.cacheTTL);
      }
      
      return response.data;
    };

    // 중복 요청 방지
    if (options?.deduplicate) {
      const dedupeKey = `${url}_${JSON.stringify(params)}`;
      return this.deduplicateRequest(dedupeKey, requestFn);
    }

    return requestFn();
  }

  // POST 요청
  async post<T = any>(
    url: string,
    data?: any,
    options?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, options);
    return response.data;
  }

  // PUT 요청
  async put<T = any>(
    url: string,
    data?: any,
    options?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, options);
    return response.data;
  }

  // PATCH 요청
  async patch<T = any>(
    url: string,
    data?: any,
    options?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, options);
    return response.data;
  }

  // DELETE 요청
  async delete<T = any>(
    url: string,
    options?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, options);
    return response.data;
  }

  // 파일 업로드
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // 스트리밍 요청 (SSE)
  createEventSource(url: string, params?: Record<string, any>): EventSource {
    const searchParams = new URLSearchParams(params);
    const token = this.getAuthToken();
    
    if (token) {
      searchParams.append('token', token);
    }

    const fullUrl = `${config.API_BASE_URL}${url}?${searchParams.toString()}`;
    return new EventSource(fullUrl);
  }

  // WebSocket 연결
  createWebSocket(url: string, protocols?: string[]): WebSocket {
    const token = this.getAuthToken();
    const wsUrl = url.includes('?') 
      ? `${url}&token=${token}` 
      : `${url}?token=${token}`;
    
    return new WebSocket(wsUrl, protocols);
  }

  // 요청 취소
  createCancelToken() {
    return axios.CancelToken.source();
  }

  // 인터셉터 추가
  addRequestInterceptor(interceptor: RequestInterceptor) {
    return this.client.interceptors.request.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    );
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    return this.client.interceptors.response.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    );
  }

  // 인터셉터 제거
  removeRequestInterceptor(id: number) {
    this.client.interceptors.request.eject(id);
  }

  removeResponseInterceptor(id: number) {
    this.client.interceptors.response.eject(id);
  }

  // 캐시 관리
  clearCache() {
    cacheManager.clear();
  }

  // 요청 큐 정리
  clearRequestQueue() {
    this.requestQueue.clear();
  }

  // 헬스 체크
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', undefined, { cache: false });
      return true;
    } catch {
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
export const apiClient = new ApiClient();

// 편의 함수들
export const api = {
  // 인증 API
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    
    register: (userData: { email: string; password: string; name: string }) =>
      apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
    
    logout: () =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
    
    refreshToken: () =>
      apiClient.post(API_ENDPOINTS.AUTH.REFRESH),
    
    verifyEmail: (token: string) =>
      apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token }),
    
    resetPassword: (email: string) =>
      apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email }),
  },

  // 사용자 API
  user: {
    getProfile: () =>
      apiClient.get(API_ENDPOINTS.USER.PROFILE, undefined, { cache: true, cacheTTL: 300000 }),
    
    updateProfile: (data: any) =>
      apiClient.patch(API_ENDPOINTS.USER.PROFILE, data),
    
    getWallets: () =>
      apiClient.get(API_ENDPOINTS.USER.WALLETS, undefined, { cache: true, deduplicate: true }),
    
    getTransactions: (params?: any) =>
      apiClient.get(API_ENDPOINTS.USER.TRANSACTIONS, params),
    
    getOrders: (params?: any) =>
      apiClient.get(API_ENDPOINTS.USER.ORDERS, params),
    
    getTrades: (params?: any) =>
      apiClient.get(API_ENDPOINTS.USER.TRADES, params),
    
    submitKyc: (data: any) =>
      apiClient.post(API_ENDPOINTS.USER.KYC, data),
    
    getSettings: () =>
      apiClient.get(API_ENDPOINTS.USER.SETTINGS, undefined, { cache: true }),
    
    updateSettings: (data: any) =>
      apiClient.patch(API_ENDPOINTS.USER.SETTINGS, data),
  },

  // 거래 API
  trading: {
    getPairs: () =>
      apiClient.get(API_ENDPOINTS.TRADING.PAIRS, undefined, { cache: true, cacheTTL: 600000 }),
    
    createOrder: (data: any) =>
      apiClient.post(API_ENDPOINTS.TRADING.ORDERS, data),
    
    cancelOrder: (orderId: string) =>
      apiClient.delete(`${API_ENDPOINTS.TRADING.ORDERS}/${orderId}`),
    
    getOrderbook: (symbol: string) =>
      apiClient.get(API_ENDPOINTS.TRADING.ORDERBOOK, { symbol }, { deduplicate: true }),
    
    getTicker: (symbol?: string) =>
      apiClient.get(API_ENDPOINTS.TRADING.TICKER, symbol ? { symbol } : undefined, { cache: true, cacheTTL: 5000 }),
    
    getKlines: (symbol: string, interval: string, limit?: number) =>
      apiClient.get(API_ENDPOINTS.TRADING.KLINES, { symbol, interval, limit }, { cache: true, cacheTTL: 60000 }),
    
    quickTrade: (data: any) =>
      apiClient.post(API_ENDPOINTS.TRADING.QUICK_TRADE, data),
    
    flashTrade: (data: any) =>
      apiClient.post(API_ENDPOINTS.TRADING.FLASH_TRADE, data),
  },

  // 관리자 API
  admin: {
    getUsers: (params?: any) =>
      apiClient.get(API_ENDPOINTS.ADMIN.USERS, params),
    
    getDeposits: (params?: any) =>
      apiClient.get(API_ENDPOINTS.ADMIN.DEPOSITS, params),
    
    getWithdrawals: (params?: any) =>
      apiClient.get(API_ENDPOINTS.ADMIN.WITHDRAWALS, params),
    
    getKycRequests: (params?: any) =>
      apiClient.get(API_ENDPOINTS.ADMIN.KYC, params),
    
    getSupportTickets: (params?: any) =>
      apiClient.get(API_ENDPOINTS.ADMIN.SUPPORT_TICKETS, params),
    
    getAnalytics: (params?: any) =>
      apiClient.get(API_ENDPOINTS.ADMIN.ANALYTICS, params, { cache: true, cacheTTL: 300000 }),
    
    updateSettings: (data: any) =>
      apiClient.patch(API_ENDPOINTS.ADMIN.SETTINGS, data),
  },
};

export default apiClient; 