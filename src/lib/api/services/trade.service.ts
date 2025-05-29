import { BaseApiClient } from '../core/base-client';
import type { PaginationParams, PaginatedResponse } from '../core/types';

export class TradeApiService extends BaseApiClient {
  constructor(customBaseURL?: string) {
    super(customBaseURL);
  }

  // Flash Trade 관련
  async getFlashTradeSettings(): Promise<any> {
    return this.get<any>('/api/flash-trade/settings');
  }

  async createFlashTrade(data: any): Promise<{ trade: any; message: string }> {
    return this.post<{ trade: any; message: string }>(
      '/api/flash-trade/create',
      data,
      {
        showSuccessToast: true,
      }
    );
  }

  async getActiveFlashTrades(): Promise<{ trades: any[] }> {
    return this.get<{ trades: any[] }>('/api/flash-trade/active');
  }

  async getFlashTradeHistory(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/flash-trade/history', params);
  }

  // Quick Trade 관련
  async getQuickTradeSettings(): Promise<any> {
    return this.get<any>('/api/quick-trade/settings');
  }

  async createQuickTrade(data: any): Promise<{ trade: any; message: string }> {
    return this.post<{ trade: any; message: string }>(
      '/api/quick-trade/create',
      data,
      {
        showSuccessToast: true,
      }
    );
  }

  async getActiveQuickTrades(): Promise<{ trades: any[] }> {
    return this.get<{ trades: any[] }>('/api/quick-trade/active');
  }

  async getQuickTradeHistory(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/quick-trade/history', params);
  }

  // 가격 정보
  async getPrice(
    pair: string
  ): Promise<{ price: number; data?: { price: number } }> {
    return this.get<{ price: number; data?: { price: number } }>(
      `/api/price/${pair}`
    );
  }

  // 레버리지 정보
  async getActiveLeverages(): Promise<{ leverages: any[] }> {
    return this.get<{ leverages: any[] }>('/api/leverages/active');
  }

  // Quant AI 관련
  async getQuantAiStrategies(): Promise<{ strategies: any[] }> {
    return this.get<{ strategies: any[] }>('/api/quant-ai/strategies');
  }

  async createQuantAiInvestment(data: any): Promise<{ investment: any; message: string }> {
    return this.post<{ investment: any; message: string }>(
      '/api/quant-ai/invest',
      data,
      {
        showSuccessToast: true,
      }
    );
  }

  async getQuantAiInvestments(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/quant-ai/investments', params);
  }

  async withdrawQuantAiInvestment(investmentId: number): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      `/api/quant-ai/investments/${investmentId}/withdraw`,
      undefined,
      {
        showSuccessToast: true,
      }
    );
  }

  // 통합 트레이딩 메서드들 (호환성)
  async getTradingSettings(): Promise<any> {
    return this.get<any>('/api/trading/settings');
  }

  async getActiveTrades(): Promise<{ trades: any[] }> {
    return this.get<{ trades: any[] }>('/api/trading/active');
  }

  async getTradeHistory(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/trading/history', params);
  }

  // 호환성을 위한 별칭 메서드
  async createQuantAIInvestment(data: any): Promise<{ investment: any; message: string }> {
    return this.createQuantAiInvestment(data);
  }

  // 시장 데이터 관련
  async getMarketData(symbol?: string): Promise<any> {
    const endpoint = symbol ? `/api/market/data/${symbol}` : '/api/market/data';
    return this.get<any>(endpoint);
  }

  async getCoinPrices(): Promise<{ prices: Record<string, number> }> {
    return this.get<{ prices: Record<string, number> }>('/api/market/prices');
  }

  // 거래 실행 관련
  async executeTrade(data: any): Promise<{ trade: any; message: string }> {
    return this.post<{ trade: any; message: string }>(
      '/api/trading/execute',
      data,
      {
        showSuccessToast: true,
      }
    );
  }

  async cancelTrade(tradeId: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/api/trading/${tradeId}`, {
      showSuccessToast: true,
    });
  }
} 