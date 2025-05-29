/**
 * WebSocket 구독 관리 시스템
 * 선택적 데이터 수신을 통한 성능 최적화 및 대역폭 절약
 */

import { EventEmitter } from 'events';

// 구독 타입 정의
export type SubscriptionType = 
  | 'price_updates'
  | 'trade_updates'
  | 'balance_updates'
  | 'notification_updates'
  | 'admin_updates'
  | 'system_status'
  | 'flash_trade_results'
  | 'quick_trade_updates'
  | 'quant_ai_updates';

export interface SubscriptionFilter {
  symbols?: string[];
  userId?: string;
  tradeTypes?: string[];
  adminLevel?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface Subscription {
  id: string;
  type: SubscriptionType;
  filter: SubscriptionFilter;
  clientId: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  subscriptionId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// 구독 관리자 클래스
export class SubscriptionManager extends EventEmitter {
  private subscriptions = new Map<string, Subscription>();
  private clientSubscriptions = new Map<string, Set<string>>();
  private typeSubscriptions = new Map<SubscriptionType, Set<string>>();
  private messageQueue = new Map<string, WebSocketMessage[]>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    super();
    this.setupCleanupInterval();
  }

  // 구독 생성
  subscribe(
    clientId: string,
    type: SubscriptionType,
    filter: SubscriptionFilter = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      type,
      filter,
      clientId,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    };

    // 구독 저장
    this.subscriptions.set(subscriptionId, subscription);

    // 클라이언트별 구독 추적
    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Set());
    }
    this.clientSubscriptions.get(clientId)!.add(subscriptionId);

    // 타입별 구독 추적
    if (!this.typeSubscriptions.has(type)) {
      this.typeSubscriptions.set(type, new Set());
    }
    this.typeSubscriptions.get(type)!.add(subscriptionId);

    console.log(`📡 New subscription: ${type} for client ${clientId}`);
    this.emit('subscription_created', subscription);

    return subscriptionId;
  }

  // 구독 해제
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    // 구독 제거
    this.subscriptions.delete(subscriptionId);

    // 클라이언트별 구독에서 제거
    const clientSubs = this.clientSubscriptions.get(subscription.clientId);
    if (clientSubs) {
      clientSubs.delete(subscriptionId);
      if (clientSubs.size === 0) {
        this.clientSubscriptions.delete(subscription.clientId);
      }
    }

    // 타입별 구독에서 제거
    const typeSubs = this.typeSubscriptions.get(subscription.type);
    if (typeSubs) {
      typeSubs.delete(subscriptionId);
      if (typeSubs.size === 0) {
        this.typeSubscriptions.delete(subscription.type);
      }
    }

    // 메시지 큐 정리
    this.messageQueue.delete(subscriptionId);

    console.log(`📡 Unsubscribed: ${subscriptionId}`);
    this.emit('subscription_removed', subscription);

    return true;
  }

  // 클라이언트의 모든 구독 해제
  unsubscribeClient(clientId: string): number {
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (!clientSubs) return 0;

    const subscriptionIds = Array.from(clientSubs);
    let removedCount = 0;

    subscriptionIds.forEach(subId => {
      if (this.unsubscribe(subId)) {
        removedCount++;
      }
    });

    console.log(`📡 Removed ${removedCount} subscriptions for client ${clientId}`);
    return removedCount;
  }

  // 메시지 발행
  publish(type: SubscriptionType, data: any, filter: SubscriptionFilter = {}): number {
    const typeSubscriptions = this.typeSubscriptions.get(type);
    if (!typeSubscriptions || typeSubscriptions.size === 0) {
      return 0;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date(),
      priority: filter.priority || 'medium',
    };

    let deliveredCount = 0;

    // 해당 타입의 모든 구독에 대해 필터링 및 전송
    typeSubscriptions.forEach(subscriptionId => {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription || !subscription.isActive) return;

      // 필터 조건 확인
      if (this.matchesFilter(subscription.filter, filter, data)) {
        // Rate limiting 확인
        if (this.checkRateLimit(subscription.clientId)) {
          this.queueMessage(subscriptionId, { ...message, subscriptionId });
          deliveredCount++;
        }
      }
    });

    return deliveredCount;
  }

  // 메시지 큐에서 클라이언트별 메시지 가져오기
  getMessagesForClient(clientId: string): WebSocketMessage[] {
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (!clientSubs) return [];

    const messages: WebSocketMessage[] = [];

    clientSubs.forEach(subscriptionId => {
      const queuedMessages = this.messageQueue.get(subscriptionId) || [];
      messages.push(...queuedMessages);
      this.messageQueue.delete(subscriptionId); // 메시지 전송 후 큐에서 제거
    });

    // 우선순위별 정렬
    return messages.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium'];
    });
  }

  // 구독 활성화/비활성화
  toggleSubscription(subscriptionId: string, isActive: boolean): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.isActive = isActive;
    subscription.lastActivity = new Date();

    console.log(`📡 Subscription ${subscriptionId} ${isActive ? 'activated' : 'deactivated'}`);
    return true;
  }

  // 구독 정보 조회
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  // 클라이언트의 구독 목록 조회
  getClientSubscriptions(clientId: string): Subscription[] {
    const clientSubs = this.clientSubscriptions.get(clientId);
    if (!clientSubs) return [];

    return Array.from(clientSubs)
      .map(subId => this.subscriptions.get(subId))
      .filter(sub => sub !== undefined) as Subscription[];
  }

  // 통계 정보
  getStats() {
    const stats = {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.isActive).length,
      totalClients: this.clientSubscriptions.size,
      subscriptionsByType: {} as Record<string, number>,
      queuedMessages: 0,
    };

    // 타입별 구독 수
    this.typeSubscriptions.forEach((subs, type) => {
      stats.subscriptionsByType[type] = subs.size;
    });

    // 큐에 있는 메시지 수
    this.messageQueue.forEach(messages => {
      stats.queuedMessages += messages.length;
    });

    return stats;
  }

  // 필터 매칭 확인
  private matchesFilter(
    subscriptionFilter: SubscriptionFilter,
    publishFilter: SubscriptionFilter,
    data: any
  ): boolean {
    // 심볼 필터
    if (subscriptionFilter.symbols && subscriptionFilter.symbols.length > 0) {
      const dataSymbol = data.symbol || publishFilter.symbols?.[0];
      if (dataSymbol && !subscriptionFilter.symbols.includes(dataSymbol)) {
        return false;
      }
    }

    // 사용자 ID 필터
    if (subscriptionFilter.userId && publishFilter.userId) {
      if (subscriptionFilter.userId !== publishFilter.userId) {
        return false;
      }
    }

    // 거래 타입 필터
    if (subscriptionFilter.tradeTypes && subscriptionFilter.tradeTypes.length > 0) {
      const dataTradeType = data.tradeType || publishFilter.tradeTypes?.[0];
      if (dataTradeType && !subscriptionFilter.tradeTypes.includes(dataTradeType)) {
        return false;
      }
    }

    // 관리자 레벨 필터
    if (subscriptionFilter.adminLevel && publishFilter.adminLevel) {
      if (subscriptionFilter.adminLevel !== publishFilter.adminLevel) {
        return false;
      }
    }

    return true;
  }

  // Rate limiting 확인
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(clientId);

    if (!limit || now > limit.resetTime) {
      // 새로운 윈도우 시작 (1분 윈도우, 최대 100개 메시지)
      this.rateLimits.set(clientId, {
        count: 1,
        resetTime: now + 60000, // 1분
      });
      return true;
    }

    if (limit.count >= 100) {
      console.warn(`⚠️ Rate limit exceeded for client ${clientId}`);
      return false;
    }

    limit.count++;
    return true;
  }

  // 메시지 큐에 추가
  private queueMessage(subscriptionId: string, message: WebSocketMessage): void {
    if (!this.messageQueue.has(subscriptionId)) {
      this.messageQueue.set(subscriptionId, []);
    }

    const queue = this.messageQueue.get(subscriptionId)!;
    queue.push(message);

    // 큐 크기 제한 (최대 50개 메시지)
    if (queue.length > 50) {
      queue.shift(); // 가장 오래된 메시지 제거
    }
  }

  // 구독 ID 생성
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 정리 작업 설정
  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactiveSubscriptions();
      this.cleanupRateLimits();
    }, 300000); // 5분마다 정리
  }

  // 비활성 구독 정리
  private cleanupInactiveSubscriptions(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30분

    const toRemove: string[] = [];

    this.subscriptions.forEach((subscription, id) => {
      const timeSinceActivity = now.getTime() - subscription.lastActivity.getTime();
      if (timeSinceActivity > inactiveThreshold) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => {
      console.log(`🧹 Cleaning up inactive subscription: ${id}`);
      this.unsubscribe(id);
    });

    if (toRemove.length > 0) {
      console.log(`🧹 Cleaned up ${toRemove.length} inactive subscriptions`);
    }
  }

  // Rate limit 정리
  private cleanupRateLimits(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.rateLimits.forEach((limit, clientId) => {
      if (now > limit.resetTime) {
        toRemove.push(clientId);
      }
    });

    toRemove.forEach(clientId => {
      this.rateLimits.delete(clientId);
    });
  }
}

