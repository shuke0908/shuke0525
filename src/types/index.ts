// ===== 기본 타입들 =====
export interface BaseEntity {
  id: number;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface PaginationParams {
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string | undefined;
  data?: T | undefined;
  error?: string | undefined;
}

// ===== 보안 설정 타입들 =====
export interface SecuritySettings {
  captchaEnabled: boolean;
  captchaType?: 'recaptcha_v2' | null | undefined;
  recaptchaSiteKey?: string | undefined;
  twoFactorRequired: boolean;
  enableGlobal2FA?: boolean | undefined;
  maxLoginAttempts: number;
  loginAttemptLimit?: number | undefined;
  lockoutDurationMinutes?: number | undefined;
  sessionTimeout: number;
  sessionDurationMinutes?: number | undefined;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  ipWhitelistEnabled: boolean;
  withdrawalConfirmationRequired: boolean;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
  ipRestrictions?:
    | {
        enabled?: boolean | undefined;
        allowedCountries?: string[] | undefined;
        allowedIPs?: string[] | undefined;
        blockedIPs?: string[] | undefined;
      }
    | undefined;
}

// ===== 사용자 프로필 타입들 =====
export interface UserProfile extends BaseEntity {
  email: string;
  username: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  bio?: string | undefined;
  balance: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  isActive: boolean;
  role: 'user' | 'admin';
  lastLogin?: string | undefined;
  registrationDate: string;
  country?: string | undefined;
  phoneNumber?: string | undefined;
  profileImage?: string | undefined;
  twoFactorEnabled: boolean;
  isTwoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  withdrawalPassword?: string | undefined;
}

// ===== 지원되는 코인 타입들 =====
export interface SupportedCoin {
  id: number;
  symbol: string;
  name: string;
  network: string;
  contractAddress?: string | undefined;
  decimals: number;
  minDeposit: string;
  minWithdrawal: string;
  withdrawalFee: string;
  isActive: boolean;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  icon?: string | undefined;
  explorerUrl?: string | undefined;
  depositAddress?: string | undefined;
  qrCodeImage?: string | undefined;
}

// ===== 사용자 관련 타입들 =====
export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  balance: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  isActive: boolean;
  role: 'user' | 'admin';
  lastLogin?: string | undefined;
  registrationDate: string;
  country?: string | undefined;
  phoneNumber?: string | undefined;
  profileImage?: string | undefined;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  withdrawalPassword?: string | undefined;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  balance: string;
  role: 'user' | 'admin';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  isActive: boolean;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean | undefined;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  country?: string | undefined;
  phoneNumber?: string | undefined;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

// ===== 거래 관련 타입들 =====
export interface Transaction extends BaseEntity {
  userId: number;
  type:
    | 'deposit'
    | 'withdrawal'
    | 'trade_profit'
    | 'trade_loss'
    | 'bonus'
    | 'fee';
  amount: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  description?: string | undefined;
  reference?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface QuickTrade extends BaseEntity {
  userId: number;
  symbol: string;
  amount: string;
  direction: 'buy' | 'sell';
  entryPrice: string;
  exitPrice?: string | undefined;
  profit?: string | undefined;
  status: 'active' | 'completed' | 'cancelled';
  openTime: string;
  closeTime?: string | undefined;
}

export interface FlashTrade extends BaseEntity {
  userId: number;
  symbol: string;
  amount: string;
  direction: 'up' | 'down';
  duration: number;
  returnRate: string;
  entryPrice: string;
  exitPrice?: string | undefined;
  potentialProfit: string;
  actualProfit?: string | undefined;
  status: 'active' | 'completed' | 'expired';
  startTime: string;
  endTime?: string | undefined;
  remainingTime?: number | undefined;
}

export interface FlashTradeSetting extends BaseEntity {
  duration: number;
  returnRate: string;
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
}

export interface Investment extends BaseEntity {
  userId: number;
  strategy: string;
  amount: string;
  duration: number;
  dailyReturn: string;
  totalReturn: string;
  currentValue: string;
  startDate: string;
  endDate: string;
  daysCompleted: number;
  status: 'active' | 'completed' | 'cancelled';
  dailyReturnHistory?: any[] | undefined;
}

// ===== 암호화폐 관련 타입들 =====
export interface CryptoRate {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_24h?: number | undefined;
  price_change_percentage_24h?: number | undefined;
  market_cap?: number | undefined;
  volume_24h?: number | undefined;
}

export interface MarketData {
  symbol: string;
  price: string;
  change24h: string;
  changePercent24h: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  lastUpdated: string;
}

// ===== 관리자 관련 타입들 =====
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: string;
  totalWithdrawals: string;
  totalTrades: number;
  activeTrades: number;
  pendingKyc: number;
  totalProfit: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  kycRequired: boolean;
  withdrawalEnabled: boolean;
  tradingEnabled: boolean;
  minDepositAmount: string;
  maxWithdrawalAmount: string;
  withdrawalFeePercent: string;
  tradingFeePercent: string;
}

// ===== KYC 관련 타입들 =====
export interface KycDocument {
  id: number;
  userId: number;
  type: 'identity' | 'address' | 'selfie';
  filename: string;
  originalName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | undefined;
  uploadedAt: string;
  reviewedAt?: string | undefined;
  reviewedBy?: number | undefined;
}

export interface KycData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  idNumber: string;
  idType: 'passport' | 'id_card' | 'drivers_license';
}

