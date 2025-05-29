import { toast } from '@/hooks/use-toast';
import { getApiBaseUrl, getApiConfig, logApiConfig } from '../../api-config';
import { ApiError, RequestOptions, PaginatedResponse, PaginationParams } from './types';

export class BaseApiClient {
  protected baseURL: string;
  protected defaultHeaders: Record<string, string>;
  protected timeout: number;
  private csrfToken: string | null = null;

  constructor() {
    this.baseURL = getApiBaseUrl();
    this.timeout = getApiConfig().timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // 개발 환경에서만 API 설정 로깅
    if (process.env.NODE_ENV === 'development') {
      logApiConfig();
    }
  }

  // 인증 토큰 가져오기 (쿠키에서)
  protected getAuthToken(): string | null {
    if (typeof document !== 'undefined') {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      return cookieValue || null;
    }
    return null;
  }

  // CSRF 토큰 가져오기 (쿠키에서)
  private getCSRFTokenFromCookie(): string | null {
    if (typeof document !== 'undefined') {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf-token='))
        ?.split('=')[1];
      return cookieValue || null;
    }
    return null;
  }

  // CSRF 토큰 가져오기 (서버에서)
  private async fetchCSRFToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
        return this.csrfToken;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
    return null;
  }

  // CSRF 토큰 확보 (캐시된 토큰 또는 새로 가져오기)
  private async ensureCSRFToken(): Promise<string | null> {
    // 쿠키에서 먼저 확인
    const tokenFromCookie = this.getCSRFTokenFromCookie();
    if (tokenFromCookie) {
      this.csrfToken = tokenFromCookie;
      return tokenFromCookie;
    }

    // 캐시된 토큰이 있으면 사용
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // 새로 가져오기
    return await this.fetchCSRFToken();
  }

  // 인증 토큰 설정 (쿠키로)
  setAuthToken(token: string, persistent: boolean = false) {
    if (typeof document !== 'undefined') {
      const maxAge = persistent ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30일 또는 1일
      const secure = window.location.protocol === 'https:';
      document.cookie = `auth_token=${token}; max-age=${maxAge}; path=/; ${secure ? 'secure;' : ''} samesite=lax`;
    }
  }

  // 인증 토큰 제거
  removeAuthToken() {
    if (typeof document !== 'undefined') {
      document.cookie =
        'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  }

  // 타임아웃 처리를 위한 AbortController
  private createAbortController(timeout: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller;
  }

  // 에러 응답 처리
  private async handleErrorResponse(
    response: Response,
    options: RequestOptions
  ): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode = response.status.toString();

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    // 에러 토스트 표시
    if (options.showErrorToast) {
      toast({
        title: '오류 발생',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // 기본 요청 메서드
  protected async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultHeaders, ...options };
    const url = `${this.baseURL}${endpoint}`;

    // 헤더 설정
    const headers: Record<string, string> = { ...opts };

    // 인증 토큰 추가
    if (opts.requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // CSRF 토큰 추가 (GET, HEAD, OPTIONS 제외)
    if (
      opts.requiresCSRF &&
      !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
    ) {
      const csrfToken = await this.ensureCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Content-Type 설정 (FormData가 아닌 경우)
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // AbortController 설정
    const controller = this.createAbortController(opts.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : JSON.stringify(body),
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, opts);
      }

      const data = await response.json();

      // 성공 토스트 표시
      if (opts.showSuccessToast && data.message) {
        toast({
          title: '성공',
          description: data.message,
        });
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // 네트워크 오류 또는 기타 오류
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      
      if (opts.showErrorToast) {
        toast({
          title: '네트워크 오류',
          description: message,
          variant: 'destructive',
        });
      }

      throw new ApiError(message, 0);
    }
  }

  // HTTP 메서드들
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestOptions
  ): Promise<T> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>('GET', endpoint + queryString, undefined, options);
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams & Record<string, any>,
    options?: RequestOptions
  ): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(endpoint, params, options);
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    _onProgress?: (_progress: number) => void,
    options?: Omit<RequestOptions, 'headers'>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>('POST', endpoint, formData, {
      ...options,
      headers: {}, // FormData는 브라우저가 자동으로 Content-Type 설정
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health', undefined, {
      requiresAuth: false,
      requiresCSRF: false,
      showErrorToast: false,
    });
  }
} 