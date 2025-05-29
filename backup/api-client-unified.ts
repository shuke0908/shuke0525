/**
 * 통합 API 클라이언트
 * 모든 API 호출을 하나의 클라이언트로 통일
 * CSRF 보호 포함, 환경변수 기반 동적 URL 설정
 */

import { toast } from '@/hooks/use-toast';
import { getApiBaseUrl, getCurrentConfig, logApiConfig } from './api-config';
import type {
  UserProfile,
  SupportedCoin,
  SecuritySettings,
} from '@/types';

// 기본 타입 정의
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public _status: number,
    public _code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API 클라이언트 설정
interface RequestOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  requiresCSRF?: boolean;
  timeout?: number;
}

export class UnifiedApiClient {
  private baseURL: string;
  private defaultOptions: RequestOptions;
  private csrfToken: string | null = null;

  constructor(customBaseURL?: string) {
    // 환경변수 기반 동적 기본 URL 설정
    this.baseURL = customBaseURL || getApiBaseUrl();
    
    const config = getCurrentConfig();
    this.defaultOptions = {
      showErrorToast: config.enableErrorToast,
      showSuccessToast: config.enableSuccessToast,
      requiresAuth: true,
      requiresCSRF: true,
      timeout: config.timeout,
      headers: { ...config.headers },
    };

    // 개발 환경에서 API 설정 로깅
    if (process.env.NODE_ENV === 'development') {
      logApiConfig();
      console.log('🚀 UnifiedApiClient initialized with baseURL:', this.baseURL);
    }
  }

  // 인증 토큰 가져오기 (쿠키에서)
  private getAuthToken(): string | null {
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

  // 기본 요청 메서드
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const url = `${this.baseURL}${endpoint}`;

    // 헤더 설정
    const headers: Record<string, string> = { ...opts.headers };

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

    // AbortController 설정
    const controller = this.createAbortController(opts.timeout!);

    // Fetch 옵션 구성
    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: 'include', // 쿠키 포함
      signal: controller.signal,
    };

    // Body 추가 (GET, HEAD 요청이 아닌 경우)
    if (body && !['GET', 'HEAD'].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(body);
    }

