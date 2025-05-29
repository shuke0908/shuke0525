# VIII. 관리자 운영 가이드

**문서 버전**: 3.0.0  
**최종 업데이트**: 2024년 12월 27일  
**작성자**: AI 개발 어시스턴트  
**검증 상태**: ✅ 실제 코드베이스 분석 완료

---

## 📋 목차

1. [관리자 시스템 개요](#1-관리자-시스템-개요)
2. [관리자 대시보드](#2-관리자-대시보드)
3. [사용자 관리](#3-사용자-관리)
4. [Flash Trade 관리](#4-flash-trade-관리)
5. [시스템 설정](#5-시스템-설정)
6. [모니터링 및 분석](#6-모니터링-및-분석)
7. [보안 관리](#7-보안-관리)
8. [백업 및 복구](#8-백업-및-복구)
9. [문제 해결](#9-문제-해결)
10. [운영 절차](#10-운영-절차)

---

## 1. 관리자 시스템 개요

### 1.1 관리자 권한 체계

#### 권한 레벨
```typescript
enum AdminRole {
  ADMIN = 'admin',           // 일반 관리자
  SUPERADMIN = 'superadmin'  // 최고 관리자
}

// 권한별 접근 가능 기능
const adminPermissions = {
  admin: [
    'dashboard:view',
    'users:read',
    'users:update_status',
    'trades:read',
    'trades:manage_results',
    'reports:generate'
  ],
  superadmin: [
    'system:full_access',
    'users:create',
    'users:delete',
    'admins:manage',
    'settings:update',
    'system:maintenance'
  ]
};
```

#### 관리자 계정 생성
```bash
# 최고 관리자 계정 (하드코딩)
Email: shuke0525@jjk.app
Password: michael112
Role: superadmin

# 테스트 관리자 계정
Email: admin@jjk.app
Password: admin123
Role: admin
```

### 1.2 관리자 인터페이스 접근

#### 로그인 절차
1. **관리자 로그인 페이지** 접속: `/admin/login`
2. **인증 정보** 입력 (이메일/비밀번호)
3. **2FA 인증** (최고 관리자의 경우)
4. **관리자 대시보드** 리다이렉트

#### 보안 요구사항
- **강력한 비밀번호** 필수
- **IP 제한** 설정 가능
- **세션 타임아웃**: 2시간
- **활동 로깅**: 모든 관리 작업 기록

---

## 2. 관리자 대시보드

### 2.1 메인 대시보드

#### 핵심 지표 (KPI)
```typescript
interface DashboardMetrics {
  // 사용자 통계
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  
  // 거래 통계
  totalTrades: number;
  tradesVolume: number;
  successRate: number;
  
  // 시스템 상태
  systemHealth: 'healthy' | 'warning' | 'critical';
  serverLoad: number;
  databaseConnections: number;
}
```

#### 실시간 모니터링
- **활성 사용자 수**: WebSocket 연결 기반
- **진행 중인 거래**: 실시간 Flash Trade 현황
- **시스템 리소스**: CPU, 메모리, 디스크 사용률
- **에러 로그**: 최근 시스템 오류 현황

### 2.2 대시보드 위젯

#### 거래 현황 위젯
```typescript
// 실시간 거래 통계
const TradeStatsWidget = () => {
  const [stats, setStats] = useState({
    activeTrades: 0,
    completedToday: 0,
    totalVolume: 0,
    averageAmount: 0
  });

  // WebSocket으로 실시간 업데이트
  useEffect(() => {
    const ws = new WebSocket('/admin/ws/trade-stats');
    ws.onmessage = (event) => {
      setStats(JSON.parse(event.data));
    };
  }, []);

  return (
    <div className="stats-widget">
      <h3>거래 현황</h3>
      <div className="metrics">
        <div>진행 중: {stats.activeTrades}</div>
        <div>오늘 완료: {stats.completedToday}</div>
        <div>총 거래량: ${stats.totalVolume}</div>
      </div>
    </div>
  );
};
```

#### 사용자 활동 위젯
- **신규 가입자**: 일/주/월별 통계
- **활성 사용자**: 온라인 사용자 수
- **VIP 사용자**: VIP 레벨별 분포
- **지역별 분포**: 사용자 지역 통계

---

## 3. 사용자 관리

### 3.1 사용자 목록 및 검색

#### 사용자 검색 기능
```typescript
interface UserSearchFilters {
  email?: string;
  role?: 'user' | 'admin' | 'superadmin';
  vipLevel?: number;
  isActive?: boolean;
  registrationDate?: {
    from: Date;
    to: Date;
  };
  lastLoginDate?: {
    from: Date;
    to: Date;
  };
}

// 고급 검색 API
const searchUsers = async (filters: UserSearchFilters) => {
  return await fetch('/api/admin/users/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
};
```

#### 사용자 정보 표시
| 필드 | 설명 | 편집 가능 |
|------|------|-----------|
| **이메일** | 사용자 이메일 주소 | ❌ |
| **이름** | 성명 (firstName + lastName) | ✅ |
| **닉네임** | 표시 이름 | ✅ |
| **역할** | user/admin/superadmin | ✅ (superadmin만) |
| **VIP 레벨** | 1-10 레벨 | ✅ |
| **잔액** | USDT 잔액 | ✅ |
| **상태** | 활성/비활성/정지 | ✅ |
| **가입일** | 계정 생성일 | ❌ |
| **최종 로그인** | 마지막 접속 시간 | ❌ |

### 3.2 사용자 계정 관리

#### 계정 상태 변경
```typescript
// 사용자 상태 업데이트
const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
  const response = await fetch(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  
  if (response.ok) {
    // 사용자에게 알림 발송
    await sendUserNotification(userId, {
      title: '계정 상태 변경',
      message: `계정 상태가 ${status}로 변경되었습니다.`,
      type: 'info'
    });
  }
};
```

#### 잔액 조정
```typescript
// 사용자 잔액 수동 조정
const adjustUserBalance = async (userId: string, amount: number, reason: string) => {
  const adjustment = {
    userId,
    amount,
    reason,
    adminId: currentAdmin.id,
    timestamp: new Date()
  };
  
  // 잔액 조정 실행
  await fetch(`/api/admin/users/${userId}/balance`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adjustment)
  });
  
  // 감사 로그 기록
  await logAdminAction('balance_adjustment', adjustment);
};
```

### 3.3 VIP 시스템 관리

#### VIP 레벨 혜택 설정
```typescript
interface VIPBenefits {
  level: number;
  maxTradeAmount: number;
  bonusPercentage: number;
  prioritySupport: boolean;
  customLimits: {
    dailyTrades: number;
    withdrawalLimit: number;
  };
}

const vipLevels: VIPBenefits[] = [
  {
    level: 1,
    maxTradeAmount: 100,
    bonusPercentage: 0,
    prioritySupport: false,
    customLimits: { dailyTrades: 50, withdrawalLimit: 1000 }
  },
  {
    level: 10,
    maxTradeAmount: 10000,
    bonusPercentage: 5,
    prioritySupport: true,
    customLimits: { dailyTrades: 1000, withdrawalLimit: 100000 }
  }
];
```

---

## 4. Flash Trade 관리

### 4.1 거래 모니터링

#### 실시간 거래 현황
```typescript
// 진행 중인 거래 모니터링
const ActiveTradesMonitor = () => {
  const [activeTrades, setActiveTrades] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket('/admin/ws/active-trades');
    ws.onmessage = (event) => {
      const trades = JSON.parse(event.data);
      setActiveTrades(trades);
    };
  }, []);

  return (
    <div className="active-trades">
      <h3>진행 중인 거래 ({activeTrades.length})</h3>
      {activeTrades.map(trade => (
        <div key={trade.id} className="trade-item">
          <span>사용자: {trade.userEmail}</span>
          <span>금액: ${trade.amount}</span>
          <span>방향: {trade.direction}</span>
          <span>남은 시간: {trade.remainingTime}초</span>
          <button onClick={() => forceTradeResult(trade.id, 'win')}>
            강제 승리
          </button>
          <button onClick={() => forceTradeResult(trade.id, 'lose')}>
            강제 패배
          </button>
        </div>
      ))}
    </div>
  );
};
```

#### 거래 결과 제어
```typescript
// 관리자 거래 결과 강제 설정
const forceTradeResult = async (tradeId: string, result: 'win' | 'lose') => {
  const response = await fetch(`/api/admin/trades/${tradeId}/force-result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      result,
      adminId: currentAdmin.id,
      reason: 'Admin intervention'
    })
  });
  
  if (response.ok) {
    // 실시간으로 결과 브로드캐스트
    broadcastTradeResult(tradeId, result);
    
    // 관리자 액션 로그
    await logAdminAction('force_trade_result', {
      tradeId,
      result,
      timestamp: new Date()
    });
  }
};
```

### 4.2 승률 및 수익률 제어

#### 글로벌 승률 설정
```typescript
interface WinRateSettings {
  globalWinRate: number;        // 전체 승률 (0-100)
  userSpecificRates: {          // 사용자별 개별 승률
    [userId: string]: number;
  };
  vipBonusRate: number;         // VIP 보너스 승률
  timeBasedRates: {             // 시간대별 승률
    [hour: string]: number;
  };
}

// 승률 설정 업데이트
const updateWinRateSettings = async (settings: WinRateSettings) => {
  await fetch('/api/admin/settings/win-rates', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  
  // 설정 변경 즉시 적용
  await applyWinRateSettings(settings);
};
```

#### 수익률 제어
```typescript
interface ProfitSettings {
  winProfitRate: number;        // 승리 시 수익률 (기본 85%)
  lossProfitRate: number;       // 패배 시 손실률 (기본 100%)
  houseFeeRate: number;         // 하우스 수수료 (기본 15%)
  vipBonusProfit: {             // VIP 보너스 수익률
    [level: number]: number;
  };
}
```

### 4.3 거래 통계 및 분석

#### 거래 분석 대시보드
```typescript
// 거래 통계 조회
const getTradeAnalytics = async (period: 'day' | 'week' | 'month') => {
  const response = await fetch(`/api/admin/analytics/trades?period=${period}`);
  return await response.json();
};

// 분석 데이터 구조
interface TradeAnalytics {
  totalTrades: number;
  totalVolume: number;
  winRate: number;
  profitLoss: number;
  topTraders: Array<{
    userId: string;
    email: string;
    tradeCount: number;
    volume: number;
    winRate: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    tradeCount: number;
    volume: number;
  }>;
}
```

---

## 5. 시스템 설정

### 5.1 플랫폼 설정

#### 기본 설정 관리
```typescript
interface PlatformSettings {
  // 거래 설정
  trading: {
    minTradeAmount: number;
    maxTradeAmount: number;
    availableDurations: number[];
    defaultWinRate: number;
  };
  
  // 사용자 설정
  user: {
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
    defaultVipLevel: number;
    initialBalance: number;
  };
  
  // 시스템 설정
  system: {
    maintenanceMode: boolean;
    maxConcurrentUsers: number;
    sessionTimeout: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

#### 설정 업데이트 인터페이스
```typescript
const SettingsPanel = () => {
  const [settings, setSettings] = useState<PlatformSettings>();
  
  const updateSettings = async (newSettings: Partial<PlatformSettings>) => {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    
    if (response.ok) {
      // 설정 변경 즉시 적용
      await applySettings(newSettings);
      
      // 관리자 알림
      showNotification('설정이 성공적으로 업데이트되었습니다.', 'success');
    }
  };

  return (
    <div className="settings-panel">
      <h2>시스템 설정</h2>
      
      <section>
        <h3>거래 설정</h3>
        <label>
          최소 거래 금액:
          <input 
            type="number" 
            value={settings?.trading.minTradeAmount}
            onChange={(e) => updateSettings({
              trading: { ...settings?.trading, minTradeAmount: Number(e.target.value) }
            })}
          />
        </label>
      </section>
      
      <section>
        <h3>시스템 설정</h3>
        <label>
          <input 
            type="checkbox" 
            checked={settings?.system.maintenanceMode}
            onChange={(e) => updateSettings({
              system: { ...settings?.system, maintenanceMode: e.target.checked }
            })}
          />
          유지보수 모드
        </label>
      </section>
    </div>
  );
};
```

### 5.2 알림 및 메시지 관리

#### 시스템 공지사항
```typescript
interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'maintenance' | 'promotion';
  targetUsers: 'all' | 'vip' | 'specific';
  userIds?: string[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

// 공지사항 생성
const createAnnouncement = async (announcement: Omit<SystemAnnouncement, 'id'>) => {
  const response = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(announcement)
  });
  
  if (response.ok) {
    // 대상 사용자들에게 즉시 알림 발송
    await broadcastAnnouncement(announcement);
  }
};
```

---

## 6. 모니터링 및 분석

### 6.1 시스템 모니터링

#### 서버 상태 모니터링
```typescript
interface SystemHealth {
  server: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  database: {
    connections: number;
    queryTime: number;
    size: number;
  };
  redis: {
    memory: number;
    connections: number;
    hitRate: number;
  };
  websocket: {
    activeConnections: number;
    messagesPerSecond: number;
  };
}

// 실시간 시스템 상태 조회
const getSystemHealth = async (): Promise<SystemHealth> => {
  const response = await fetch('/api/admin/system/health');
  return await response.json();
};
```

#### 성능 메트릭
```typescript
// 성능 지표 대시보드
const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<SystemHealth>();
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const health = await getSystemHealth();
      setMetrics(health);
    }, 5000); // 5초마다 업데이트
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-metrics">
      <div className="metric-card">
        <h3>서버 상태</h3>
        <div>CPU: {metrics?.server.cpu}%</div>
        <div>메모리: {metrics?.server.memory}%</div>
        <div>디스크: {metrics?.server.disk}%</div>
      </div>
      
      <div className="metric-card">
        <h3>데이터베이스</h3>
        <div>연결 수: {metrics?.database.connections}</div>
        <div>쿼리 시간: {metrics?.database.queryTime}ms</div>
      </div>
      
      <div className="metric-card">
        <h3>WebSocket</h3>
        <div>활성 연결: {metrics?.websocket.activeConnections}</div>
        <div>메시지/초: {metrics?.websocket.messagesPerSecond}</div>
      </div>
    </div>
  );
};
```

### 6.2 비즈니스 분석

#### 수익 분석
```typescript
interface RevenueAnalytics {
  totalRevenue: number;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    trades: number;
  }>;
  revenueByVipLevel: Array<{
    level: number;
    revenue: number;
    userCount: number;
  }>;
  topRevenueUsers: Array<{
    userId: string;
    email: string;
    revenue: number;
    tradeCount: number;
  }>;
}

// 수익 분석 조회
const getRevenueAnalytics = async (startDate: Date, endDate: Date) => {
  const response = await fetch('/api/admin/analytics/revenue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate })
  });
  return await response.json();
};
```

---

## 7. 보안 관리

### 7.1 보안 모니터링

#### 의심스러운 활동 감지
```typescript
interface SecurityAlert {
  id: string;
  type: 'login_failure' | 'suspicious_trading' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  description: string;
  timestamp: Date;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

// 보안 알림 목록 조회
const getSecurityAlerts = async (status?: string) => {
  const response = await fetch(`/api/admin/security/alerts?status=${status || 'new'}`);
  return await response.json();
};

// 보안 알림 처리
const handleSecurityAlert = async (alertId: string, action: 'investigate' | 'resolve' | 'block_user') => {
  await fetch(`/api/admin/security/alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
};
```

### 7.2 IP 관리

#### IP 차단 관리
```typescript
interface IPBlock {
  id: string;
  ipAddress: string;
  reason: string;
  blockedBy: string;
  blockedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// IP 차단
const blockIP = async (ipAddress: string, reason: string, duration?: number) => {
  const blockData = {
    ipAddress,
    reason,
    duration, // 시간 (초), undefined면 영구 차단
    adminId: currentAdmin.id
  };
  
  await fetch('/api/admin/security/block-ip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blockData)
  });
};
```

---

## 8. 백업 및 복구

### 8.1 데이터 백업

#### 수동 백업 실행
```typescript
// 데이터베이스 백업 트리거
const triggerBackup = async (type: 'full' | 'incremental') => {
  const response = await fetch('/api/admin/backup/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  
  if (response.ok) {
    const { jobId } = await response.json();
    
    // 백업 진행 상황 모니터링
    monitorBackupProgress(jobId);
  }
};

// 백업 진행 상황 모니터링
const monitorBackupProgress = (jobId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/admin/backup/status/${jobId}`);
    const status = await response.json();
    
    if (status.completed) {
      clearInterval(interval);
      showNotification('백업이 완료되었습니다.', 'success');
    }
  }, 2000);
};
```

#### 백업 스케줄 관리
```typescript
interface BackupSchedule {
  id: string;
  type: 'full' | 'incremental';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM 형식
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

// 백업 스케줄 설정
const updateBackupSchedule = async (schedule: BackupSchedule) => {
  await fetch('/api/admin/backup/schedule', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule)
  });
};
```

### 8.2 시스템 복구

#### 복구 절차
```typescript
// 시스템 복구 실행
const initiateSystemRestore = async (backupId: string) => {
  // 복구 전 확인
  const confirmed = confirm(
    '시스템 복구를 실행하시겠습니까? 현재 데이터가 손실될 수 있습니다.'
  );
  
  if (confirmed) {
    // 유지보수 모드 활성화
    await enableMaintenanceMode();
    
    // 복구 실행
    const response = await fetch('/api/admin/restore/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupId })
    });
    
    if (response.ok) {
      // 복구 진행 상황 모니터링
      monitorRestoreProgress();
    }
  }
};
```

---

## 9. 문제 해결

### 9.1 일반적인 문제들

#### 사용자 로그인 문제
```typescript
// 사용자 로그인 문제 해결
const troubleshootUserLogin = async (userEmail: string) => {
  // 1. 사용자 계정 상태 확인
  const user = await getUserByEmail(userEmail);
  if (!user.isActive) {
    return '계정이 비활성화되어 있습니다.';
  }
  
  // 2. 로그인 시도 기록 확인
  const loginAttempts = await getLoginAttempts(userEmail, 24); // 24시간
  if (loginAttempts.failedCount > 5) {
    return '계정이 잠겨있습니다. 잠금을 해제하시겠습니까?';
  }
  
  // 3. IP 차단 확인
  const isBlocked = await checkIPBlock(user.lastLoginIP);
  if (isBlocked) {
    return 'IP가 차단되어 있습니다.';
  }
  
  return '문제를 찾을 수 없습니다.';
};

// 계정 잠금 해제
const unlockUserAccount = async (userId: string) => {
  await fetch(`/api/admin/users/${userId}/unlock`, {
    method: 'POST'
  });
  
  // 사용자에게 알림 발송
  await sendUserNotification(userId, {
    title: '계정 잠금 해제',
    message: '관리자에 의해 계정 잠금이 해제되었습니다.',
    type: 'info'
  });
};
```

#### 거래 문제 해결
```typescript
// 거래 문제 진단
const diagnoseTradingIssue = async (tradeId: string) => {
  const trade = await getTradeById(tradeId);
  
  const issues = [];
  
  // 거래 상태 확인
  if (trade.status === 'pending' && trade.endTime < new Date()) {
    issues.push('거래가 시간 초과되었지만 완료되지 않음');
  }
  
  // 사용자 잔액 확인
  const user = await getUserById(trade.userId);
  if (user.balance < trade.amount) {
    issues.push('사용자 잔액 부족');
  }
  
  // 시스템 상태 확인
  const systemHealth = await getSystemHealth();
  if (systemHealth.server.cpu > 90) {
    issues.push('서버 과부하');
  }
  
  return issues;
};
```

### 9.2 시스템 문제 해결

#### 성능 문제 진단
```typescript
// 성능 문제 진단 도구
const diagnosePerformanceIssue = async () => {
  const diagnosis = {
    database: await diagnoseDatabasePerformance(),
    server: await diagnoseServerPerformance(),
    network: await diagnoseNetworkPerformance()
  };
  
  return diagnosis;
};

const diagnoseDatabasePerformance = async () => {
  // 느린 쿼리 조회
  const slowQueries = await getSlowQueries();
  
  // 데이터베이스 연결 수 확인
  const connections = await getDatabaseConnections();
  
  // 인덱스 사용률 확인
  const indexUsage = await getIndexUsage();
  
  return { slowQueries, connections, indexUsage };
};
```

---

## 10. 운영 절차

### 10.1 일상 운영 체크리스트

#### 매일 확인 사항
- [ ] **시스템 상태** 확인 (CPU, 메모리, 디스크)
- [ ] **활성 사용자 수** 모니터링
- [ ] **거래 통계** 검토 (거래량, 승률)
- [ ] **에러 로그** 확인
- [ ] **보안 알림** 검토
- [ ] **백업 상태** 확인

#### 주간 확인 사항
- [ ] **사용자 증가율** 분석
- [ ] **수익 분석** 리포트 생성
- [ ] **시스템 성능** 트렌드 분석
- [ ] **보안 감사** 로그 검토
- [ ] **데이터베이스 최적화** 실행

#### 월간 확인 사항
- [ ] **전체 시스템 백업** 실행
- [ ] **보안 정책** 검토 및 업데이트
- [ ] **사용자 권한** 재검토
- [ ] **성능 최적화** 계획 수립
- [ ] **비즈니스 분석** 리포트 작성

### 10.2 긴급 상황 대응

#### 시스템 장애 대응
```typescript
// 긴급 상황 대응 절차
const handleEmergency = async (type: 'system_down' | 'security_breach' | 'data_corruption') => {
  // 1. 즉시 알림 발송
  await sendEmergencyAlert(type);
  
  // 2. 유지보수 모드 활성화
  await enableMaintenanceMode();
  
  // 3. 상황별 대응
  switch (type) {
    case 'system_down':
      await handleSystemDown();
      break;
    case 'security_breach':
      await handleSecurityBreach();
      break;
    case 'data_corruption':
      await handleDataCorruption();
      break;
  }
  
  // 4. 복구 후 정상 운영 재개
  await disableMaintenanceMode();
  
  // 5. 사후 분석 및 보고서 작성
  await generateIncidentReport(type);
};
```

#### 보안 사고 대응
```typescript
const handleSecurityBreach = async () => {
  // 1. 모든 사용자 세션 무효화
  await invalidateAllSessions();
  
  // 2. 의심스러운 IP 차단
  await blockSuspiciousIPs();
  
  // 3. 데이터베이스 접근 로그 분석
  const accessLogs = await analyzeAccessLogs();
  
  // 4. 영향받은 사용자 식별
  const affectedUsers = await identifyAffectedUsers(accessLogs);
  
  // 5. 사용자들에게 보안 알림 발송
  await notifyAffectedUsers(affectedUsers);
  
  // 6. 보안 패치 적용
  await applySecurityPatches();
};
```

---

## 📞 지원 및 연락처

### 관리자 지원
- **기술 지원**: admin-support@cryptotrader.com
- **긴급 상황**: +82-10-xxxx-xxxx (24시간)
- **시스템 문의**: system-admin@cryptotrader.com

### 교육 및 문서
- **관리자 교육**: admin-training@cryptotrader.com
- **문서 업데이트**: docs-admin@cryptotrader.com

---

**문서 작성**: AI 개발 어시스턴트  
**검증 기준**: 실제 관리자 기능 및 운영 절차 분석  
**마지막 검증**: 2024년 12월 27일 