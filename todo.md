# 프로젝트 최적화 작업 목록

## 단계 1: 초기 설정 및 분석
- [x] 프로젝트 압축 해제 및 파일 구조 분석

## 단계 2: 코드 정적 분석 및 수정
- [ ] ESLint 설정 점검 및 오류/경고 해결
    - [ ] `src/lib/api-client-unified.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/lib/error-handler.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/lib/query-client-enhanced.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/lib/security-manager.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/lib/simplified-trade-logic.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/lib/utils.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/lib/websocket-client.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/services/domain/UserDomainService.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/services/domain/base/DomainService.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/tests/setup.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/types/index.ts`: 미사용 변수/인자 경고 수정
    - [ ] `src/types/websocket.ts`: 미사용 변수/인자 경고 수정
- [ ] TypeScript 설정 점검 및 오류/경고 해결
- [ ] Prettier 설정 점검 및 포맷팅 일관성 확보
- [x] Husky `prepare` 스크립트 오류 해결 (임시 제거 후 단계 11에서 재검토)
- [ ] `lint-staged` 설정 제거 (임시 제거 후 단계 11에서 재검토)

## 단계 3 & 4: 코드 및 의존성 정리
- [ ] 미사용 코드 (함수, 변수, import, 컴포넌트, 파일) 식별 및 제거
- [ ] `depcheck` 실행 및 결과 분석
- [ ] 불필요/중복 의존성 제거 (`npm prune`)
- [ ] 의존성 버전 업데이트 및 `npm audit` 보안 취약점 점검/수정
- [ ] Deprecated 패키지 검토 및 교체/제거

## 단계 5 & 6: App Router, SSR, Supabase 안정성 강화
- [ ] App Router 기반 페이지/API 라우트 구조 검토 및 필요시 수정
- [ ] SSR 환경에서 충돌 가능성 있는 코드 (`window`, `localStorage` 등) SSR-safe 처리
- [ ] Supabase 클라이언트 초기화 및 사용 방식 점검
- [ ] Supabase 인증/세션 관리 로직 검토 및 에러 처리 보강
- [ ] Supabase 데이터 fetch 로직 검토 및 에러/로딩 상태 처리 보강
- [ ] Dynamic route (`params`) 사용 시 유효성 검사 추가
- [ ] 브라우저/서버 환경 차이로 인한 잠재적 오류 방지 코드 추가

## 단계 7 & 8: 환경설정, SEO, 전역 레이아웃
- [ ] `.env.example` 파일 생성 및 최신화 (실제 사용 환경변수 기준)
- [ ] 미사용 환경변수 제거
- [ ] `vercel.json` 필요시 생성/구성 (리다이렉트, 헤더 등)
- [ ] `robots.txt` 생성/구성
- [ ] `sitemap.xml` 자동 생성 로직 검토 또는 수동 생성
- [ ] `app/layout.tsx` 구조 및 메타데이터 점검/보완
- [ ] `app/head.tsx` 또는 `generateMetadata` 사용 점검 및 SEO 최적화
- [ ] `app/global-error.tsx` 구현 및 전역 에러 처리 보강

## 단계 9: 프론트엔드 최적화
- [ ] 모바일 반응형 디자인 검토 및 Tailwind breakpoints 조정/보강
- [ ] `next/image` 컴포넌트 사용 최적화 (priority, sizes 등)
- [ ] `dynamic import` 및 `React.lazy` 활용한 코드 분할 적용 검토
- [ ] 컴포넌트 렌더링 최적화 (Memoization 등)

## 단계 10: 운영 및 안정성
- [ ] 전역 상태 관리 (Context API, Zustand 등) 로직 점검
- [ ] 인증 상태 유지 (새로고침, 탭 이동 시) 시나리오 테스트 및 보완
- [ ] 클라이언트/서버 로깅 전략 수립 및 `console.error` 활용
- [ ] Error Boundary 컴포넌트 적용 및 에러 리포팅 강화

## 단계 11: 개발 워크플로우 및 CI/CD
- [ ] Husky, commit hooks 설정 재검토 및 필요시 복구/수정 또는 제거
- [ ] CI/CD 관련 설정 파일 (e.g., GitHub Actions workflows) 점검 및 정리

## 단계 12: 최종 빌드 및 검증
- [ ] `npm run build` 실행 및 빌드 성공 확인 (Vercel 환경 기준)
- [ ] 빌드 결과물 분석 (청크 크기 등)
- [ ] 최종 코드 리뷰 (셀프)

## 단계 13 & 14: 문서화 및 결과 전달
- [ ] `README.md` 작성 (프로젝트 설명, 설정, 실행, 배포 방법 포함)
- [ ] 불필요 파일/폴더 (`.next`, `node_modules`, `.env*`, `.git` 등) 제외 확인
- [ ] 최종 프로젝트 폴더 압축 (`project-final-optimized.zip`)
- [ ] 사용자에게 결과물 및 완료 보고 전달