// 구독 헬퍼 클래스
export class SubscriptionHelper {
  constructor(private manager: SubscriptionManager) {}

  // 가격 업데이트 구독
  subscribeToPriceUpdates(clientId: string, symbols: string[] = []): string {
    return this.manager.subscribe(clientId, 'price_updates', { symbols });
  }

  // 거래 업데이트 구독
  subscribeToTradeUpdates(clientId: string, userId?: string, tradeTypes?: string[]): string {
    return this.manager.subscribe(clientId, 'trade_updates', { userId, tradeTypes });
  }

  // 잔액 업데이트 구독
  subscribeToBalanceUpdates(clientId: string, userId: string): string {
    return this.manager.subscribe(clientId, 'balance_updates', { userId });
  }

  // 알림 구독
  subscribeToNotifications(clientId: string, userId: string): string {
    return this.manager.subscribe(clientId, 'notification_updates', { userId });
  }

  // 관리자 업데이트 구독
  subscribeToAdminUpdates(clientId: string, adminLevel: string): string {
    return this.manager.subscribe(clientId, 'admin_updates', { adminLevel });
  }

  // 시스템 상태 구독
  subscribeToSystemStatus(clientId: string): string {
    return this.manager.subscribe(clientId, 'system_status');
  }

  // Flash Trade 결과 구독
  subscribeToFlashTradeResults(clientId: string, userId?: string): string {
    return this.manager.subscribe(clientId, 'flash_trade_results', { userId });
  }

