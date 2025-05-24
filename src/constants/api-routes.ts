/**
 * API 경로 상수 관리
 * 모든 API 엔드포인트를 중앙에서 관리하여 경로 일관성을 유지합니다.
 * 
 * 주의: 이 경로들은 baseURL과 조합되어 사용됩니다.
 * baseURL이 '/api'인 경우, 여기의 경로에는 '/api'를 포함하지 않습니다.
 */

// ===== 인증 관련 API =====
export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register', 
  LOGOUT: '/logout',
  REFRESH: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // 2FA 관련
  SETUP_2FA: '/auth/setup-2fa',
  ENABLE_2FA: '/auth/enable-2fa',
  DISABLE_2FA: '/auth/disable-2fa',
  VERIFY_2FA: '/auth/verify-2fa',
} as const;

// ===== 사용자 관련 API =====
export const USER_ROUTES = {
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  BALANCE: '/user/balance',
  TRANSACTIONS: '/user/transactions',
  UPLOAD_AVATAR: '/user/avatar',
  WITHDRAWAL_PASSWORD: '/user/withdrawal-password',
  VERIFY_WITHDRAWAL_PASSWORD: '/user/verify-withdrawal-password',
} as const;

// ===== 거래 관련 API =====
export const TRADE_ROUTES = {
  // 플래시 트레이딩
  FLASH_TRADE_SETTINGS: '/flash-trade/settings',
  CREATE_FLASH_TRADE: '/flash-trade/create',
  ACTIVE_FLASH_TRADES: '/flash-trade/active',
  FLASH_TRADE_HISTORY: '/flash-trade/history',
  
  // 퀵 트레이딩
  CREATE_QUICK_TRADE: '/quick-trade/create',
  ACTIVE_QUICK_TRADES: '/quick-trade/active',
  CLOSE_QUICK_TRADE: '/quick-trade/close',
  
  // 시세 정보
  PRICE: '/trade/price',
  LEVERAGES: '/trade/leverages',
} as const;

// ===== 관리자 관련 API =====
export const ADMIN_ROUTES = {
  DASHBOARD_STATS: '/admin/dashboard/stats',
  USERS: '/admin/users',
  UPDATE_USER: '/admin/users',
  DELETE_USER: '/admin/users',
  CREATE_USER: '/admin/users',
  
  // 예금/출금 관리
  DEPOSITS: '/admin/deposits',
  WITHDRAWALS: '/admin/withdrawals',
  APPROVE_DEPOSIT: '/admin/deposits/approve',
  REJECT_DEPOSIT: '/admin/deposits/reject',
  APPROVE_WITHDRAWAL: '/admin/withdrawals/approve',
  REJECT_WITHDRAWAL: '/admin/withdrawals/reject',
  
  // KYC 관리
  KYC_DOCUMENTS: '/admin/kyc/documents',
  APPROVE_KYC: '/admin/kyc/approve',
  REJECT_KYC: '/admin/kyc/reject',
  
  // 시스템 설정
  SYSTEM_SETTINGS: '/admin/settings',
  UPDATE_SYSTEM_SETTINGS: '/admin/settings',
  PLATFORM_SETTINGS: '/admin/platform/settings',
  
  // 플래시 트레이딩 관리
  FLASH_TRADE_SETTINGS_ADMIN: '/admin/flash-trade/settings',
  UPDATE_FLASH_TRADE_SETTINGS: '/admin/flash-trade/settings',
  ADD_FLASH_TRADE_SETTING: '/admin/flash-trade/settings',
  DELETE_FLASH_TRADE_SETTING: '/admin/flash-trade/settings',
  UPDATE_GLOBAL_WIN_RATE: '/admin/flash-trade/win-rate',
  FORCE_FLASH_TRADE_OUTCOME: '/admin/flash-trade/outcome',
  SET_USER_FLASH_TRADE_OUTCOME: '/admin/flash-trade/user-outcome',
  
  // 지원 티켓 관리
  SUPPORT_TICKETS: '/admin/support/tickets',
  
  // 사용자 잔액 조정
  ADJUST_USER_BALANCE: '/admin/users/adjust-balance',
  MANUAL_PAYOUT: '/admin/users/manual-payout',
  UPDATE_USER_STATUS: '/admin/users/status',
  SET_QUANT_AI_PERFORMANCE: '/admin/users/quant-ai-performance',
} as const;

