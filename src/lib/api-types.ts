// User related types
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'user' | 'admin' | 'superadmin';
  isActive: boolean;
  balance: string;
  createdAt: string;
  updatedAt: string;
  username?: string; // Some users might have a username
}

// KYC related types
export interface KycDocument {
  id: number;
  userId: string;
  documentType: string;
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl: string | null;
  selfieImageUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KycData {
  documents: KycDocument[];
  users: User[];
}

// Deposit related types
export interface Deposit {
  id: number;
  userId: string;
  username?: string;
  amount: string;
  coin: string;
  transactionHash: string | null;
  paymentMethod: string;
  proofImageUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Withdrawal related types
export interface Withdrawal {
  id: number;
  userId: string;
  username: string;
  amount: string;
  coin: string;
  destinationAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Flash Trade related types
export interface FlashTradeSetting {
  id: number;
  duration: number;
  returnRate: string;
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlashTrade {
  id: number;
  userId: string;
  username?: string;
  amount: string;
  direction: 'up' | 'down';
  duration: number;
  returnRate: string;
  entryPrice: string;
  potentialProfit: string;
  startTime: string;
  endTime: string;
  remainingTime?: number;
  result?: 'win' | 'lose' | null;
  resultAmount?: string;
}

// Bonus related types
export interface BonusProgram {
  id: string;
  name: string;
  description: string | null;
  bonusType: 'first_deposit' | 'referral' | 'special_promotion' | 'loyalty';
  bonusAmount: string;
  bonusUnit: 'percent' | 'fixed';
  conditions: BonusCondition[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BonusCondition {
  type: 'deposit_amount' | 'trading_volume' | 'time_period';
  value: string | number;
}

export interface UserBonus {
  id: string;
  userId: string;
  username: string;
  programId: string;
  programName: string;
  amount: string;
  originalBonusAmount: string;
  bonusUnit: 'percent' | 'fixed';
  requiredVolume: string;
  currentVolume: string;
  status: 'pending' | 'active' | 'completed' | 'expired' | 'cancelled';
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

// Security related types
export interface IpRestrictions {
  enabled: boolean;
  allowedCountries: string[];
  allowedIPs: string[];
  blockedIPs: string[];
}

export interface LoginHistory {
  id: number;
  userId: string;
  email: string | null;
  username: string | null;
  ipAddress: string;
  device: string | null;
  location: string | null;
  status: 'success' | 'failed';
  reason: string | null;
  timestamp: string;
}

// Coin related types
export interface Coin {
  id: number;
  name: string;
  symbol: string;
  logoUrl: string | null;
  isActive: boolean;
  withdrawalFee: string;
  minimumWithdrawal: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction related types
export interface Transaction {
  id: number;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'bonus' | 'system';
  amount: string;
  balance: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface UsersResponse {
  users: User[];
}

export interface KycResponse {
  documents: KycDocument[];
  users: User[];
}

export interface DepositsResponse {
  deposits: Deposit[];
}

export interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
}

export interface FlashTradeSettingsResponse {
  settings: FlashTradeSetting[];
}

export interface FlashTradesResponse {
  trades: FlashTrade[];
}

export interface BonusProgramsResponse {
  programs: BonusProgram[];
}

export interface UserBonusesResponse {
  userBonuses: UserBonus[];
}

export interface SecuritySettingsResponse {
  ipRestrictions: IpRestrictions;
}

export interface LoginHistoryResponse {
  recentLogins: LoginHistory[];
}

export interface CoinsResponse {
  coins: Coin[];
}

export interface TransactionsResponse {
  transactions: Transaction[];
}
