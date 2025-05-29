/**
 * 통합 트레이딩 모듈
 * FlashTrade, QuickTrade, QuantAI의 공통 로직을 추상화하여 코드 중복을 제거
 */

import { z } from 'zod';
import { tradeApi } from '@/lib/api-client';

// 공통 트레이딩 타입 정의
export interface BaseTradingConfig {
  id: string;
  name: string;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashTradeConfig extends BaseTradingConfig {
  type: 'flash';
  duration: number;
  returnRate: number;
  symbol: string;
}

export interface QuickTradeConfig extends BaseTradingConfig {
  type: 'quick';
  leverage: number;
  symbol: string;
  orderType: 'market' | 'limit';
}

export interface QuantAIConfig extends BaseTradingConfig {
  type: 'quant';
  strategy: 'conservative' | 'balanced' | 'aggressive';
  investmentPeriod: number;
  dailyReturnRate: number;
}

export type TradingConfig = FlashTradeConfig | QuickTradeConfig | QuantAIConfig;

// 공통 거래 결과 인터페이스
export interface BaseTradingResult {
  id: string;
  userId: string;
  type: 'flash' | 'quick' | 'quant';
  amount: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

export interface FlashTradeResult extends BaseTradingResult {
  type: 'flash';
  direction: 'up' | 'down';
  duration: number;
  entryPrice: number;
  exitPrice?: number;
  returnRate: number;
  potentialProfit: number;
  actualProfit?: number;
  outcome?: 'win' | 'lose';
}

export interface QuickTradeResult extends BaseTradingResult {
  type: 'quick';
  side: 'buy' | 'sell';
  leverage: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  symbol: string;
}

export interface QuantAIResult extends BaseTradingResult {
  type: 'quant';
  strategy: string;
  investmentPeriod: number;
  currentValue: number;
  totalReturn: number;
  dailyReturnRate: number;
}

export type TradingResult = FlashTradeResult | QuickTradeResult | QuantAIResult;

// 공통 검증 스키마
export const baseTradingSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least $1').max(100000, 'Amount too large'),
});

export const flashTradeSchema = baseTradingSchema.extend({
  direction: z.enum(['up', 'down']),
  duration: z.number().min(30).max(3600),
});

export const quickTradeSchema = baseTradingSchema.extend({
  side: z.enum(['buy', 'sell']),
  leverage: z.number().min(1).max(200),
  symbol: z.string().min(1),
  orderType: z.enum(['market', 'limit']).default('market'),
});

export const quantAISchema = baseTradingSchema.extend({
  strategy: z.enum(['conservative', 'balanced', 'aggressive']),
  investmentPeriod: z.number().min(1).max(365),
});

// 추상 트레이딩 서비스 클래스
export abstract class BaseTradingService<TConfig extends TradingConfig, TResult extends TradingResult> {
  protected abstract tradingType: string;

  // 공통 설정 조회
  async getConfigurations(): Promise<TConfig[]> {
    try {
      const response = await tradeApi.getTradingSettings();
      return response.settings || [];
    } catch (error) {
      console.error(`Failed to fetch ${this.tradingType} configurations:`, error);
      return [];
    }
  }

  // 공통 활성 거래 조회
  async getActiveTrades(userId: string): Promise<TResult[]> {
    try {
      const response = await tradeApi.getActiveTrades();
      return response.trades || [];
    } catch (error) {
      console.error(`Failed to fetch active ${this.tradingType} trades:`, error);
      return [];
    }
  }

  // 공통 거래 내역 조회
  async getTradeHistory(userId: string, limit = 50): Promise<TResult[]> {
    try {
      const response = await tradeApi.getTradeHistory({
        pageSize: limit
      });
      return response.data || [];
    } catch (error) {
      console.error(`Failed to fetch ${this.tradingType} trade history:`, error);
      return [];
    }
  }

  // 추상 메서드들 - 각 서비스에서 구현
  abstract validateTradeData(data: any): boolean;
  abstract createTrade(data: any): Promise<TResult>;
  abstract calculatePotentialProfit(config: TConfig, amount: number): number;
  abstract getDefaultConfiguration(): TConfig;
}

// Flash Trade 서비스
export class FlashTradingService extends BaseTradingService<FlashTradeConfig, FlashTradeResult> {
  protected tradingType = 'flash';

