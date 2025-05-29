/**
 * 위험 관리 시스템
 * 사용자별 거래 한도, 이상 거래 탐지, 자동 위험 조정
 */

import { EventEmitter } from 'events';

// 위험 레벨 정의
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 위험 유형 정의
export enum RiskType {
  TRADING_VOLUME = 'trading_volume',
  TRADING_FREQUENCY = 'trading_frequency',
  LOSS_STREAK = 'loss_streak',
  LARGE_POSITION = 'large_position',
  UNUSUAL_PATTERN = 'unusual_pattern',
  RAPID_TRADING = 'rapid_trading',
  BALANCE_ANOMALY = 'balance_anomaly',
  WITHDRAWAL_PATTERN = 'withdrawal_pattern'
}

// 사용자 위험 프로필
export interface UserRiskProfile {
  userId: string;
  riskLevel: RiskLevel;
  dailyTradingLimit: number;
  weeklyTradingLimit: number;
  monthlyTradingLimit: number;
  maxPositionSize: number;
  maxLeverage: number;
  allowedTradingTypes: string[];
  isRestricted: boolean;
  restrictionReason?: string;
  restrictionUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 거래 한도 설정
export interface TradingLimits {
  userId: string;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  weeklyUsed: number;
  monthlyUsed: number;
  lastResetDaily: Date;
  lastResetWeekly: Date;
  lastResetMonthly: Date;
}

// 위험 이벤트
export interface RiskEvent {
  id: string;
  userId: string;
  type: RiskType;
  level: RiskLevel;
  description: string;
  data: any;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  actions: RiskAction[];
}

// 위험 조치
export interface RiskAction {
  type: 'warning' | 'limit_reduction' | 'trading_suspension' | 'account_review' | 'manual_review';
  description: string;
  appliedAt: Date;
  appliedBy: string;
  parameters?: any;
}

// 거래 패턴 분석
export interface TradingPattern {
  userId: string;
  avgDailyTrades: number;
  avgTradeSize: number;
  winRate: number;
  maxConsecutiveLosses: number;
  tradingHours: number[];
  preferredAssets: string[];
  riskScore: number;
  lastAnalyzed: Date;
}

// 위험 관리 설정
export interface RiskManagementConfig {
  maxDailyTrades: number;
  maxTradeSize: number;
  maxConsecutiveLosses: number;
  suspiciousVolumeThreshold: number;
  rapidTradingThreshold: number;
  autoSuspensionEnabled: boolean;
  alertThresholds: {
    [key in RiskLevel]: number;
  };
}

// 위험 관리 시스템 클래스
export class RiskManagementSystem extends EventEmitter {
  private userProfiles = new Map<string, UserRiskProfile>();
  private tradingLimits = new Map<string, TradingLimits>();
  private riskEvents = new Map<string, RiskEvent>();
  private tradingPatterns = new Map<string, TradingPattern>();
  private config: RiskManagementConfig;

  constructor(config?: Partial<RiskManagementConfig>) {
    super();
    
    this.config = {
      maxDailyTrades: 100,
      maxTradeSize: 10000,
      maxConsecutiveLosses: 5,
      suspiciousVolumeThreshold: 50000,
      rapidTradingThreshold: 10, // 10분 내 거래 수
      autoSuspensionEnabled: true,
      alertThresholds: {
        [RiskLevel.LOW]: 0.3,
        [RiskLevel.MEDIUM]: 0.6,
        [RiskLevel.HIGH]: 0.8,
        [RiskLevel.CRITICAL]: 0.95,
      },
      ...config,
    };

    this.setupPeriodicTasks();
  }

  // 사용자 위험 프로필 생성/업데이트
  setUserRiskProfile(profile: UserRiskProfile): void {
    this.userProfiles.set(profile.userId, profile);
    this.emit('profile_updated', profile);
  }

