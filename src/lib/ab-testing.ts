import { createHash } from 'crypto';

// 외부 분석 도구 타입 선언
declare global {
  var gtag: (command: string, action: string, options?: any) => void;
  var amplitude: { track: (event: string, properties?: any) => void };
  var mixpanel: { track: (event: string, properties?: any) => void };
}

// A/B 테스트 변형 타입
export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100 퍼센트
  config?: Record<string, any>;
}

// A/B 테스트 실험 정의
export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  startDate: Date;
  endDate?: Date;
  variants: ABTestVariant[];
  targetAudience?: {
    percentage: number;
    criteria?: Record<string, any>;
  };
  metrics: string[];
}

// 피처 플래그 정의
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: {
    userSegments?: string[];
    geoLocation?: string[];
    deviceType?: ('mobile' | 'tablet' | 'desktop')[];
  };
}

// 사용자 컨텍스트
export interface UserContext {
  userId?: string;
  sessionId: string;
  userAgent?: string;
  geoLocation?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  isNewUser?: boolean;
  userSegment?: string;
}

// 이벤트 추적
export interface TrackingEvent {
  experimentId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

// A/B 테스트 서비스 클래스
class ABTestingService {
  private experiments: Map<string, ABTestExperiment> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId
  private events: TrackingEvent[] = [];

  constructor() {
    this.initializeDefaultExperiments();
    this.initializeDefaultFeatureFlags();
    this.loadPersistedData();
  }

  // 기본 실험 설정
  private initializeDefaultExperiments() {
    const experiments: ABTestExperiment[] = [
      {
        id: 'button_color_test',
        name: '버튼 색상 테스트',
        description: '파란색 vs 녹색 버튼의 클릭률 비교',
        enabled: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        variants: [
          { id: 'blue', name: '파란색 버튼', weight: 50 },
          { id: 'green', name: '녹색 버튼', weight: 50 }
        ],
        targetAudience: { percentage: 100 },
        metrics: ['click_rate', 'conversion_rate']
      },
      {
        id: 'dashboard_layout_test',
        name: '대시보드 레이아웃 테스트',
        description: '클래식 vs 모던 레이아웃 비교',
        enabled: true,
        startDate: new Date('2024-01-01'),
        variants: [
          { id: 'classic', name: '클래식 레이아웃', weight: 50 },
          { id: 'modern', name: '모던 레이아웃', weight: 50 }
        ],
        targetAudience: { percentage: 50 },
        metrics: ['engagement_time', 'bounce_rate']
      },
      {
        id: 'mobile_ui_test',
        name: '모바일 UI 개선 테스트',
        description: '기존 vs 개선된 모바일 UI 비교',
        enabled: true,
        startDate: new Date('2024-01-01'),
        variants: [
          { id: 'original', name: '기존 UI', weight: 30 },
          { id: 'enhanced', name: '개선된 UI', weight: 70 }
        ],
        targetAudience: { 
          percentage: 100,
          criteria: { deviceType: 'mobile' }
        },
        metrics: ['user_satisfaction', 'task_completion']
      }
    ];

    experiments.forEach(exp => this.experiments.set(exp.id, exp));
  }

  // 기본 피처 플래그 설정
  private initializeDefaultFeatureFlags() {
    const featureFlags: FeatureFlag[] = [
      {
        id: 'advanced_charts',
        name: '고급 차트 기능',
        description: '프리미엄 차트 위젯 표시',
        enabled: true,
        rolloutPercentage: 80,
        conditions: {
          userSegments: ['premium', 'beta_tester']
        }
      },
      {
        id: 'new_trading_interface',
        name: '신규 트레이딩 인터페이스',
        description: '리뉴얼된 트레이딩 UI',
        enabled: true,
        rolloutPercentage: 30
      },
      {
        id: 'dark_mode_v2',
        name: '다크모드 v2',
        description: '개선된 다크모드 테마',
        enabled: true,
        rolloutPercentage: 50
      },
      {
        id: 'push_notifications',
        name: '푸시 알림',
        description: '실시간 푸시 알림 기능',
        enabled: true,
        rolloutPercentage: 90,
        conditions: {
          deviceType: ['mobile']
        }
      },
      {
        id: 'social_trading',
        name: '소셜 트레이딩',
        description: '다른 사용자 트레이딩 따라하기',
        enabled: false,
        rolloutPercentage: 10,
        conditions: {
          userSegments: ['beta_tester'],
          geoLocation: ['KR', 'US']
        }
      }
    ];

    featureFlags.forEach(flag => this.featureFlags.set(flag.id, flag));
  }

