# IX. 사용자 기능 명세 및 사용 가이드

**문서 버전**: 3.0.0  
**최종 업데이트**: 2024년 12월 27일  
**작성자**: AI 개발 어시스턴트  
**검증 상태**: ✅ 실제 코드베이스 분석 완료

---

## 📋 목차

1. [플랫폼 개요](#1-플랫폼-개요)
2. [계정 관리](#2-계정-관리)
3. [Flash Trade 시스템](#3-flash-trade-시스템)
4. [대시보드 및 통계](#4-대시보드-및-통계)
5. [VIP 시스템](#5-vip-시스템)
6. [지갑 및 거래 내역](#6-지갑-및-거래-내역)
7. [알림 시스템](#7-알림-시스템)
8. [설정 및 개인화](#8-설정-및-개인화)
9. [고객 지원](#9-고객-지원)
10. [FAQ 및 문제 해결](#10-faq-및-문제-해결)

---

## 1. 플랫폼 개요

### 1.1 CryptoTrader/QuantTrade 소개

#### 플랫폼 특징
- **가상 거래 시뮬레이션**: 실제 암호화폐 거래 없이 안전한 거래 체험
- **Flash Trade**: 30초~5분의 단기 거래 시스템
- **실시간 차트**: 실제 시장 데이터 기반 차트 제공
- **다국어 지원**: 10개 언어 완벽 지원
- **VIP 시스템**: 레벨별 특별 혜택 제공

#### 지원 언어
```typescript
const supportedLanguages = [
  'ko', // 한국어
  'en', // English
  'ja', // 日本語
  'zh', // 中文
  'es', // Español
  'fr', // Français
  'de', // Deutsch
  'ru', // Русский
  'ar', // العربية
  'hi'  // हिन्दी
];
```

### 1.2 시작하기

#### 시스템 요구사항
- **웹 브라우저**: Chrome 90+, Firefox 88+, Safari 14+
- **인터넷 연결**: 안정적인 인터넷 연결 필요
- **화면 해상도**: 최소 1024x768 (모바일 지원)
- **JavaScript**: 활성화 필수

#### 접속 방법
1. **웹사이트 접속**: https://cryptotrader.com
2. **계정 생성** 또는 **로그인**
3. **대시보드** 접근
4. **거래 시작**

---

## 2. 계정 관리

### 2.1 회원가입

#### 가입 절차
```typescript
interface RegistrationForm {
  email: string;           // 이메일 주소 (필수)
  password: string;        // 비밀번호 (필수)
  firstName: string;       // 이름 (필수)
  lastName: string;        // 성 (필수)
  nickname?: string;       // 닉네임 (선택)
  referralCode?: string;   // 추천인 코드 (선택)
}
```

#### 가입 단계
1. **이메일 입력**: 유효한 이메일 주소 입력
2. **비밀번호 설정**: 
   - 최소 8자 이상
   - 대소문자, 숫자, 특수문자 포함
3. **개인정보 입력**: 이름, 성 입력
4. **이메일 인증**: 인증 메일 확인 (선택사항)
5. **가입 완료**: 자동 로그인 및 대시보드 이동

#### 초기 혜택
- **무료 잔액**: 10,000 USDT 지급
- **VIP 레벨 1**: 기본 VIP 레벨 부여
- **환영 보너스**: 첫 거래 시 추가 보너스

### 2.2 로그인 및 보안

#### 로그인 방법
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}

// 로그인 API 호출
const login = async (credentials: LoginCredentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (response.ok) {
    const user = await response.json();
    // 자동으로 대시보드로 리다이렉트
    window.location.href = '/dashboard';
  }
};
```

#### 보안 기능
- **세션 관리**: 7일 자동 로그인 유지
- **IP 추적**: 로그인 IP 기록 및 알림
- **계정 잠금**: 5회 실패 시 15분 잠금
- **로그인 알림**: 새로운 로그인 시 알림 발송

### 2.3 프로필 관리

#### 개인정보 수정
```typescript
interface UserProfile {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;          // 읽기 전용
  phone?: string;
  country?: string;
  timezone?: string;
  language: string;
}

// 프로필 업데이트
const updateProfile = async (profile: Partial<UserProfile>) => {
  await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
};
```

#### 비밀번호 변경
1. **현재 비밀번호** 입력
2. **새 비밀번호** 입력 (보안 요구사항 충족)
3. **비밀번호 확인** 입력
4. **변경 완료** 후 자동 로그아웃

---

## 3. Flash Trade 시스템

### 3.1 Flash Trade 개요

#### 거래 방식
- **UP/DOWN 예측**: 가격 상승/하락 예측
- **시간 선택**: 30초, 60초, 120초, 300초
- **금액 설정**: 10 USDT ~ 1,000 USDT
- **즉시 결과**: 시간 종료 후 즉시 결과 확인

#### 거래 인터페이스
```typescript
interface FlashTradeForm {
  symbol: string;          // 거래 심볼 (예: BTC/USDT)
  amount: number;          // 거래 금액 (10-1000)
  direction: 'up' | 'down'; // 예측 방향
  duration: 30 | 60 | 120 | 300; // 거래 시간 (초)
}

// Flash Trade 실행
const executeFlashTrade = async (trade: FlashTradeForm) => {
  const response = await fetch('/api/flash-trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade)
  });
  
  if (response.ok) {
    const result = await response.json();
    // 실시간으로 거래 진행 상황 모니터링
    monitorTrade(result.id);
  }
};
```

### 3.2 거래 실행 가이드

#### 1단계: 심볼 선택
- **BTC/USDT**: 비트코인
- **ETH/USDT**: 이더리움  
- **BNB/USDT**: 바이낸스 코인
- **ADA/USDT**: 카르다노
- **기타**: 주요 암호화폐 20+ 지원

#### 2단계: 거래 설정
```typescript
// 거래 설정 컴포넌트
const TradeSetup = () => {
  const [amount, setAmount] = useState(10);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [duration, setDuration] = useState(60);

  return (
    <div className="trade-setup">
      <div className="amount-selector">
        <label>거래 금액 (USDT)</label>
        <input 
          type="number" 
          min="10" 
          max="1000" 
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <div className="quick-amounts">
          {[10, 50, 100, 500].map(value => (
            <button key={value} onClick={() => setAmount(value)}>
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="direction-selector">
        <button 
          className={direction === 'up' ? 'active up' : 'up'}
          onClick={() => setDirection('up')}
        >
          ↗ UP
        </button>
        <button 
          className={direction === 'down' ? 'active down' : 'down'}
          onClick={() => setDirection('down')}
        >
          ↘ DOWN
        </button>
      </div>

      <div className="duration-selector">
        {[30, 60, 120, 300].map(time => (
          <button 
            key={time}
            className={duration === time ? 'active' : ''}
            onClick={() => setDuration(time)}
          >
            {time}초
          </button>
        ))}
      </div>
    </div>
  );
};
```

#### 3단계: 거래 실행
1. **설정 확인**: 금액, 방향, 시간 최종 확인
2. **거래 실행**: "거래 시작" 버튼 클릭
3. **진행 모니터링**: 실시간 차트 및 타이머 확인
4. **결과 확인**: 시간 종료 후 승패 및 수익 확인

### 3.3 실시간 모니터링

#### 거래 진행 상황
```typescript
// 실시간 거래 모니터링
const TradeMonitor = ({ tradeId }: { tradeId: string }) => {
  const [trade, setTrade] = useState<FlashTrade>();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(`/ws/trade/${tradeId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'trade_update') {
        setTrade(data.trade);
        setTimeLeft(data.timeLeft);
      } else if (data.type === 'trade_result') {
        // 거래 완료 처리
        handleTradeComplete(data.result);
      }
    };

    return () => ws.close();
  }, [tradeId]);

  return (
    <div className="trade-monitor">
      <div className="trade-info">
        <h3>{trade?.symbol}</h3>
        <div className="amount">${trade?.amount}</div>
        <div className="direction">{trade?.direction.toUpperCase()}</div>
      </div>
      
      <div className="timer">
        <div className="time-left">{timeLeft}초 남음</div>
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${(1 - timeLeft / trade?.duration) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="current-price">
        현재가: ${trade?.currentPrice}
      </div>
    </div>
  );
};
```

### 3.4 수익 계산

#### 수익률 구조
```typescript
interface ProfitCalculation {
  winRate: number;         // 승리 시 수익률 (기본 85%)
  lossRate: number;        // 패배 시 손실률 (기본 100%)
  vipBonus: number;        // VIP 보너스 (레벨별 차등)
  houseEdge: number;       // 하우스 엣지 (기본 15%)
}

// 수익 계산 함수
const calculateProfit = (amount: number, won: boolean, vipLevel: number) => {
  const baseWinRate = 0.85; // 85% 수익
  const vipBonus = vipLevel * 0.01; // VIP 레벨당 1% 추가
  
  if (won) {
    return amount * (baseWinRate + vipBonus);
  } else {
    return -amount; // 전액 손실
  }
};
```

#### 수익 예시
| 거래 금액 | VIP 레벨 | 승리 시 수익 | 패배 시 손실 |
|-----------|----------|--------------|--------------|
| 100 USDT | 1 | +86 USDT | -100 USDT |
| 100 USDT | 5 | +90 USDT | -100 USDT |
| 100 USDT | 10 | +95 USDT | -100 USDT |

---

## 4. 대시보드 및 통계

### 4.1 메인 대시보드

#### 대시보드 구성 요소
```typescript
interface DashboardData {
  user: {
    balance: number;
    vipLevel: number;
    totalTrades: number;
    winRate: number;
  };
  recentTrades: FlashTrade[];
  marketData: {
    symbol: string;
    price: number;
    change24h: number;
  }[];
  notifications: Notification[];
}
```

#### 주요 위젯
1. **잔액 표시**: 현재 USDT 잔액
2. **거래 통계**: 총 거래 수, 승률, 수익
3. **최근 거래**: 최근 10개 거래 내역
4. **시장 현황**: 주요 암호화폐 가격
5. **알림 센터**: 중요 알림 및 공지사항

### 4.2 거래 통계

#### 상세 통계 페이지
```typescript
// 거래 통계 컴포넌트
const TradeStatistics = () => {
  const [stats, setStats] = useState<TradeStats>();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const fetchStats = async () => {
    const response = await fetch(`/api/user/stats?period=${period}`);
    const data = await response.json();
    setStats(data);
  };

  return (
    <div className="trade-statistics">
      <div className="period-selector">
        {['day', 'week', 'month'].map(p => (
          <button 
            key={p}
            className={period === p ? 'active' : ''}
            onClick={() => setPeriod(p)}
          >
            {p === 'day' ? '일간' : p === 'week' ? '주간' : '월간'}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>총 거래 수</h3>
          <div className="value">{stats?.totalTrades}</div>
        </div>
        
        <div className="stat-card">
          <h3>승률</h3>
          <div className="value">{stats?.winRate}%</div>
        </div>
        
        <div className="stat-card">
          <h3>총 수익</h3>
          <div className="value">${stats?.totalProfit}</div>
        </div>
        
        <div className="stat-card">
          <h3>평균 거래 금액</h3>
          <div className="value">${stats?.averageAmount}</div>
        </div>
      </div>

      <div className="charts">
        <div className="profit-chart">
          {/* 수익 차트 */}
        </div>
        <div className="trade-distribution">
          {/* 거래 분포 차트 */}
        </div>
      </div>
    </div>
  );
};
```

### 4.3 성과 분석

#### 거래 패턴 분석
- **시간대별 거래**: 가장 활발한 거래 시간
- **심볼별 성과**: 각 암호화폐별 승률
- **금액별 분석**: 거래 금액에 따른 성과
- **연속 거래**: 연승/연패 기록

#### 개선 제안
```typescript
// AI 기반 거래 분석 및 제안
const generateTradingInsights = (userStats: TradeStats) => {
  const insights = [];
  
  // 승률 분석
  if (userStats.winRate < 50) {
    insights.push({
      type: 'warning',
      title: '승률 개선 필요',
      message: '현재 승률이 50% 미만입니다. 더 신중한 거래를 권장합니다.',
      suggestion: '작은 금액으로 연습하여 패턴을 파악해보세요.'
    });
  }
  
  // 거래 금액 분석
  if (userStats.averageAmount > userStats.balance * 0.1) {
    insights.push({
      type: 'caution',
      title: '리스크 관리',
      message: '거래 금액이 잔액 대비 높습니다.',
      suggestion: '잔액의 5-10% 이내로 거래하는 것을 권장합니다.'
    });
  }
  
  return insights;
};
```

---

## 5. VIP 시스템

### 5.1 VIP 레벨 구조

#### 레벨별 혜택
```typescript
interface VIPLevel {
  level: number;
  name: string;
  requirements: {
    totalTrades?: number;
    totalVolume?: number;
    monthlyVolume?: number;
  };
  benefits: {
    bonusRate: number;        // 추가 수익률
    maxTradeAmount: number;   // 최대 거래 금액
    dailyTrades: number;      // 일일 거래 한도
    prioritySupport: boolean; // 우선 고객 지원
    specialEvents: boolean;   // 특별 이벤트 참여
  };
}

const vipLevels: VIPLevel[] = [
  {
    level: 1,
    name: 'Bronze',
    requirements: {},
    benefits: {
      bonusRate: 0.01,
      maxTradeAmount: 100,
      dailyTrades: 50,
      prioritySupport: false,
      specialEvents: false
    }
  },
  {
    level: 5,
    name: 'Gold',
    requirements: {
      totalTrades: 100,
      totalVolume: 10000
    },
    benefits: {
      bonusRate: 0.05,
      maxTradeAmount: 500,
      dailyTrades: 200,
      prioritySupport: true,
      specialEvents: true
    }
  },
  {
    level: 10,
    name: 'Diamond',
    requirements: {
      totalTrades: 1000,
      totalVolume: 100000
    },
    benefits: {
      bonusRate: 0.10,
      maxTradeAmount: 1000,
      dailyTrades: 1000,
      prioritySupport: true,
      specialEvents: true
    }
  }
];
```

### 5.2 VIP 승급 시스템

#### 승급 조건
1. **거래 횟수**: 누적 거래 횟수
2. **거래 볼륨**: 총 거래 금액
3. **활동 기간**: 지속적인 활동
4. **월간 볼륨**: 최근 30일 거래량

#### 승급 프로세스
```typescript
// VIP 레벨 확인 및 승급
const checkVIPUpgrade = async (userId: string) => {
  const userStats = await getUserStats(userId);
  const currentLevel = userStats.vipLevel;
  
  // 다음 레벨 조건 확인
  for (let level = currentLevel + 1; level <= 10; level++) {
    const requirements = vipLevels[level - 1].requirements;
    
    if (meetsRequirements(userStats, requirements)) {
      // VIP 레벨 승급
      await upgradeVIPLevel(userId, level);
      
      // 승급 알림 발송
      await sendVIPUpgradeNotification(userId, level);
      
      return level;
    }
  }
  
  return currentLevel;
};
```

### 5.3 VIP 혜택 활용

#### 추가 수익률
- **레벨 1**: +1% 추가 수익
- **레벨 5**: +5% 추가 수익  
- **레벨 10**: +10% 추가 수익

#### 특별 이벤트
```typescript
// VIP 전용 이벤트
interface VIPEvent {
  id: string;
  title: string;
  description: string;
  minVipLevel: number;
  bonusMultiplier: number;
  startDate: Date;
  endDate: Date;
}

// 현재 진행 중인 VIP 이벤트 조회
const getActiveVIPEvents = async (vipLevel: number) => {
  const response = await fetch(`/api/vip/events?level=${vipLevel}`);
  return await response.json();
};
```

---

## 6. 지갑 및 거래 내역

### 6.1 지갑 관리

#### 잔액 확인
```typescript
interface WalletInfo {
  balance: number;          // 현재 잔액
  totalDeposits: number;    // 총 입금액
  totalWithdrawals: number; // 총 출금액
  totalProfit: number;      // 총 수익
  availableBalance: number; // 사용 가능 잔액
  lockedBalance: number;    // 거래 중 잠긴 잔액
}

// 지갑 정보 조회
const getWalletInfo = async (): Promise<WalletInfo> => {
  const response = await fetch('/api/user/wallet');
  return await response.json();
};
```

#### 잔액 변동 내역
- **거래 수익/손실**: Flash Trade 결과
- **VIP 보너스**: 레벨별 추가 수익
- **이벤트 보상**: 특별 이벤트 참여 보상
- **관리자 조정**: 관리자에 의한 잔액 조정

### 6.2 거래 내역

#### 거래 내역 조회
```typescript
interface TradeHistory {
  id: string;
  symbol: string;
  amount: number;
  direction: 'up' | 'down';
  duration: number;
  startPrice: number;
  endPrice: number;
  result: 'win' | 'lose';
  profit: number;
  createdAt: Date;
  completedAt: Date;
}

// 거래 내역 조회 (페이지네이션)
const getTradeHistory = async (page: number = 1, limit: number = 20) => {
  const response = await fetch(`/api/user/trades?page=${page}&limit=${limit}`);
  return await response.json();
};
```

#### 필터링 및 검색
```typescript
// 거래 내역 필터
interface TradeFilter {
  symbol?: string;
  result?: 'win' | 'lose';
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

// 필터링된 거래 내역 조회
const getFilteredTrades = async (filter: TradeFilter) => {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });
  
  const response = await fetch(`/api/user/trades/filter?${params}`);
  return await response.json();
};
```

### 6.3 거래 내역 분석

#### 상세 분석 도구
```typescript
// 거래 내역 분석 컴포넌트
const TradeAnalysis = () => {
  const [analysis, setAnalysis] = useState<TradeAnalysisData>();

  const generateAnalysis = async () => {
    const trades = await getTradeHistory();
    
    const analysisData = {
      // 심볼별 성과
      symbolPerformance: analyzeBySymbol(trades),
      
      // 시간대별 성과
      timePerformance: analyzeByTime(trades),
      
      // 금액별 성과
      amountPerformance: analyzeByAmount(trades),
      
      // 연속 거래 패턴
      streakAnalysis: analyzeStreaks(trades)
    };
    
    setAnalysis(analysisData);
  };

  return (
    <div className="trade-analysis">
      <button onClick={generateAnalysis}>분석 실행</button>
      
      {analysis && (
        <div className="analysis-results">
          <div className="symbol-analysis">
            <h3>심볼별 성과</h3>
            {analysis.symbolPerformance.map(item => (
              <div key={item.symbol}>
                {item.symbol}: {item.winRate}% 승률
              </div>
            ))}
          </div>
          
          <div className="time-analysis">
            <h3>시간대별 성과</h3>
            {/* 시간대별 차트 */}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 7. 알림 시스템

### 7.1 알림 유형

#### 시스템 알림
```typescript
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// 알림 유형별 예시
const notificationTypes = {
  trade_result: '거래 결과 알림',
  vip_upgrade: 'VIP 레벨 승급',
  login_alert: '새로운 로그인 감지',
  system_maintenance: '시스템 점검 안내',
  special_event: '특별 이벤트 안내',
  balance_low: '잔액 부족 경고'
};
```

#### 실시간 알림
```typescript
// WebSocket 기반 실시간 알림
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const ws = new WebSocket('/ws/notifications');
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      // 새 알림 추가
      setNotifications(prev => [notification, ...prev]);
      
      // 브라우저 알림 표시
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png'
        });
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="notification-center">
      <h3>알림 센터</h3>
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification ${notification.type} ${notification.isRead ? 'read' : 'unread'}`}
        >
          <div className="notification-header">
            <h4>{notification.title}</h4>
            <span className="timestamp">
              {formatDate(notification.createdAt)}
            </span>
          </div>
          <p>{notification.message}</p>
          {notification.actionUrl && (
            <a href={notification.actionUrl} className="action-link">
              자세히 보기
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
```

### 7.2 알림 설정

#### 알림 환경설정
```typescript
interface NotificationSettings {
  email: {
    tradeResults: boolean;
    vipUpgrades: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  browser: {
    tradeResults: boolean;
    loginAlerts: boolean;
    systemAlerts: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
}

// 알림 설정 업데이트
const updateNotificationSettings = async (settings: NotificationSettings) => {
  await fetch('/api/user/notification-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};
```

---

## 8. 설정 및 개인화

### 8.1 계정 설정

#### 기본 설정
```typescript
interface UserSettings {
  // 개인 정보
  profile: {
    firstName: string;
    lastName: string;
    nickname: string;
    email: string;
  };
  
  // 지역 설정
  localization: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
  };
  
  // 거래 설정
  trading: {
    defaultAmount: number;
    defaultDuration: number;
    confirmBeforeTrade: boolean;
    autoRefresh: boolean;
  };
  
  // 보안 설정
  security: {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number;
  };
}
```

#### 설정 관리 인터페이스
```typescript
const SettingsPanel = () => {
  const [settings, setSettings] = useState<UserSettings>();
  const [activeTab, setActiveTab] = useState('profile');

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    await fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        {['profile', 'localization', 'trading', 'security'].map(tab => (
          <button 
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <ProfileSettings 
            settings={settings?.profile} 
            onUpdate={(profile) => updateSettings({ profile })}
          />
        )}
        
        {activeTab === 'trading' && (
          <TradingSettings 
            settings={settings?.trading} 
            onUpdate={(trading) => updateSettings({ trading })}
          />
        )}
        
        {/* 기타 설정 탭들 */}
      </div>
    </div>
  );
};
```

### 8.2 테마 및 UI 설정

#### 테마 선택
```typescript
interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

// 테마 적용
const applyTheme = (theme: ThemeSettings) => {
  document.documentElement.setAttribute('data-theme', theme.mode);
  document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
  document.documentElement.style.setProperty('--font-size', 
    theme.fontSize === 'small' ? '14px' : 
    theme.fontSize === 'large' ? '18px' : '16px'
  );
};
```

---

## 9. 고객 지원

### 9.1 지원 채널

#### 지원 방법
1. **라이브 채팅**: 실시간 채팅 지원 (24/7)
2. **이메일 지원**: support@cryptotrader.com
3. **FAQ**: 자주 묻는 질문 섹션
4. **티켓 시스템**: 문제 신고 및 추적

#### 지원 티켓 시스템
```typescript
interface SupportTicket {
  id: string;
  subject: string;
  category: 'technical' | 'account' | 'trading' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  attachments?: File[];
  createdAt: Date;
  updatedAt: Date;
}

// 지원 티켓 생성
const createSupportTicket = async (ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  const formData = new FormData();
  formData.append('subject', ticket.subject);
  formData.append('category', ticket.category);
  formData.append('priority', ticket.priority);
  formData.append('description', ticket.description);
  
  if (ticket.attachments) {
    ticket.attachments.forEach(file => {
      formData.append('attachments', file);
    });
  }
  
  const response = await fetch('/api/support/tickets', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};
```

### 9.2 라이브 채팅

#### 채팅 인터페이스
```typescript
// 라이브 채팅 컴포넌트
const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setInputMessage('');
    
    // 서버로 메시지 전송
    await fetch('/api/support/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: inputMessage })
    });
  };

  return (
    <div className={`live-chat ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <span>고객 지원</span>
        <span className="status online">온라인</span>
      </div>
      
      {isOpen && (
        <div className="chat-content">
          <div className="messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="content">{message.content}</div>
                <div className="timestamp">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="chat-input">
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
            />
            <button onClick={sendMessage}>전송</button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 10. FAQ 및 문제 해결

### 10.1 자주 묻는 질문

#### 계정 관련
**Q: 비밀번호를 잊어버렸어요.**
A: 로그인 페이지에서 "비밀번호 찾기"를 클릭하고 이메일 주소를 입력하세요. 비밀번호 재설정 링크가 이메일로 발송됩니다.

**Q: 이메일 주소를 변경할 수 있나요?**
A: 보안상의 이유로 이메일 주소 변경은 고객 지원팀을 통해서만 가능합니다. 지원 티켓을 생성해 주세요.

#### 거래 관련
**Q: Flash Trade는 실제 암호화폐 거래인가요?**
A: 아니요. Flash Trade는 가상 거래 시뮬레이션입니다. 실제 암호화폐를 구매하거나 판매하지 않습니다.

**Q: 거래 결과는 어떻게 결정되나요?**
A: 거래 결과는 실제 시장 데이터를 기반으로 하지만, 플랫폼 내부 알고리즘에 의해 최종 결정됩니다.

#### VIP 시스템
**Q: VIP 레벨은 어떻게 올릴 수 있나요?**
A: 거래 횟수와 거래 볼륨을 늘리면 자동으로 VIP 레벨이 상승합니다. 각 레벨별 요구사항은 VIP 페이지에서 확인할 수 있습니다.

### 10.2 일반적인 문제 해결

#### 로그인 문제
```typescript
// 로그인 문제 진단 도구
const diagnoseLoginIssue = () => {
  const issues = [];
  
  // 쿠키 확인
  if (!document.cookie.includes('session')) {
    issues.push('세션 쿠키가 없습니다. 브라우저 설정을 확인하세요.');
  }
  
  // JavaScript 확인
  if (!window.fetch) {
    issues.push('브라우저가 최신 기능을 지원하지 않습니다. 브라우저를 업데이트하세요.');
  }
  
  // 네트워크 확인
  fetch('/api/health')
    .then(response => {
      if (!response.ok) {
        issues.push('서버 연결에 문제가 있습니다.');
      }
    })
    .catch(() => {
      issues.push('인터넷 연결을 확인하세요.');
    });
  
  return issues;
};
```

#### 거래 실행 문제
1. **잔액 부족**: 거래 금액이 잔액을 초과하는지 확인
2. **일일 한도 초과**: VIP 레벨별 일일 거래 한도 확인
3. **시장 휴장**: 거래 가능 시간 확인
4. **기술적 문제**: 페이지 새로고침 후 재시도

#### 성능 최적화
```typescript
// 성능 최적화 팁
const optimizePerformance = () => {
  // 브라우저 캐시 정리
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old-version')) {
          caches.delete(name);
        }
      });
    });
  }
  
  // 불필요한 WebSocket 연결 정리
  const connections = window.activeConnections || [];
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.CLOSED) {
      ws.close();
    }
  });
  
  // 메모리 정리
  if (window.gc) {
    window.gc();
  }
};
```

### 10.3 연락처 정보

#### 고객 지원팀
- **이메일**: support@cryptotrader.com
- **라이브 채팅**: 웹사이트 우하단 채팅 버튼
- **운영 시간**: 24시간 365일
- **응답 시간**: 
  - 라이브 채팅: 즉시
  - 이메일: 24시간 이내
  - 지원 티켓: 48시간 이내

#### 기술 지원
- **기술 문의**: tech@cryptotrader.com
- **버그 신고**: bugs@cryptotrader.com
- **기능 제안**: feedback@cryptotrader.com

---

## 📞 지원 및 연락처

### 사용자 지원
- **고객 지원**: support@cryptotrader.com
- **기술 지원**: tech@cryptotrader.com
- **라이브 채팅**: 웹사이트 내 채팅 기능

### 추가 리소스
- **사용자 가이드**: help.cryptotrader.com
- **비디오 튜토리얼**: youtube.com/cryptotrader
- **커뮤니티**: community.cryptotrader.com

---

**문서 작성**: AI 개발 어시스턴트  
**검증 기준**: 실제 사용자 인터페이스 및 기능 분석  
**마지막 검증**: 2024년 12월 27일 