  // 사용자 위험 프로필 조회
  getUserRiskProfile(userId: string): UserRiskProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  // 거래 한도 초기화
  initializeTradingLimits(userId: string, limits: Partial<TradingLimits>): void {
    const now = new Date();
    const tradingLimit: TradingLimits = {
      userId,
      dailyLimit: limits.dailyLimit || 1000,
      weeklyLimit: limits.weeklyLimit || 5000,
      monthlyLimit: limits.monthlyLimit || 20000,
      dailyUsed: 0,
      weeklyUsed: 0,
      monthlyUsed: 0,
      lastResetDaily: now,
      lastResetWeekly: now,
      lastResetMonthly: now,
      ...limits,
    };

    this.tradingLimits.set(userId, tradingLimit);
  }

  // 거래 전 위험 검증
  async validateTradeRisk(userId: string, tradeData: {
    amount: number;
    type: string;
    leverage?: number;
    symbol?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    riskLevel: RiskLevel;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let riskLevel = RiskLevel.LOW;

    // 사용자 프로필 확인
    const profile = this.getUserRiskProfile(userId);
    if (!profile) {
      return {
        allowed: false,
        reason: 'User risk profile not found',
        riskLevel: RiskLevel.CRITICAL,
        warnings: [],
      };
    }

    // 계정 제한 확인
    if (profile.isRestricted) {
      if (profile.restrictionUntil && profile.restrictionUntil > new Date()) {
        return {
          allowed: false,
          reason: `Account restricted until ${profile.restrictionUntil.toISOString()}`,
          riskLevel: RiskLevel.CRITICAL,
          warnings: [],
        };
      }
    }

    // 거래 한도 확인
    const limitCheck = await this.checkTradingLimits(userId, tradeData.amount);
    if (!limitCheck.allowed) {
      return {
        allowed: false,
        reason: limitCheck.reason,
        riskLevel: RiskLevel.HIGH,
        warnings: [],
      };
    }

    // 포지션 크기 확인
    if (tradeData.amount > profile.maxPositionSize) {
      return {
        allowed: false,
        reason: `Trade amount exceeds maximum position size (${profile.maxPositionSize})`,
        riskLevel: RiskLevel.HIGH,
        warnings: [],
      };
    }

    // 레버리지 확인
    if (tradeData.leverage && tradeData.leverage > profile.maxLeverage) {
      return {
        allowed: false,
        reason: `Leverage exceeds maximum allowed (${profile.maxLeverage})`,
        riskLevel: RiskLevel.HIGH,
        warnings: [],
      };
    }

    // 거래 유형 확인
    if (!profile.allowedTradingTypes.includes(tradeData.type)) {
      return {
        allowed: false,
        reason: `Trading type ${tradeData.type} not allowed for this user`,
        riskLevel: RiskLevel.MEDIUM,
        warnings: [],
      };
    }

    // 패턴 분석
    const patternRisk = await this.analyzePatternRisk(userId, tradeData);
    riskLevel = Math.max(riskLevel as any, patternRisk.level as any) as RiskLevel;
    warnings.push(...patternRisk.warnings);

    // 빈도 분석
    const frequencyRisk = await this.analyzeFrequencyRisk(userId);
    riskLevel = Math.max(riskLevel as any, frequencyRisk.level as any) as RiskLevel;
    warnings.push(...frequencyRisk.warnings);

    return {
      allowed: true,
      riskLevel,
      warnings,
    };
  }

  // 거래 한도 확인
  private async checkTradingLimits(userId: string, amount: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    let limits = this.tradingLimits.get(userId);
    if (!limits) {
      // 기본 한도로 초기화
      this.initializeTradingLimits(userId, {});
      limits = this.tradingLimits.get(userId)!;
    }

    // 한도 리셋 확인
    this.resetLimitsIfNeeded(limits);

    // 일일 한도 확인
    if (limits.dailyUsed + amount > limits.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily trading limit exceeded (${limits.dailyLimit})`,
      };
    }

    // 주간 한도 확인
    if (limits.weeklyUsed + amount > limits.weeklyLimit) {
      return {
        allowed: false,
        reason: `Weekly trading limit exceeded (${limits.weeklyLimit})`,
      };
    }

    // 월간 한도 확인
    if (limits.monthlyUsed + amount > limits.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly trading limit exceeded (${limits.monthlyLimit})`,
      };
    }

    return { allowed: true };
  }