// ===== 금융 관련 API =====
export const FINANCE_ROUTES = {
  DEPOSITS: '/finance/deposits',
  WITHDRAWALS: '/finance/withdrawals',
  CREATE_DEPOSIT: '/finance/deposits',
  CREATE_WITHDRAWAL: '/finance/withdrawals',
  SUPPORTED_COINS: '/finance/supported-coins',
} as const;

// ===== KYC 관련 API =====
export const KYC_ROUTES = {
  STATUS: '/kyc/status',
  SUBMIT_DOCUMENTS: '/kyc/documents',
  UPLOAD_DOCUMENTS: '/kyc/upload',
  UPLOAD_DOCUMENT: '/kyc/upload-document',
} as const;

// ===== 지원 관련 API =====
export const SUPPORT_ROUTES = {
  TICKETS: '/support/tickets',
  CREATE_TICKET: '/support/tickets',
  GET_TICKET: '/support/tickets',
  TICKET_MESSAGES: '/support/tickets/messages',
  SEND_MESSAGE: '/support/tickets/messages',
  ADD_MESSAGE: '/support/tickets/messages',
} as const;

// ===== 지갑 관련 API =====
export const WALLET_ROUTES = {
  BALANCE: '/wallet/balance',
  TRANSACTIONS: '/wallet/transactions',
  TRANSFER: '/wallet/transfer',
  DEPOSITS_BY_USER: '/wallet/deposits',
  WITHDRAWALS_BY_USER: '/wallet/withdrawals',
  ACTIVE_SUPPORTED_COINS: '/wallet/supported-coins',
  CREATE_DEPOSIT: '/wallet/deposits',
  CREATE_WITHDRAWAL: '/wallet/withdrawals',
} as const;

// ===== 보너스 관련 API =====
export const BONUS_ROUTES = {
  BONUSES: '/bonus/bonuses',
  USER_BONUSES: '/bonus/user-bonuses',
  BONUS_PROGRAMS: '/bonus/programs',
  CLAIM_BONUS: '/bonus/claim',
  BONUS_HISTORY: '/bonus/history',
  REDEEM_PROMOTION: '/bonus/redeem-promotion',
} as const;

// ===== 설정 관련 API =====
export const SETTINGS_ROUTES = {
  SETTINGS: '/settings',
  UPDATE_SETTINGS: '/settings',
  SECURITY_SETTINGS: '/settings/security',
  PUBLIC_SECURITY_SETTINGS: '/settings/security/public',
  UPDATE_SECURITY_SETTINGS: '/settings/security',
} as const;

// ===== 시스템 관련 API =====
export const SYSTEM_ROUTES = {
  HEALTH: '/health',
  TEST: '/test',
  ENV_CHECK: '/env-check',
  CSRF_TOKEN: '/csrf-token',
} as const;

// ===== 통합 API 경로 객체 =====
export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  USER: USER_ROUTES,
  TRADE: TRADE_ROUTES,
  ADMIN: ADMIN_ROUTES,
  FINANCE: FINANCE_ROUTES,
  KYC: KYC_ROUTES,
  SUPPORT: SUPPORT_ROUTES,
  WALLET: WALLET_ROUTES,
  BONUS: BONUS_ROUTES,
  SETTINGS: SETTINGS_ROUTES,
  SYSTEM: SYSTEM_ROUTES,
} as const;

// ===== 타입 정의 =====
export type AuthRoute = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES];
export type UserRoute = typeof USER_ROUTES[keyof typeof USER_ROUTES];
export type TradeRoute = typeof TRADE_ROUTES[keyof typeof TRADE_ROUTES];
export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];
export type FinanceRoute = typeof FINANCE_ROUTES[keyof typeof FINANCE_ROUTES];
export type KycRoute = typeof KYC_ROUTES[keyof typeof KYC_ROUTES];
export type SupportRoute = typeof SUPPORT_ROUTES[keyof typeof SUPPORT_ROUTES];
export type WalletRoute = typeof WALLET_ROUTES[keyof typeof WALLET_ROUTES];
export type BonusRoute = typeof BONUS_ROUTES[keyof typeof BONUS_ROUTES];
export type SettingsRoute = typeof SETTINGS_ROUTES[keyof typeof SETTINGS_ROUTES];
export type SystemRoute = typeof SYSTEM_ROUTES[keyof typeof SYSTEM_ROUTES];

export type ApiRoute = AuthRoute | UserRoute | TradeRoute | AdminRoute | 
  FinanceRoute | KycRoute | SupportRoute | WalletRoute | BonusRoute | 
  SettingsRoute | SystemRoute; 