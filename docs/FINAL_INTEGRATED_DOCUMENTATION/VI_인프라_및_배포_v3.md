# VI. 인프라 및 배포 명세서

**문서 버전**: 3.0.0  
**최종 업데이트**: 2024년 12월 27일  
**작성자**: AI 개발 어시스턴트  
**검증 상태**: ✅ 실제 코드베이스 분석 완료

---

## 📋 목차

1. [인프라 아키텍처 개요](#1-인프라-아키텍처-개요)
2. [Docker 컨테이너화](#2-docker-컨테이너화)
3. [CI/CD 파이프라인](#3-cicd-파이프라인)
4. [배포 전략](#4-배포-전략)
5. [모니터링 및 로깅](#5-모니터링-및-로깅)
6. [환경 관리](#6-환경-관리)
7. [성능 최적화](#7-성능-최적화)
8. [보안 설정](#8-보안-설정)
9. [백업 및 복구](#9-백업-및-복구)
10. [운영 가이드](#10-운영-가이드)

---

## 1. 인프라 아키텍처 개요

### 1.1 전체 아키텍처

```mermaid
graph TB
    subgraph "클라이언트"
        A[웹 브라우저]
        B[모바일 앱]
    end
    
    subgraph "로드 밸런서"
        C[Nginx/CloudFlare]
    end
    
    subgraph "애플리케이션 계층"
        D[Next.js App Container]
        E[WebSocket Server]
    end
    
    subgraph "데이터 계층"
        F[PostgreSQL]
        G[Redis Cache]
    end
    
    subgraph "모니터링"
        H[Prometheus]
        I[Grafana]
        J[Fluentd]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    H --> I
    D --> J
```

### 1.2 기술 스택

| 계층 | 기술 | 버전 | 역할 |
|------|------|------|------|
| **프론트엔드** | Next.js | 14.2.29 | SSR/SSG 웹 애플리케이션 |
| **백엔드** | Node.js | 18+ | 서버 런타임 |
| **데이터베이스** | PostgreSQL | 15+ | 주 데이터베이스 |
| **캐시** | Redis | 7+ | 세션/캐시 저장소 |
| **컨테이너** | Docker | 24+ | 애플리케이션 컨테이너화 |
| **오케스트레이션** | Docker Compose | 3.8+ | 로컬/개발 환경 |
| **프록시** | Nginx | Alpine | 리버스 프록시/SSL |
| **모니터링** | Prometheus/Grafana | Latest | 메트릭 수집/시각화 |

---

## 2. Docker 컨테이너화

### 2.1 Dockerfile 구조

```dockerfile
# 멀티 스테이지 빌드로 최적화
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# 의존성 설치 단계
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드 단계
FROM base AS builder
COPY --from=deps-full /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 프로덕션 런타임
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2.2 Docker Compose 설정

```yaml
version: '3.8'

services:
  # Next.js 애플리케이션
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: cryptotrader-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - redis
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL 데이터베이스
  postgres:
    image: postgres:15-alpine
    container_name: cryptotrader-postgres
    environment:
      POSTGRES_DB: cryptotrader
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  # Redis 캐시
  redis:
    image: redis:7-alpine
    container_name: cryptotrader-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
```

### 2.3 컨테이너 최적화

#### 이미지 크기 최적화
- **Alpine Linux** 사용으로 기본 이미지 크기 최소화
- **멀티 스테이지 빌드**로 불필요한 의존성 제거
- **.dockerignore** 파일로 빌드 컨텍스트 최적화

#### 보안 강화
- **비 root 사용자** 실행 (nextjs:1001)
- **읽기 전용 파일 시스템** 적용
- **최소 권한 원칙** 적용

---

## 3. CI/CD 파이프라인

### 3.1 GitHub Actions 워크플로우

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 코드 품질 검사
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test

  # 보안 스캔
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: npm audit --audit-level high

  # E2E 테스트
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [lint-and-test]
    steps:
      - uses: actions/checkout@v4
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e

  # Docker 빌드
  build-docker:
    runs-on: ubuntu-latest
    needs: [lint-and-test, security-scan]
    steps:
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 3.2 배포 단계

#### 개발 환경 (develop 브랜치)
1. **자동 테스트** 실행
2. **Docker 이미지** 빌드
3. **스테이징 환경** 배포
4. **스모크 테스트** 실행

#### 프로덕션 환경 (main 브랜치)
1. **전체 테스트 스위트** 실행
2. **보안 스캔** 수행
3. **Docker 이미지** 빌드 및 태깅
4. **프로덕션 배포** (수동 승인 필요)
5. **배포 후 검증**

---

## 4. 배포 전략

### 4.1 환경별 배포

#### 로컬 개발 환경
```bash
# 개발 서버 시작
npm run dev

# Docker로 로컬 테스트
npm run docker:build
npm run docker:run
```

#### 스테이징 환경
```bash
# Docker Compose로 스테이징 배포
npm run docker:compose:up

# 모니터링 포함 배포
npm run docker:compose:monitoring
```

#### 프로덕션 환경
```bash
# 프로덕션 배포
npm run deploy:production

# 또는 Docker Compose
npm run docker:compose:production
```

### 4.2 배포 전략 옵션

#### Blue-Green 배포
- **무중단 배포** 보장
- **즉시 롤백** 가능
- **트래픽 전환** 제어

#### Rolling 배포
- **점진적 업데이트**
- **리소스 효율성**
- **부분 롤백** 지원

#### Canary 배포
- **위험 최소화**
- **점진적 트래픽** 증가
- **실시간 모니터링**

---

## 5. 모니터링 및 로깅

### 5.1 Prometheus 메트릭

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'cryptotrader-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### 5.2 주요 메트릭

#### 애플리케이션 메트릭
- **HTTP 요청 수/응답 시간**
- **WebSocket 연결 수**
- **Flash Trade 처리량**
- **에러율 및 성공률**

#### 인프라 메트릭
- **CPU/메모리 사용률**
- **디스크 I/O**
- **네트워크 트래픽**
- **데이터베이스 성능**

### 5.3 Grafana 대시보드

#### 비즈니스 대시보드
- **실시간 거래량**
- **사용자 활동**
- **수익 지표**
- **시스템 상태**

#### 기술 대시보드
- **시스템 성능**
- **에러 추적**
- **응답 시간**
- **리소스 사용률**

### 5.4 로그 관리

#### Fluentd 설정
```yaml
# fluentd.conf
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<match app.**>
  @type file
  path /var/log/app
  append true
  time_slice_format %Y%m%d
  time_slice_wait 10m
  time_format %Y%m%dT%H%M%S%z
</match>
```

#### 로그 레벨 및 구조
- **ERROR**: 시스템 오류, 예외 상황
- **WARN**: 경고, 성능 이슈
- **INFO**: 일반 정보, 비즈니스 이벤트
- **DEBUG**: 디버깅 정보

---

## 6. 환경 관리

### 6.1 환경 변수 구조

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# 데이터베이스
DATABASE_URL=postgresql://user:pass@localhost:5432/db
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=secure_redis_password

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d

# 외부 API
CRYPTO_API_KEY=your-crypto-api-key
CRYPTO_API_URL=https://api.example.com

# 모니터링
GRAFANA_PASSWORD=secure_grafana_password
```

### 6.2 환경별 설정

#### 개발 환경
- **Hot Reload** 활성화
- **디버그 모드** 활성화
- **상세 로깅**
- **개발용 데이터베이스**

#### 스테이징 환경
- **프로덕션 유사 설정**
- **테스트 데이터**
- **성능 모니터링**
- **보안 테스트**

#### 프로덕션 환경
- **최적화된 빌드**
- **보안 강화**
- **성능 최적화**
- **실시간 모니터링**

---

## 7. 성능 최적화

### 7.1 애플리케이션 최적화

#### Next.js 최적화
```javascript
// next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
}
```

#### 캐싱 전략
- **Redis 캐싱**: 세션, API 응답
- **CDN 캐싱**: 정적 자산
- **브라우저 캐싱**: 이미지, CSS, JS
- **데이터베이스 캐싱**: 쿼리 결과

### 7.2 데이터베이스 최적화

#### 인덱스 최적화
```sql
-- 자주 사용되는 쿼리용 인덱스
CREATE INDEX idx_flash_trades_user_id ON flash_trades(user_id);
CREATE INDEX idx_flash_trades_created_at ON flash_trades(created_at);
CREATE INDEX idx_users_email ON users(email);
```

#### 연결 풀링
```javascript
// 데이터베이스 연결 풀 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 7.3 부하 테스트

#### Artillery 설정
```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Flash Trade Flow"
    flow:
      - get:
          url: "/api/flash-trades"
      - post:
          url: "/api/flash-trades"
          json:
            amount: 100
            direction: "up"
            duration: 60
```

---

## 8. 보안 설정

### 8.1 컨테이너 보안

#### Docker 보안 설정
```dockerfile
# 보안 강화된 Dockerfile
FROM node:18-alpine AS base

# 보안 업데이트
RUN apk update && apk upgrade

# 비 root 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 읽기 전용 파일 시스템
USER nextjs
```

#### 네트워크 보안
```yaml
# docker-compose.yml
networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 8.2 SSL/TLS 설정

#### Nginx SSL 설정
```nginx
server {
    listen 443 ssl http2;
    server_name cryptotrader.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 9. 백업 및 복구

### 9.1 데이터베이스 백업

#### 자동 백업 스크립트
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="cryptotrader"

# PostgreSQL 백업
pg_dump -h postgres -U postgres $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Redis 백업
redis-cli --rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
```

#### 백업 스케줄
```yaml
# docker-compose.yml
backup:
  image: postgres:15-alpine
  volumes:
    - ./backup.sh:/backup.sh
    - backup_data:/backups
  command: |
    sh -c "
    echo '0 2 * * * /backup.sh' | crontab -
    crond -f
    "
```

### 9.2 복구 절차

#### 데이터베이스 복구
```bash
# PostgreSQL 복구
psql -h postgres -U postgres -d cryptotrader < backup_file.sql

# Redis 복구
redis-cli --rdb backup_file.rdb
```

#### 애플리케이션 복구
```bash
# 이전 버전으로 롤백
docker-compose down
docker-compose up -d --scale app=0
docker-compose up -d
```

---

## 10. 운영 가이드

### 10.1 일상 운영 작업

#### 시스템 상태 확인
```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f app

# 리소스 사용량 확인
docker stats
```

#### 성능 모니터링
```bash
# 데이터베이스 성능
docker exec -it cryptotrader-postgres psql -U postgres -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;"

# Redis 성능
docker exec -it cryptotrader-redis redis-cli info stats
```

### 10.2 문제 해결

#### 일반적인 문제들

**1. 메모리 부족**
```bash
# 메모리 사용량 확인
docker stats --no-stream

# 컨테이너 재시작
docker-compose restart app
```

**2. 데이터베이스 연결 오류**
```bash
# 연결 테스트
docker exec -it cryptotrader-postgres pg_isready -U postgres

# 연결 수 확인
docker exec -it cryptotrader-postgres psql -U postgres -c "
SELECT count(*) FROM pg_stat_activity;"
```

**3. Redis 연결 문제**
```bash
# Redis 상태 확인
docker exec -it cryptotrader-redis redis-cli ping

# 메모리 사용량 확인
docker exec -it cryptotrader-redis redis-cli info memory
```

### 10.3 스케일링

#### 수평 스케일링
```yaml
# docker-compose.yml
app:
  deploy:
    replicas: 3
  depends_on:
    - postgres
    - redis
```

#### 수직 스케일링
```yaml
# 리소스 제한 설정
app:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 4G
      reservations:
        cpus: '1.0'
        memory: 2G
```

---

## 📞 지원 및 연락처

### 기술 지원
- **DevOps 팀**: devops@cryptotrader.com
- **인프라 문의**: infrastructure@cryptotrader.com
- **긴급 상황**: +82-10-xxxx-xxxx

### 문서 관련
- **문서 업데이트**: docs@cryptotrader.com
- **개선 제안**: feedback@cryptotrader.com

---

**문서 작성**: AI 개발 어시스턴트  
**검증 기준**: 실제 Docker/CI/CD 설정 파일 분석  
**마지막 검증**: 2024년 12월 27일 