  // Quick Trade 업데이트 구독
  subscribeToQuickTradeUpdates(clientId: string, userId?: string): string {
    return this.manager.subscribe(clientId, 'quick_trade_updates', { userId });
  }

  // Quant AI 업데이트 구독
  subscribeToQuantAIUpdates(clientId: string, userId?: string): string {
    return this.manager.subscribe(clientId, 'quant_ai_updates', { userId });
  }
}

// 메시지 발행 헬퍼
export class MessagePublisher {
  constructor(private manager: SubscriptionManager) {}

  // 가격 업데이트 발행
  publishPriceUpdate(symbol: string, price: number, change: number): number {
    return this.manager.publish('price_updates', {
      symbol,
      price,
      change,
      timestamp: new Date(),
    }, { symbols: [symbol] });
  }

  // 거래 업데이트 발행
  publishTradeUpdate(userId: string, tradeType: string, tradeData: any): number {
    return this.manager.publish('trade_updates', {
      userId,
      tradeType,
      ...tradeData,
    }, { userId, tradeTypes: [tradeType] });
  }

  // 잔액 업데이트 발행
  publishBalanceUpdate(userId: string, newBalance: string, change: string): number {
    return this.manager.publish('balance_updates', {
      userId,
      newBalance,
      change,
      timestamp: new Date(),
    }, { userId });
  }

  // 알림 발행
  publishNotification(userId: string, notification: any): number {
    return this.manager.publish('notification_updates', notification, { 
      userId,
      priority: notification.priority || 'medium'
    });
  }

  // 관리자 업데이트 발행
  publishAdminUpdate(adminLevel: string, updateData: any): number {
    return this.manager.publish('admin_updates', updateData, { 
      adminLevel,
      priority: 'high'
    });
  }

  // 시스템 상태 발행
  publishSystemStatus(status: any): number {
    return this.manager.publish('system_status', status, { priority: 'high' });
  }

  // Flash Trade 결과 발행
  publishFlashTradeResult(userId: string, result: any): number {
    return this.manager.publish('flash_trade_results', result, { 
      userId,
      priority: 'high'
    });
  }
}

// 싱글톤 인스턴스
export const subscriptionManager = new SubscriptionManager();
export const subscriptionHelper = new SubscriptionHelper(subscriptionManager);
export const messagePublisher = new MessagePublisher(subscriptionManager); 