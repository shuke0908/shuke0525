# API 마이그레이션 계획

## 현재 상황
- 기존 `src/lib/api.ts`: 레거시 apiRequest 함수 사용 (509줄)
- 새로운 `src/lib/api-unified.ts`: 통합 API 클라이언트 시스템 (499줄)
- 기존 `src/lib/api-client.ts`: Axios 기반 클라이언트 (51줄)

## 마이그레이션 목표
1. 모든 API 호출을 통합 시스템으로 변경
2. 타입 안전성 보장
3. 에러 처리 일관성 확보
4. 토큰 관리 자동화

## 마이그레이션 단계

### 1단계: 기존 파일 백업 및 새로운 엔트리 포인트 생성
- [x] `api-unified.ts` 생성 완료
- [ ] 기존 `api.ts`를 `api-legacy.ts`로 백업
- [ ] 새로운 `api.ts` 생성 (통합 시스템 사용)

### 2단계: 서비스별 마이그레이션
- [ ] AuthService 마이그레이션
- [ ] UserService 마이그레이션  
- [ ] TradeService 마이그레이션
- [ ] AdminService 마이그레이션
- [ ] FinanceService 마이그레이션
- [ ] KycService 마이그레이션

### 3단계: 컴포넌트 및 페이지 업데이트
- [ ] 모든 import 문 업데이트
- [ ] API 호출 방식 변경
- [ ] 에러 처리 로직 업데이트

### 4단계: 테스트 및 검증
- [ ] 기능별 테스트
- [ ] 에러 처리 테스트
- [ ] 성능 테스트

### 5단계: 정리
- [ ] 레거시 파일 제거
- [ ] 문서 업데이트

## 주요 변경사항

### API 호출 방식 변경
```typescript
// 기존 방식
import { login } from '@/lib/api';
const result = await login(email, password);

// 새로운 방식
import { api } from '@/lib/api';
const result = await api.auth.login({ email, password });
```

### 에러 처리 개선
- 통일된 에러 형식
- 자동 토큰 갱신
- 재시도 로직

### 타입 안전성
- 모든 API 응답에 타입 정의
- 요청 데이터 검증
- 런타임 스키마 검증 