    // 개발 환경에서 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${method.toUpperCase()} ${url}`, {
        body,
        headers: {
          ...headers,
          'X-CSRF-Token': headers['X-CSRF-Token'] ? '[REDACTED]' : undefined,
        },
      });
    }

    try {
      const response = await fetch(url, fetchOptions);

      // 응답 처리
      if (!response.ok) {
        await this.handleErrorResponse(response, opts);
      }

      // 성공 응답 처리
      let result: T;

      // 204 No Content 응답 처리
      if (response.status === 204) {
        result = {} as T;
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const jsonData = await response.json();
          // ApiResponse 형태인지 확인하고 data 필드 추출
          result = jsonData.data !== undefined ? jsonData.data : jsonData;
        } else {
          result = (await response.text()) as unknown as T;
        }
      }

      // 개발 환경에서 응답 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Response: ${response.status}`, result);
      }

      // 성공 토스트 표시
      if (opts.showSuccessToast && method !== 'GET') {
        toast({
          title: '성공',
          description: '요청이 성공적으로 처리되었습니다.',
          variant: 'default',
        });
      }

      return result;
    } catch (error) {
      // 네트워크 오류 또는 타임아웃 처리
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('요청 시간이 초과되었습니다.', 408);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';

      throw new ApiError(errorMessage, 0);
    }
  }

  // 에러 응답 처리
  private async handleErrorResponse(
    response: Response,
    options: RequestOptions
  ): Promise<never> {
    let errorMessage = `${response.status} ${response.statusText}`;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    // 401 Unauthorized 처리
    if (response.status === 401) {
      // 인증 토큰 제거
      this.removeAuthToken();

      // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닌 경우)
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.href = '/login';
      }
    }

    // 403 CSRF 토큰 오류 처리
    if (response.status === 403 && errorCode === 'CSRF_TOKEN_INVALID') {
      // CSRF 토큰 캐시 무효화
      this.csrfToken = null;

      // 새 CSRF 토큰 가져오기
      await this.fetchCSRFToken();

      errorMessage =
        'CSRF 보안 토큰이 만료되었습니다. 페이지를 새로고침해주세요.';
    }

    // 에러 토스트 표시
    if (options.showErrorToast) {
      toast({
        title: `오류 ${response.status}`,
        description: errorMessage,
        variant: 'destructive',
      });
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // HTTP 메서드별 편의 함수들
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestOptions
  ): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params)}`
      : endpoint;
    return this.request<T>('GET', url, undefined, {
      ...options,
      requiresCSRF: false,
    });
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

  // 페이지네이션 지원 GET 요청
  async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams & Record<string, any>,
    options?: RequestOptions
  ): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(endpoint, params, options);
  }

  // 파일 업로드 지원
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
        formData.append(key, String(value));
      });
    }

    const opts = { ...this.defaultOptions, ...options };
    const url = `${this.baseURL}${endpoint}`;
    const token = opts.requiresAuth ? this.getAuthToken() : null;

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // CSRF 토큰 추가
    if (opts.requiresCSRF) {
      const csrfToken = await this.ensureCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const controller = this.createAbortController(opts.timeout!);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, opts);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('파일 업로드 시간이 초과되었습니다.', 408);
      }
      throw error;
    }
  }

  // 헬스 체크
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>(
      '/health',
      {},
      {
        requiresAuth: false,
        requiresCSRF: false,
        showErrorToast: false,
      }
    );
  }
}

// 싱글톤 인스턴스 생성
export const apiClient = new UnifiedApiClient();

// 관리자 액션 타입 정의
export interface AdminAction {
  action: string;
  params: Record<string, any>;
}

// 인증 API 서비스
export class AuthApiService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
    captchaToken?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const response = await this.client.post<{
      user: UserProfile;
      token: string;
    }>('/auth/login', credentials, {
      requiresAuth: false,
      showSuccessToast: true,
    });

    // 토큰을 쿠키에 저장
    if (response.token) {
      this.client.setAuthToken(response.token, credentials.rememberMe);
    }

    return response;
  }

  async register(userData: any): Promise<{ user: UserProfile; token: string }> {
    return this.client.post<{ user: UserProfile; token: string }>(
      '/auth/register',
      userData,
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );
  }

  async logout(): Promise<void> {
    await this.client.post(
      '/auth/logout',
      {},
      {
        showSuccessToast: true,
      }
    );
    this.client.removeAuthToken();
  }

  async getProfile(): Promise<UserProfile> {
    return this.client.get<UserProfile>('/auth/profile');
  }

  async refreshToken(): Promise<{ token: string }> {
    return this.client.post<{ token: string }>('/auth/refresh');
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      '/auth/forgot-password',
      { email },
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      '/auth/reset-password',
      { token, password },
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      '/auth/verify-email',
      { token },
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );
  }

  async verifyTwoFactor(token: string): Promise<{ verified: boolean }> {
    return this.client.post<{ verified: boolean }>('/auth/verify-2fa', {
      token,
    });
  }

  async setup2FA(): Promise<{ qrCode: string; secret: string }> {
    return this.client.post<{ qrCode: string; secret: string }>(
      '/auth/setup-2fa'
    );
  }

  async enable2FA(token: string): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/auth/enable-2fa', { token });
  }

  async disable2FA(token: string): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/auth/disable-2fa', {
      token,
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/auth/change-password', data);
  }
}

// 사용자 API 서비스
export class UserApiService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getProfile(): Promise<UserProfile> {
    return this.client.get<UserProfile>('/user/profile');
  }

  async updateProfile(data: any): Promise<UserProfile> {
    return this.client.put<UserProfile>('/user/profile', data);
  }

  async getTransactions(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/user/transactions', params);
  }

  async getBalance(): Promise<{ balance: string }> {
    return this.client.get<{ balance: string }>('/user/balance');
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/user/change-password', data);
  }

  async uploadAvatar(
    file: File,
    _onProgress?: (_progress: number) => void
  ): Promise<{ url: string }> {
    return this.client.uploadFile<{ url: string }>(
      '/user/avatar',
      file,
      {},
      _onProgress
    );
  }

  async setWithdrawalPassword(payload: {
    newWithdrawalPassword: string;
    confirmNewWithdrawalPassword: string;
    currentPassword?: string;
  }): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      '/user/withdrawal-password',
      payload,
      {
        showSuccessToast: true,
      }
    );
  }

  async verifyWithdrawalPassword(
    password: string
  ): Promise<{ verified: boolean }> {
    return this.client.post<{ verified: boolean }>(
      '/user/verify-withdrawal-password',
      { password }
    );
  }

  async getKycStatus(): Promise<{ status: string; documents: any[] }> {
    return this.client.get<{ status: string; documents: any[] }>(
      '/user/kyc-status'
    );
  }

  async submitIdVerification(file: File): Promise<{ message: string }> {
    return this.client.uploadFile<{ message: string }>(
      '/user/kyc/id-verification',
      file
    );
  }

  async submitAddressVerification(file: File): Promise<{ message: string }> {
    return this.client.uploadFile<{ message: string }>(
      '/user/kyc/address-verification',
      file
    );
  }

  async getAdminUsers(): Promise<{ users: any[] }> {
    return this.client.get<{ users: any[] }>('/admin/users');
  }

  // Investment related methods
  async getActiveInvestments(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.get('/api/user/investments/active', { params });
  }

  async getInvestmentHistory(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.get('/api/user/investments/history', { params });
  }
}

// 거래 API 서비스
export class TradeApiService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getFlashTradeSettings(): Promise<any> {
    return this.client.get<any>('/flash-trade/settings');
  }

  async createFlashTrade(data: any): Promise<{ trade: any; message: string }> {
    return this.client.post<{ trade: any; message: string }>(
      '/flash-trade/create',
      data
    );
  }

  async getActiveFlashTrades(): Promise<{ trades: any[] }> {
    return this.client.get<{ trades: any[] }>('/flash-trade/active');
  }

  async getFlashTradeHistory(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/flash-trade/history', params);
  }

  async createQuickTrade(data: any): Promise<{ trade: any; message: string }> {
    return this.client.post<{ trade: any; message: string }>(
      '/quick-trade/create',
      data
    );
  }

  async getActiveQuickTrades(): Promise<{ trades: any[] }> {
    return this.client.get<{ trades: any[] }>('/quick-trade/positions');
  }

  async closeQuickTrade(tradeId: number): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      `/trade/quick-trade/${tradeId}/close`
    );
  }

  async getPrice(
    pair: string
  ): Promise<{ price: number; data?: { price: number } }> {
    return this.client.get<{ price: number; data?: { price: number } }>(
      `/trade/price/${pair}`
    );
  }

  async getActiveLeverages(): Promise<{ leverages: any[] }> {
    return this.client.get<{ leverages: any[] }>('/trade/leverages');
  }
}

// 관리자 API 서비스
export class AdminApiService {
  public client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  // 통합 관리자 액션 API
  async executeAction(action: AdminAction) {
    return this.client.post('/admin/actions', action);
  }

  // 편의 메서드들 - 통합 액션 API를 사용하여 구현
  async setFlashTradeResult(tradeId: number, result: 'win' | 'lose') {
    return this.executeAction({
      action: 'set_flash_trade_result',
      params: { tradeId, result },
    });
  }

  async adjustUserBalance(
    userId: string,
    amount: number,
    type: 'add' | 'subtract',
    reason: string
  ) {
    return this.executeAction({
      action: 'adjust_user_balance',
      params: { userId, amount, type, reason },
    });
  }

  async approveDeposit(depositId: number) {
    return this.executeAction({
      action: 'approve_deposit',
      params: { depositId },
    });
  }

  async rejectDeposit(depositId: number, reason: string) {
    return this.executeAction({
      action: 'reject_deposit',
      params: { depositId, reason },
    });
  }

  async approveWithdrawal(withdrawalId: number) {
    return this.executeAction({
      action: 'approve_withdrawal',
      params: { withdrawalId },
    });
  }

  async rejectWithdrawal(withdrawalId: number, reason: string) {
    return this.executeAction({
      action: 'reject_withdrawal',
      params: { withdrawalId, reason },
    });
  }

  async approveKyc(userId: number, data?: any) {
    return this.executeAction({
      action: 'approve_kyc',
      params: { userId, ...data },
    });
  }

  async rejectKyc(userId: number, reason: string) {
    return this.executeAction({
      action: 'reject_kyc',
      params: { userId, reason },
    });
  }

  async updateUserStatus(
    userId: number,
    status: 'active' | 'suspended' | 'banned'
  ) {
    return this.executeAction({
      action: 'update_user_status',
      params: { userId, status },
    });
  }

  async setQuantAiPerformance(userId: number, performanceConfig: any) {
    return this.executeAction({
      action: 'set_quant_ai_performance',
      params: { userId, performanceConfig },
    });
  }

  async manualPayout(userId: number, amount: number, reason: string) {
    return this.executeAction({
      action: 'manual_payout',
      params: { userId, amount, reason },
    });
  }

  async updateSystemSettings(settings: Record<string, any>) {
    return this.executeAction({
      action: 'update_system_settings',
      params: { settings },
    });
  }

  // 기존 메서드들 (변경 없음)
  async getDashboardStats() {
    return this.client.get('/admin/dashboard/stats');
  }

  async getUsers(
    params?: PaginationParams & {
      search?: string;
      status?: string;
      role?: string;
    }
  ) {
    return this.client.getPaginated('/admin/users', params);
  }

  async updateUser(userId: number, data: any) {
    return this.client.put(`/admin/users/${userId}`, data);
  }

  async deleteUser(userId: number) {
    return this.client.delete(`/admin/users/${userId}`);
  }

  async getSystemSettings() {
    return this.client.get('/admin/settings');
  }

  async getKycDocuments(params?: PaginationParams) {
    return this.client.getPaginated('/admin/kyc', params);
  }

  async getDeposits(params?: PaginationParams) {
    return this.client.getPaginated('/admin/deposits', params);
  }

  async getWithdrawals(params?: PaginationParams) {
    return this.client.getPaginated('/admin/withdrawals', params);
  }

  async getFlashTrades(params?: PaginationParams) {
    return this.client.getPaginated('/admin/flash-trades', params);
  }

  async getSupportTickets(params?: PaginationParams) {
    return this.client.getPaginated('/admin/support-tickets', params);
  }

  async createUser(userData: any) {
    return this.client.post('/admin/users', userData);
  }

  async updateFlashTradeSettings(userId: number, settings: any) {
    return this.client.put(
      `/admin/users/${userId}/flash-trade-settings`,
      settings
    );
  }

  async addFlashTradeSetting(setting: any) {
    return this.client.post('/admin/flash-trade-settings', setting);
  }

  async updateFlashTradeSetting(id: number, setting: any) {
    return this.client.put(`/admin/flash-trade-settings/${id}`, setting);
  }

  async deleteFlashTradeSetting(id: number) {
    return this.client.delete(`/admin/flash-trade-settings/${id}`);
  }

  async updateGlobalWinRate(winRate: number) {
    return this.client.put('/admin/global-win-rate', { winRate });
  }

  async forceFlashTradeOutcome(tradeId: number, outcome: 'win' | 'lose') {
    return this.client.post(`/admin/flash-trades/${tradeId}/force-outcome`, {
      outcome,
    });
  }

  async setUserFlashTradeOutcome(userId: number, outcomeMode: string) {
    return this.client.put(`/admin/users/${userId}/flash-trade-outcome`, {
      outcomeMode,
    });
  }

  async getPlatformSettings() {
    return this.client.get('/admin/platform-settings');
  }

  async getActiveFlashTrades() {
    return this.client.get('/admin/flash-trades/active');
  }

  async getFlashTradeSettings() {
    return this.client.get('/admin/flash-trade/settings');
  }
}

// 금융 API 서비스
export class FinanceService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getDeposits(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/finance/deposits', params);
  }

  async getWithdrawals(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/finance/withdrawals', params);
  }

  async createDeposit(data: any): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/finance/deposits', data);
  }

  async createWithdrawal(data: any): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/finance/withdrawals', data);
  }

  async getSupportedCoins(): Promise<{ coins: SupportedCoin[] }> {
    return this.client.get<{ coins: SupportedCoin[] }>(
      '/finance/supported-coins'
    );
  }
}

// KYC API 서비스
export class KycService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getKycStatus(): Promise<{ status: string; documents: any[] }> {
    return this.client.get<{ status: string; documents: any[] }>('/kyc/status');
  }

  async getStatus(): Promise<{ status: string; documents: any[] }> {
    return this.client.get<{ status: string; documents: any[] }>('/kyc/status');
  }

  async submitKycDocuments(data: any): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/kyc/documents', data);
  }

  async uploadDocuments(formData: FormData): Promise<{ message: string }> {
    return this.client.uploadFile<{ message: string }>(
      '/kyc/upload',
      formData as any
    );
  }

  async uploadKycDocument(
    file: File,
    type: string,
    _onProgress?: (_progress: number) => void
  ): Promise<{ message: string }> {
    return this.client.uploadFile<{ message: string }>(
      `/kyc/upload/${type}`,
      file,
      {},
      _onProgress
    );
  }
}

// 지원 API 서비스
export class SupportService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getTickets(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/support/tickets', params);
  }

  async createTicket(data: any): Promise<{ ticket: any; message: string }> {
    return this.client.post<{ ticket: any; message: string }>(
      '/support/tickets',
      data
    );
  }

  async getTicket(ticketId: number): Promise<any> {
    return this.client.get<any>(`/support/tickets/${ticketId}`);
  }

  async getTicketMessages(ticketId: number): Promise<{ messages: any[] }> {
    return this.client.get<{ messages: any[] }>(
      `/support/tickets/${ticketId}/messages`
    );
  }

  async getMessages(ticketId: number): Promise<any> {
    return this.client.get<any>(`/support/tickets/${ticketId}/messages`);
  }

  async sendMessage(
    ticketId: number,
    message: string
  ): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      `/support/tickets/${ticketId}/messages`,
      { message }
    );
  }

  async addMessage(
    ticketId: number,
    data: { message: string }
  ): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      `/support/tickets/${ticketId}/messages`,
      data
    );
  }
}

// 지갑 API 서비스
export class WalletService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getBalance(): Promise<{ balance: string }> {
    return this.client.get<{ balance: string }>('/wallet/balance');
  }

  async getTransactions(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/wallet/transactions', params);
  }

  async transfer(data: any): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/wallet/transfer', data);
  }

  async getDepositsByUserId(userId: string): Promise<{ deposits: any[] }> {
    return this.client.get<{ deposits: any[] }>(`/wallet/deposits/${userId}`);
  }

  async getWithdrawalsByUserId(
    userId: string
  ): Promise<{ withdrawals: any[] }> {
    return this.client.get<{ withdrawals: any[] }>(
      `/wallet/withdrawals/${userId}`
    );
  }

  async getActiveSupportedCoins(): Promise<{ coins: SupportedCoin[] }> {
    return this.client.get<{ coins: SupportedCoin[] }>(
      '/wallet/supported-coins'
    );
  }

  async createDeposit(formData: FormData): Promise<{ message: string }> {
    return this.client.uploadFile<{ message: string }>(
      '/wallet/deposit',
      formData as any
    );
  }

  async createWithdrawal(data: any): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/wallet/withdrawal', data);
  }
}

// 보너스 API 서비스
export class BonusService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getBonuses(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/bonuses', params);
  }

  async getUserBonuses(): Promise<{ bonuses: any[] }> {
    return this.client.get<{ bonuses: any[] }>('/bonuses/user');
  }

  async getBonusPrograms(): Promise<{ programs: any[] }> {
    return this.client.get<{ programs: any[] }>('/bonuses/programs');
  }

  async claimBonus(bonusId: number): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(`/bonuses/${bonusId}/claim`);
  }

  async getBonusHistory(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.client.getPaginated<any>('/bonuses/history', params);
  }

  async redeemPromotion(code: string): Promise<{ message: string }> {
    return this.client.post<{ message: string }>('/bonuses/redeem', { code });
  }
}

// 설정 API 서비스
export class SettingsService {
  private client: UnifiedApiClient;

  constructor(client: UnifiedApiClient) {
    this.client = client;
  }

  async getSettings(): Promise<any> {
    return this.client.get<any>('/settings');
  }

  async updateSettings(data: any): Promise<{ message: string }> {
    return this.client.put<{ message: string }>('/settings', data);
  }

  async getSecuritySettings(): Promise<SecuritySettings> {
    return this.client.get<SecuritySettings>('/settings/security');
  }

  async getPublicSecuritySettings(): Promise<SecuritySettings> {
    return this.client.get<SecuritySettings>(
      '/settings/security/public',
      {},
      {
        requiresAuth: false,
      }
    );
  }

  async updateSecuritySettings(data: any): Promise<{ message: string }> {
    return this.client.put<{ message: string }>('/settings/security', data);
  }
}

// 서비스 인스턴스들
export const authApi = new AuthApiService(apiClient);
export const userApi = new UserApiService(apiClient);
export const tradeApi = new TradeApiService(apiClient);
export const adminApi = new AdminApiService(apiClient);
export const financeApi = new FinanceService(apiClient);
export const kycApi = new KycService(apiClient);
export const supportApi = new SupportService(apiClient);
export const walletApi = new WalletService(apiClient);
export const bonusApi = new BonusService(apiClient);
export const settingsApi = new SettingsService(apiClient);

// 편의 함수들 (기존 apiRequest와의 호환성 유지)
export async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<T> {
  const client = apiClient;

  switch (method.toUpperCase()) {
    case 'GET':
      return client.get<T>(endpoint, body, options);
    case 'POST':
      return client.post<T>(endpoint, body, options);
    case 'PUT':
      return client.put<T>(endpoint, body, options);
    case 'PATCH':
      return client.patch<T>(endpoint, body, options);
    case 'DELETE':
      return client.delete<T>(endpoint, options);
    default:
      throw new Error(`지원하지 않는 HTTP 메서드: ${method}`);
  }
}

// 기본 export
export default apiClient;

// 타입 export
export type { RequestOptions };