  // 로컬 스토리지에서 데이터 로드
  private loadPersistedData() {
    if (typeof window === 'undefined') return;

    try {
      const persistedAssignments = localStorage.getItem('ab_test_assignments');
      if (persistedAssignments) {
        const parsed = JSON.parse(persistedAssignments);
        this.userAssignments = new Map(
          Object.entries(parsed).map(([userId, assignments]) => [
            userId,
            new Map(Object.entries(assignments as Record<string, string>))
          ])
        );
      }

      const persistedEvents = localStorage.getItem('ab_test_events');
      if (persistedEvents) {
        this.events = JSON.parse(persistedEvents).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load persisted A/B test data:', error);
    }
  }

  // 데이터를 로컬 스토리지에 저장
  private persistData() {
    if (typeof window === 'undefined') return;

    try {
      // 사용자 할당 저장
      const assignmentsObj: Record<string, Record<string, string>> = {};
      this.userAssignments.forEach((assignments, userId) => {
        assignmentsObj[userId] = Object.fromEntries(assignments);
      });
      localStorage.setItem('ab_test_assignments', JSON.stringify(assignmentsObj));

      // 이벤트 저장 (최근 1000개만)
      const recentEvents = this.events.slice(-1000);
      localStorage.setItem('ab_test_events', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to persist A/B test data:', error);
    }
  }

  // 해시 기반 사용자 분배
  private hashUser(userId: string, experimentId: string): number {
    const hash = createHash('md5').update(`${userId}-${experimentId}`).digest('hex');
    return parseInt(hash.substr(0, 8), 16) % 100;
  }

  // 실험에 사용자 할당
  assignUserToVariant(experimentId: string, userContext: UserContext): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.enabled) {
      return null;
    }

    // 실험 기간 확인
    const now = new Date();
    if (now < experiment.startDate || (experiment.endDate && now > experiment.endDate)) {
      return null;
    }

    const userId = userContext.userId || userContext.sessionId;
    
    // 기존 할당 확인
    const userAssignments = this.userAssignments.get(userId);
    if (userAssignments?.has(experimentId)) {
      return userAssignments.get(experimentId)!;
    }

    // 타겟 오디언스 조건 확인
    if (experiment.targetAudience) {
      const hash = this.hashUser(userId, experimentId);
      if (hash >= experiment.targetAudience.percentage) {
        return null;
      }

      // 추가 조건 확인
      if (experiment.targetAudience.criteria) {
        const criteria = experiment.targetAudience.criteria;
        if (criteria.deviceType && userContext.deviceType !== criteria.deviceType) {
          return null;
        }
      }
    }

    // 변형 할당
    const hash = this.hashUser(userId, `${experimentId}_variant`);
    let cumulativeWeight = 0;
    
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (hash < cumulativeWeight) {
        // 할당 저장
        if (!this.userAssignments.has(userId)) {
          this.userAssignments.set(userId, new Map());
        }
        this.userAssignments.get(userId)!.set(experimentId, variant.id);
        
        // 노출 이벤트 추적
        this.trackEvent({
          experimentId,
          variantId: variant.id,
          userId: userContext.userId,
          sessionId: userContext.sessionId,
          eventName: 'experiment_exposure',
          timestamp: new Date()
        });

        this.persistData();
        return variant.id;
      }
    }

    return experiment.variants[0]?.id || null;
  }