  // 거래 후 한도 업데이트
  updateTradingLimits(userId: string, amount: number): void {
    const limits = this.tradingLimits.get(userId);
    if (!limits) return;

    limits.dailyUsed += amount;
    limits.weeklyUsed += amount;
    limits.monthlyUsed += amount;

    this.tradingLimits.set(userId, limits);
  }

  // 한도 리셋 확인
  private resetLimitsIfNeeded(limits: TradingLimits): void {
    const now = new Date();

    // 일일 리셋
    if (this.isDifferentDay(limits.lastResetDaily, now)) {
      limits.dailyUsed = 0;
      limits.lastResetDaily = now;
    }

    // 주간 리셋
    if (this.isDifferentWeek(limits.lastResetWeekly, now)) {
      limits.weeklyUsed = 0;
      limits.lastResetWeekly = now;
    }

    // 월간 리셋
    if (this.isDifferentMonth(limits.lastResetMonthly, now)) {
      limits.monthlyUsed = 0;
      limits.lastResetMonthly = now;
    }
  }

  // 패턴 위험 분석
  private async analyzePatternRisk(userId: string, tradeData: any): Promise<{
    level: RiskLevel;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let level = RiskLevel.LOW;

    const pattern = this.tradingPatterns.get(userId);
    if (!pattern) {
      return { level, warnings };
    }

    // 비정상적으로 큰 거래
    if (tradeData.amount > pattern.avgTradeSize * 5) {
      level = RiskLevel.HIGH;
      warnings.push('Trade size significantly larger than average');
    }

    // 연속 손실 후 큰 거래
    if (pattern.maxConsecutiveLosses >= this.config.maxConsecutiveLosses && 
        tradeData.amount > pattern.avgTradeSize * 2) {
      level = RiskLevel.HIGH;
      warnings.push('Large trade after consecutive losses');
    }

    // 낮은 승률에서 큰 거래
    if (pattern.winRate < 0.3 && tradeData.amount > pattern.avgTradeSize * 3) {
      level = RiskLevel.MEDIUM;
      warnings.push('Large trade with low win rate');
    }

    return { level, warnings };
  }

  // 빈도 위험 분석
  private async analyzeFrequencyRisk(userId: string): Promise<{
    level: RiskLevel;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let level = RiskLevel.LOW;

    // 최근 10분간 거래 수 확인
    const recentTrades = await this.getRecentTrades(userId, 10 * 60 * 1000); // 10분
    
    if (recentTrades.length >= this.config.rapidTradingThreshold) {
      level = RiskLevel.HIGH;
      warnings.push('Rapid trading detected');
    }

    // 일일 거래 수 확인
    const dailyTrades = await this.getDailyTrades(userId);
    if (dailyTrades.length >= this.config.maxDailyTrades) {
      level = RiskLevel.MEDIUM;
      warnings.push('High daily trading frequency');
    }

    return { level, warnings };
  }

  // 위험 이벤트 생성
  createRiskEvent(
    userId: string,
    type: RiskType,
    level: RiskLevel,
    description: string,
    data: any
  ): string {
    const eventId = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: RiskEvent = {
      id: eventId,
      userId,
      type,
      level,
      description,
      data,
      timestamp: new Date(),
      isResolved: false,
      actions: [],
    };

    this.riskEvents.set(eventId, event);
    this.emit('risk_event', event);

    // 자동 조치 실행
    if (this.config.autoSuspensionEnabled) {
      this.executeAutoActions(event);
    }

    return eventId;
  }