// ===== 알림 관련 타입들 =====
export interface Notification extends BaseEntity {
  userId?: number | undefined; // null이면 전체 공지
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  isGlobal: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string | undefined;
  expiresAt?: string | undefined;
}

// ===== 보너스 관련 타입들 =====
export interface Bonus extends BaseEntity {
  userId: number;
  type: 'welcome' | 'deposit' | 'referral' | 'loyalty' | 'promotion';
  amount: string;
  description: string;
  status: 'pending' | 'active' | 'used' | 'expired';
  conditions?: string | undefined;
  validUntil?: string | undefined;
  usedAt?: string | undefined;
  expirationDate?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

// ===== 폼 관련 타입들 =====
export interface FormFieldProps {
  label: string;
  name: string;
  type?: string | undefined;
  placeholder?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  error?: string | undefined;
  _value?: any | undefined;
  onChange?: ((_value: any) => void) | undefined;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  children: React.ReactNode;
}

// ===== 에러 관련 타입들 =====
export interface ApiError {
  message: string;
  code?: string | undefined;
  statusCode?: number | undefined;
  details?: Record<string, any> | undefined;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ===== 차트 관련 타입들 =====
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string | undefined;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartDataPoint[];
  colors?: string[] | undefined;
  title?: string | undefined;
  xAxisLabel?: string | undefined;
  yAxisLabel?: string | undefined;
}

// ===== WebSocket 관련 타입들 =====
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string | undefined;
}

export interface MarketUpdate extends WebSocketMessage {
  type: 'market_update';
  data: {
    symbol: string;
    price: string;
    change: string;
    volume: string;
  };
}

export interface TradeUpdate extends WebSocketMessage {
  type: 'trade_update';
  data: {
    tradeId: number;
    status: string;
    profit?: string | undefined;
  };
}

// ===== 유틸리티 타입들 =====
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ===== 상수 타입들 =====
export const USER_ROLES = ['user', 'admin'] as const;
export const KYC_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'not_submitted',
] as const;
export const TRANSACTION_TYPES = [
  'deposit',
  'withdrawal',
  'trade_profit',
  'trade_loss',
  'bonus',
  'fee',
] as const;
export const TRANSACTION_STATUSES = [
  'pending',
  'completed',
  'cancelled',
  'failed',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type KycStatus = (typeof KYC_STATUSES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