  validateTradeData(data: any): boolean {
    try {
      flashTradeSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  async createTrade(data: z.infer<typeof flashTradeSchema>): Promise<FlashTradeResult> {
    const response = await tradeApi.createFlashTrade(data);
    return response.trade;
  }

  calculatePotentialProfit(config: FlashTradeConfig, amount: number): number {
    return amount * (config.returnRate / 100);
  }

  getDefaultConfiguration(): FlashTradeConfig {
    return {
      id: 'default-flash',
      name: 'Default Flash Trade',
      type: 'flash',
      duration: 60,
      returnRate: 85,
      minAmount: 5,
      maxAmount: 1000,
      symbol: 'BTC/USDT',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Quick Trade 서비스
export class QuickTradingService extends BaseTradingService<QuickTradeConfig, QuickTradeResult> {
  protected tradingType = 'quick';

  validateTradeData(data: any): boolean {
    try {
      quickTradeSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  async createTrade(data: z.infer<typeof quickTradeSchema>): Promise<QuickTradeResult> {
    const response = await tradeApi.createQuickTrade(data);
    return response.trade;
  }

  calculatePotentialProfit(config: QuickTradeConfig, amount: number): number {
    // Quick Trade는 레버리지와 가격 변동에 따라 계산
    return amount * config.leverage * 0.01; // 1% 기본 수익률 가정
  }

  getDefaultConfiguration(): QuickTradeConfig {
    return {
      id: 'default-quick',
      name: 'Default Quick Trade',
      type: 'quick',
      leverage: 10,
      symbol: 'BTC/USDT',
      orderType: 'market',
      minAmount: 10,
      maxAmount: 5000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Quant AI 서비스
export class QuantAIService extends BaseTradingService<QuantAIConfig, QuantAIResult> {
  protected tradingType = 'quant';

  validateTradeData(data: any): boolean {
    try {
      quantAISchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  async createTrade(data: z.infer<typeof quantAISchema>): Promise<QuantAIResult> {
    const response = await tradeApi.createQuantAIInvestment(data);
    return response.investment;
  }

  calculatePotentialProfit(config: QuantAIConfig, amount: number): number {
    return amount * (config.dailyReturnRate / 100) * config.investmentPeriod;
  }

  getDefaultConfiguration(): QuantAIConfig {
    return {
      id: 'default-quant',
      name: 'Default Quant AI',
      type: 'quant',
      strategy: 'balanced',
      investmentPeriod: 30,
      dailyReturnRate: 0.5,
      minAmount: 100,
      maxAmount: 10000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// 트레이딩 팩토리
export class TradingServiceFactory {
  private static instances = new Map<string, BaseTradingService<any, any>>();

  static getService(type: 'flash'): FlashTradingService;
  static getService(type: 'quick'): QuickTradingService;
  static getService(type: 'quant'): QuantAIService;
  static getService(type: string): BaseTradingService<any, any> {
    if (!this.instances.has(type)) {
      switch (type) {
        case 'flash':
          this.instances.set(type, new FlashTradingService());
          break;
        case 'quick':
          this.instances.set(type, new QuickTradingService());
          break;
        case 'quant':
          this.instances.set(type, new QuantAIService());
          break;
        default:
          throw new Error(`Unknown trading service type: ${type}`);
      }
    }
    return this.instances.get(type)!;
  }
}

// 공통 훅 생성기
export function createTradingHooks<TConfig extends TradingConfig, TResult extends TradingResult>(
  service: BaseTradingService<TConfig, TResult>
) {
  return {
    useConfigurations: () => {
      // React Query 훅 구현
      // 실제 구현에서는 useQuery를 사용
    },
    useActiveTrades: (userId: string) => {
      // React Query 훅 구현
    },
    useTradeHistory: (userId: string, limit?: number) => {
      // React Query 훅 구현
    },
    useCreateTrade: () => {
      // React Query mutation 훅 구현
    },
  };
}

// 유틸리티 함수들
export const TradingUtils = {
  formatAmount: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  },

  formatPercentage: (value: number): string => {
    return `${value.toFixed(2)}%`;
  },

  calculateROI: (initialAmount: number, finalAmount: number): number => {
    return ((finalAmount - initialAmount) / initialAmount) * 100;
  },

  validateTradingAmount: (amount: number, config: TradingConfig): boolean => {
    return amount >= config.minAmount && amount <= config.maxAmount;
  },

  getTradingTypeDisplayName: (type: string): string => {
    const names = {
      flash: 'Flash Trade',
      quick: 'Quick Trade',
      quant: 'Quant AI',
    };
    return names[type as keyof typeof names] || type;
  },
};

// 에러 클래스들
export class TradingError extends Error {
  constructor(
    message: string,
    public code: string,
    public tradingType: string
  ) {
    super(message);
    this.name = 'TradingError';
  }
}

export class InsufficientBalanceError extends TradingError {
  constructor(tradingType: string, requiredAmount: number, availableBalance: number) {
    super(
      `Insufficient balance for ${tradingType}. Required: $${requiredAmount}, Available: $${availableBalance}`,
      'INSUFFICIENT_BALANCE',
      tradingType
    );
  }
}

export class InvalidConfigurationError extends TradingError {
  constructor(tradingType: string, reason: string) {
    super(
      `Invalid ${tradingType} configuration: ${reason}`,
      'INVALID_CONFIGURATION',
      tradingType
    );
  }
}

export class TradingNotAllowedError extends TradingError {
  constructor(tradingType: string, reason: string) {
    super(
      `${tradingType} not allowed: ${reason}`,
      'TRADING_NOT_ALLOWED',
      tradingType
    );
  }
} 