/**
 * 통합 API 엔트리 포인트
 * 모든 API 호출은 이 파일을 통해 이루어집니다.
 */

import {
  UnifiedApiClient,
  AuthApiService,
  UserApiService,
  TradeApiService,
  AdminApiService,
  FinanceService,
  KycService,
  SupportService,
  WalletService,
  BonusService,
  SettingsService,
} from './api-client-unified';

import type { ApiResponse } from './api-client-unified';

// 통합 API 클라이언트 인스턴스 생성
const apiClient = new UnifiedApiClient();

// 서비스 인스턴스들 생성
const authService = new AuthApiService(apiClient);
const userService = new UserApiService(apiClient);
const tradeService = new TradeApiService(apiClient);
const adminService = new AdminApiService(apiClient);
const financeService = new FinanceService(apiClient);
const kycService = new KycService(apiClient);
const supportService = new SupportService(apiClient);
const walletService = new WalletService(apiClient);
const bonusService = new BonusService(apiClient);
const settingsService = new SettingsService(apiClient);

// 통합 API 객체 - 모든 서비스에 접근 가능
export const api = {
  auth: authService,
  user: userService,
  trade: tradeService,
  admin: adminService,
  finance: financeService,
  kyc: kycService,
  support: supportService,
  wallet: walletService,
  bonus: bonusService,
  settings: settingsService,

  // 직접 클라이언트 접근 (필요한 경우)
  client: apiClient,
} as const;

// 개별 서비스 export (호환성을 위해)
export const authApi = authService;
export const userApi = userService;
export const tradeApi = tradeService;
export const adminApi = adminService;
export const financeApi = financeService;
export const kycApi = kycService;
export const supportApi = supportService;
export const walletApi = walletService;
export const bonusApi = bonusService;
export const settingsApi = settingsService;

// 기존 호환성을 위한 타입 export
export type { ApiResponse };

// 기본 export
export default api;