  // 자동 위험 조치 실행
  private executeAutoActions(event: RiskEvent): void {
    const actions: RiskAction[] = [];

    switch (event.level) {
      case RiskLevel.CRITICAL:
        actions.push({
          type: 'trading_suspension',
          description: 'Trading suspended due to critical risk',
          appliedAt: new Date(),
          appliedBy: 'system',
        });
        this.suspendUserTrading(event.userId, 'Critical risk detected', 24 * 60 * 60 * 1000); // 24시간
        break;

      case RiskLevel.HIGH:
        actions.push({
          type: 'limit_reduction',
          description: 'Trading limits reduced due to high risk',
          appliedAt: new Date(),
          appliedBy: 'system',
          parameters: { reductionFactor: 0.5 },
        });
        this.reduceTradingLimits(event.userId, 0.5);
        break;

      case RiskLevel.MEDIUM:
        actions.push({
          type: 'warning',
          description: 'Warning issued due to medium risk',
          appliedAt: new Date(),
          appliedBy: 'system',
        });
        this.issueWarning(event.userId, event.description);
        break;
    }

    event.actions.push(...actions);
    this.riskEvents.set(event.id, event);
  }

  // 사용자 거래 일시 정지
  suspendUserTrading(userId: string, reason: string, durationMs: number): void {
    const profile = this.getUserRiskProfile(userId);
    if (!profile) return;

    profile.isRestricted = true;
    profile.restrictionReason = reason;
    profile.restrictionUntil = new Date(Date.now() + durationMs);
    profile.updatedAt = new Date();

    this.setUserRiskProfile(profile);
    this.emit('user_suspended', { userId, reason, until: profile.restrictionUntil });
  }

  // 거래 한도 감소
  reduceTradingLimits(userId: string, factor: number): void {
    const limits = this.tradingLimits.get(userId);
    if (!limits) return;

    limits.dailyLimit *= factor;
    limits.weeklyLimit *= factor;
    limits.monthlyLimit *= factor;

    this.tradingLimits.set(userId, limits);
    this.emit('limits_reduced', { userId, factor });
  }

  // 경고 발행
  issueWarning(userId: string, message: string): void {
    this.emit('warning_issued', { userId, message, timestamp: new Date() });
  }

  // 거래 패턴 업데이트
  updateTradingPattern(userId: string, tradeData: any): void {
    let pattern = this.tradingPatterns.get(userId);
    
    if (!pattern) {
      pattern = {
        userId,
        avgDailyTrades: 0,
        avgTradeSize: 0,
        winRate: 0,
        maxConsecutiveLosses: 0,
        tradingHours: [],
        preferredAssets: [],
        riskScore: 0,
        lastAnalyzed: new Date(),
      };
    }

    // 패턴 업데이트 로직
    this.calculateTradingPattern(pattern, tradeData);
    this.tradingPatterns.set(userId, pattern);
  }

  // 거래 패턴 계산
  private calculateTradingPattern(pattern: TradingPattern, tradeData: any): void {
    // 평균 거래 크기 업데이트
    pattern.avgTradeSize = (pattern.avgTradeSize + tradeData.amount) / 2;
    
    // 거래 시간 패턴 업데이트
    const hour = new Date().getHours();
    if (!pattern.tradingHours.includes(hour)) {
      pattern.tradingHours.push(hour);
    }

    // 선호 자산 업데이트
    if (tradeData.symbol && !pattern.preferredAssets.includes(tradeData.symbol)) {
      pattern.preferredAssets.push(tradeData.symbol);
    }

    pattern.lastAnalyzed = new Date();
  }

  // 위험 점수 계산
  calculateRiskScore(userId: string): number {
    const profile = this.getUserRiskProfile(userId);
    const pattern = this.tradingPatterns.get(userId);
    const limits = this.tradingLimits.get(userId);

    if (!profile || !pattern || !limits) return 0;

    let score = 0;

    // 거래 빈도 점수
    score += Math.min(pattern.avgDailyTrades / this.config.maxDailyTrades, 1) * 0.3;

    // 한도 사용률 점수
    const dailyUsageRatio = limits.dailyUsed / limits.dailyLimit;
    score += dailyUsageRatio * 0.3;

    // 승률 점수 (낮을수록 위험)
    score += (1 - pattern.winRate) * 0.2;

    // 연속 손실 점수
    score += Math.min(pattern.maxConsecutiveLosses / this.config.maxConsecutiveLosses, 1) * 0.2;

    return Math.min(score, 1);
  }