  // 피처 플래그 확인
  isFeatureEnabled(flagId: string, userContext: UserContext): boolean {
    const flag = this.featureFlags.get(flagId);
    if (!flag || !flag.enabled) {
      return false;
    }

    const userId = userContext.userId || userContext.sessionId;
    const hash = this.hashUser(userId, flagId);
    
    if (hash >= flag.rolloutPercentage) {
      return false;
    }

    // 조건 확인
    if (flag.conditions) {
      const { userSegments, geoLocation, deviceType } = flag.conditions;
      
      if (userSegments && userContext.userSegment && !userSegments.includes(userContext.userSegment)) {
        return false;
      }
      
      if (geoLocation && userContext.geoLocation && !geoLocation.includes(userContext.geoLocation)) {
        return false;
      }
      
      if (deviceType && userContext.deviceType && !deviceType.includes(userContext.deviceType)) {
        return false;
      }
    }

    return true;
  }

  // 이벤트 추적
  trackEvent(event: Omit<TrackingEvent, 'timestamp'> & { timestamp?: Date }) {
    const trackingEvent: TrackingEvent = {
      ...event,
      timestamp: event.timestamp || new Date()
    };
    
    this.events.push(trackingEvent);
    
    // 이벤트를 외부 분석 도구로 전송 (실제 구현에서)
    this.sendEventToAnalytics(trackingEvent);
    
    this.persistData();
  }

  // 컨버전 추적
  trackConversion(experimentId: string, userContext: UserContext, eventName?: string, properties?: Record<string, any>) {
    const variant = this.assignUserToVariant(experimentId, userContext);
    if (!variant) return;

    this.trackEvent({
      experimentId,
      variantId: variant,
      userId: userContext.userId,
      sessionId: userContext.sessionId,
      eventName: eventName || 'conversion',
      properties,
      timestamp: new Date()
    });
  }

  // 외부 분석 도구로 이벤트 전송
  private sendEventToAnalytics(event: TrackingEvent) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.eventName, {
        experiment_id: event.experimentId,
        variant_id: event.variantId,
        custom_map: {
          experiment: event.experimentId,
          variant: event.variantId
        }
      });
    }

    // Amplitude
    if (typeof amplitude !== 'undefined') {
      amplitude.track(event.eventName, {
        experiment_id: event.experimentId,
        variant_id: event.variantId,
        ...event.properties
      });
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(event.eventName, {
        experiment_id: event.experimentId,
        variant_id: event.variantId,
        ...event.properties
      });
    }

    // 커스텀 분석 API
    if (process.env.NEXT_PUBLIC_ANALYTICS_API_URL) {
      fetch(`${process.env.NEXT_PUBLIC_ANALYTICS_API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(error => {
        console.error('Failed to send event to analytics API:', error);
      });
    }
  }

  // 실험 결과 분석
  getExperimentResults(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const experimentEvents = this.events.filter(e => e.experimentId === experimentId);
    const results: Record<string, any> = {};

    experiment.variants.forEach(variant => {
      const variantEvents = experimentEvents.filter(e => e.variantId === variant.id);
      const exposures = variantEvents.filter(e => e.eventName === 'experiment_exposure').length;
      const conversions = variantEvents.filter(e => e.eventName === 'conversion').length;
      
      results[variant.id] = {
        name: variant.name,
        exposures,
        conversions,
        conversionRate: exposures > 0 ? (conversions / exposures) * 100 : 0
      };
    });

    return results;
  }

  // 모든 실험 가져오기
  getAllExperiments(): ABTestExperiment[] {
    return Array.from(this.experiments.values());
  }

  // 모든 피처 플래그 가져오기
  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  // 실험 추가/수정
  updateExperiment(experiment: ABTestExperiment) {
    this.experiments.set(experiment.id, experiment);
  }

  // 피처 플래그 추가/수정
  updateFeatureFlag(flag: FeatureFlag) {
    this.featureFlags.set(flag.id, flag);
  }

  // 사용자별 할당 현황 조회
  getUserAssignments(userId: string): Record<string, string> {
    const assignments = this.userAssignments.get(userId);
    return assignments ? Object.fromEntries(assignments) : {};
  }

  // 실험 강제 할당 (디버깅용)
  forceAssignment(userId: string, experimentId: string, variantId: string) {
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(experimentId, variantId);
    this.persistData();
  }
}

// 싱글톤 인스턴스
export const abTestingService = new ABTestingService();

// 타입들은 이미 위에서 interface로 선언되어 있으므로 별도 export 불필요 