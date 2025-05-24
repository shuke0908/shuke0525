// 간소화된 거래 로직
export interface FlashTradeConfig {
  amount: number;
  direction: 'up' | 'down';
  duration: number; // 초 단위
}

export interface FlashTradeResult {
  tradeId: number;
  result: 'win' | 'lose';
  profit: number;
  finalPrice?: number;
  initialPrice?: number;
}

export interface QuantAiConfig {
  strategy: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  duration: number; // 일 단위
}

export interface QuantAiResult {
  investmentId: number;
  performance: number; // 퍼센트
  totalReturn: number;
  status: 'active' | 'completed';
}

// 관리자 설정 기반 Flash Trade 결과 생성
export class SimplifiedFlashTradeLogic {
  /**
   * Flash Trade 생성 및 즉시 결과 계산
   * 실제 시장 데이터 대신 관리자 설정을 기반으로 결과 결정
   */
  static createFlashTrade(
    config: FlashTradeConfig,
    userSettings?: {
      winRate?: number; // 0-100
      maxProfit?: number; // 퍼센트
      maxLoss?: number; // 퍼센트
    }
  ): FlashTradeResult {
    const tradeId = Date.now(); // 간단한 ID 생성

    // 기본 설정
    const defaultSettings = {
      winRate: 50, // 50% 승률
      maxProfit: 85, // 최대 85% 수익
      maxLoss: 100, // 100% 손실 (투자금 전액)
    };

    const settings = { ...defaultSettings, ...userSettings };

    // 랜덤하게 승부 결정 (관리자 설정 승률 기반)
    const isWin = Math.random() * 100 < settings.winRate;

    let profit: number;

    if (isWin) {
      // 승리 시: 투자금의 일정 비율 수익
      const profitRate = Math.random() * (settings.maxProfit / 100);
      profit = config.amount * profitRate;
    } else {
      // 패배 시: 투자금 전액 손실
      profit = -config.amount;
    }

    // 가상의 가격 데이터 (실제로는 사용하지 않음)
    const initialPrice = 100 + Math.random() * 50;
    const priceChange =
      config.direction === 'up'
        ? isWin
          ? Math.random() * 5
          : -Math.random() * 5
        : isWin
          ? -Math.random() * 5
          : Math.random() * 5;
    const finalPrice = initialPrice + priceChange;

    return {
      tradeId,
      result: isWin ? 'win' : 'lose',
      profit: Math.round(profit * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      initialPrice: Math.round(initialPrice * 100) / 100,
    };
  }

  /**
   * 활성 거래 상태 업데이트 (WebSocket으로 전송할 데이터)
   */
  static generateTradeUpdate(
    tradeId: number,
    config: FlashTradeConfig,
    elapsedTime: number
  ): {
    tradeId: number;
    remainingTime: number;
    currentPrice: number;
    direction: 'up' | 'down';
    status: 'active' | 'completed';
  } {
    const remainingTime = Math.max(0, config.duration - elapsedTime);
    const status = remainingTime > 0 ? 'active' : 'completed';

    // 가상의 현재 가격 (실제 거래 결과와는 무관)
    const basePrice = 100;
    const volatility = Math.sin(Date.now() / 1000) * 2;
    const currentPrice = basePrice + volatility + Math.random() * 0.5;

    return {
      tradeId,
      remainingTime,
      currentPrice: Math.round(currentPrice * 100) / 100,
      direction: config.direction,
      status,
    };
  }
}

// 간소화된 Quant AI 로직
export class SimplifiedQuantAiLogic {
  /**
   * Quant AI 투자 생성
   * 복잡한 AI 알고리즘 대신 관리자 설정 패턴을 따름
   */
  static createQuantAiInvestment(
    config: QuantAiConfig,
    performancePattern?: {
      dailyReturnRange: [number, number]; // 일일 수익률 범위
      volatility: number; // 변동성
      successProbability: number; // 성공 확률
    }
  ): QuantAiResult {
    const investmentId = Date.now();

    // 기본 성과 패턴
    const defaultPattern = {
      dailyReturnRange: [-2, 3] as [number, number], // 일일 -2% ~ +3%
      volatility: 1.5,
      successProbability: 0.65, // 65% 성공률
    };

    const pattern = { ...defaultPattern, ...performancePattern };

    // 리스크 레벨에 따른 조정
    const riskMultipliers = {
      low: { return: 0.7, volatility: 0.5 },
      medium: { return: 1.0, volatility: 1.0 },
      high: { return: 1.5, volatility: 2.0 },
    };

    const multiplier = riskMultipliers[config.riskLevel];

    // 간단한 성과 계산 (실제로는 일별로 계산하지만 여기서는 즉시 계산)
    const avgDailyReturn =
      (pattern.dailyReturnRange[0] + pattern.dailyReturnRange[1]) / 2;
    const adjustedReturn = avgDailyReturn * multiplier.return;

    // 기간에 따른 복리 계산 (단순화)
    const totalPerformance = adjustedReturn * config.duration * 0.8; // 약간의 감소 적용

    // 변동성 적용
    const volatilityAdjustment =
      (Math.random() - 0.5) * pattern.volatility * multiplier.volatility;
    const finalPerformance = totalPerformance + volatilityAdjustment;

    const totalReturn = config.amount * (finalPerformance / 100);

    return {
      investmentId,
      performance: Math.round(finalPerformance * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      status: 'active',
    };
  }

  /**
   * Quant AI 일일 성과 업데이트
   */
  static updateDailyPerformance(
    investmentId: number,
    currentPerformance: number,
    _daysPassed: number,
    pattern?: {
      dailyReturnRange: [number, number];
      volatility: number;
    }
  ): {
    investmentId: number;
    dailyReturn: number;
    cumulativeReturn: number;
    status: 'active' | 'completed';
  } {
    const defaultPattern = {
      dailyReturnRange: [-2, 3] as [number, number],
      volatility: 1.5,
    };

    const actualPattern = { ...defaultPattern, ...pattern };

    // 오늘의 수익률 계산
    const baseReturn =
      actualPattern.dailyReturnRange[0] +
      Math.random() *
        (actualPattern.dailyReturnRange[1] - actualPattern.dailyReturnRange[0]);

    const volatilityAdjustment =
      (Math.random() - 0.5) * actualPattern.volatility;
    const dailyReturn = baseReturn + volatilityAdjustment;

    // 누적 수익률 업데이트
    const newCumulativeReturn = currentPerformance + dailyReturn;

    return {
      investmentId,
      dailyReturn: Math.round(dailyReturn * 100) / 100,
      cumulativeReturn: Math.round(newCumulativeReturn * 100) / 100,
      status: 'active',
    };
  }
}

// 관리자 설정 적용을 위한 유틸리티
export class AdminTradeSettings {
  /**
   * 사용자별 Flash Trade 설정 적용
   */
  static applyUserSettings(
    _userId: string,
    baseConfig: FlashTradeConfig,
    adminSettings?: {
      winRate?: number;
      maxProfit?: number;
      forceResult?: 'win' | 'lose';
    }
  ): FlashTradeResult {
    // 관리자가 결과를 강제로 설정한 경우
    if (adminSettings?.forceResult) {
      const profit =
        adminSettings.forceResult === 'win'
          ? baseConfig.amount * 0.85 // 85% 수익
          : -baseConfig.amount; // 전액 손실

      return {
        tradeId: Date.now(),
        result: adminSettings.forceResult,
        profit,
        finalPrice: 100 + (adminSettings.forceResult === 'win' ? 5 : -5),
        initialPrice: 100,
      };
    }

    // 일반적인 설정 적용
    return SimplifiedFlashTradeLogic.createFlashTrade(
      baseConfig,
      adminSettings
    );
  }

  /**
   * 사용자별 Quant AI 성과 패턴 적용
   */
  static applyQuantAiPattern(
    _userId: string,
    baseConfig: QuantAiConfig,
    adminPattern?: {
      targetPerformance?: number; // 목표 수익률
      performanceSchedule?: Array<{ day: number; performance: number }>;
    }
  ): QuantAiResult {
    // 관리자가 성과 스케줄을 설정한 경우
    if (adminPattern?.performanceSchedule) {
      const totalPerformance = adminPattern.performanceSchedule.reduce(
        (sum, item) => sum + item.performance,
        0
      );

      return {
        investmentId: Date.now(),
        performance: totalPerformance,
        totalReturn: baseConfig.amount * (totalPerformance / 100),
        status: 'active',
      };
    }

    // 목표 수익률이 설정된 경우
    if (adminPattern?.targetPerformance !== undefined) {
      return {
        investmentId: Date.now(),
        performance: adminPattern.targetPerformance,
        totalReturn: baseConfig.amount * (adminPattern.targetPerformance / 100),
        status: 'active',
      };
    }

    // 기본 로직 적용
    return SimplifiedQuantAiLogic.createQuantAiInvestment(baseConfig);
  }
}