  // 위험 이벤트 해결
  resolveRiskEvent(eventId: string, resolvedBy: string): boolean {
    const event = this.riskEvents.get(eventId);
    if (!event) return false;

    event.isResolved = true;
    event.resolvedAt = new Date();
    event.resolvedBy = resolvedBy;

    this.riskEvents.set(eventId, event);
    this.emit('risk_event_resolved', event);

    return true;
  }

  // 사용자 위험 이벤트 조회
  getUserRiskEvents(userId: string, limit = 50): RiskEvent[] {
    return Array.from(this.riskEvents.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // 위험 통계
  getRiskStatistics(): {
    totalEvents: number;
    eventsByLevel: Record<RiskLevel, number>;
    eventsByType: Record<RiskType, number>;
    unresolvedEvents: number;
    suspendedUsers: number;
  } {
    const events = Array.from(this.riskEvents.values());
    const profiles = Array.from(this.userProfiles.values());

    const eventsByLevel = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    };

    const eventsByType = Object.values(RiskType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<RiskType, number>);

    events.forEach(event => {
      eventsByLevel[event.level]++;
      eventsByType[event.type]++;
    });

    return {
      totalEvents: events.length,
      eventsByLevel,
      eventsByType,
      unresolvedEvents: events.filter(e => !e.isResolved).length,
      suspendedUsers: profiles.filter(p => p.isRestricted).length,
    };
  }

  // 정기 작업 설정
  private setupPeriodicTasks(): void {
    // 매시간 패턴 분석
    setInterval(() => {
      this.analyzeAllUserPatterns();
    }, 60 * 60 * 1000);

    // 매일 위험 점수 재계산
    setInterval(() => {
      this.recalculateAllRiskScores();
    }, 24 * 60 * 60 * 1000);

    // 매주 제한 해제 검토
    setInterval(() => {
      this.reviewRestrictions();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  // 모든 사용자 패턴 분석
  private analyzeAllUserPatterns(): void {
    for (const userId of this.userProfiles.keys()) {
      const riskScore = this.calculateRiskScore(userId);
      
      if (riskScore > this.config.alertThresholds[RiskLevel.HIGH]) {
        this.createRiskEvent(
          userId,
          RiskType.UNUSUAL_PATTERN,
          RiskLevel.HIGH,
          `High risk score detected: ${riskScore.toFixed(2)}`,
          { riskScore }
        );
      }
    }
  }

  // 모든 위험 점수 재계산
  private recalculateAllRiskScores(): void {
    for (const pattern of this.tradingPatterns.values()) {
      const riskScore = this.calculateRiskScore(pattern.userId);
      pattern.riskScore = riskScore;
      this.tradingPatterns.set(pattern.userId, pattern);
    }
  }

  // 제한 검토
  private reviewRestrictions(): void {
    const now = new Date();
    
    for (const profile of this.userProfiles.values()) {
      if (profile.isRestricted && profile.restrictionUntil && profile.restrictionUntil <= now) {
        profile.isRestricted = false;
        profile.restrictionReason = undefined;
        profile.restrictionUntil = undefined;
        profile.updatedAt = now;
        
        this.setUserRiskProfile(profile);
        this.emit('restriction_lifted', { userId: profile.userId });
      }
    }
  }

  // 유틸리티 메서드들
  private isDifferentDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() !== date2.toDateString();
  }

  private isDifferentWeek(date1: Date, date2: Date): boolean {
    const week1 = this.getWeekNumber(date1);
    const week2 = this.getWeekNumber(date2);
    return week1 !== week2;
  }

  private isDifferentMonth(date1: Date, date2: Date): boolean {
    return date1.getMonth() !== date2.getMonth() || date1.getFullYear() !== date2.getFullYear();
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // 실제 구현에서는 데이터베이스에서 조회
  private async getRecentTrades(userId: string, timeWindowMs: number): Promise<any[]> {
    // TODO: 데이터베이스에서 최근 거래 조회
    return [];
  }

  private async getDailyTrades(userId: string): Promise<any[]> {
    // TODO: 데이터베이스에서 일일 거래 조회
    return [];
  }
}

// 싱글톤 인스턴스
export const riskManagementSystem = new RiskManagementSystem(); 