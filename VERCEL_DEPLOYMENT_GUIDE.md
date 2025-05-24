# 🚀 Vercel 배포 완전 가이드

초보자도 따라할 수 있는 단계별 Vercel 배포 가이드입니다.

## 📋 배포 전 준비사항

### 1. 필요한 계정 생성
- [GitHub 계정](https://github.com) - 소스코드 저장용
- [Vercel 계정](https://vercel.com) - 배포용 (GitHub 계정으로 가입 가능)
- [Supabase 계정](https://supabase.com) - 데이터베이스용

### 2. 프로젝트 GitHub에 업로드
```bash
# 1. 프로젝트 폴더에서 터미널 열기
cd your-project-folder

# 2. Git 초기화 (이미 되어있다면 생략)
git init

# 3. 모든 파일 추가
git add .

# 4. 첫 번째 커밋
git commit -m "Initial commit"

# 5. GitHub에 새 저장소 생성 후 연결
git remote add origin https://github.com/your-username/your-repo-name.git

# 6. GitHub에 푸시
git push -u origin main
```

## 🔑 환경변수 준비

### 필수 환경변수 목록

#### 1. Supabase 설정 (필수)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**어디서 찾나요?**
1. [Supabase 대시보드](https://app.supabase.com)로 이동
2. 프로젝트 선택
3. 좌측 메뉴에서 "Settings" → "API" 클릭
4. "Project URL"과 "anon public" 키를 복사
5. "service_role secret" 키도 복사 (보안 주의!)

#### 2. 애플리케이션 URL (필수)
```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app/api
CORS_ORIGIN=https://your-app-name.vercel.app
```

**주의사항:**
- `your-app-name`은 Vercel에서 배포할 때 정해집니다
- 처음에는 임시로 설정하고, 배포 후 실제 URL로 변경해야 합니다

#### 3. 보안 키 (필수)
```
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-super-secure-session-secret-key-here
NEXTAUTH_SECRET=your-nextauth-secret-key-here
```

**생성 방법:**
```bash
# 터미널에서 랜덤 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. 선택적 환경변수

**구글 서비스 (OAuth, Analytics)**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
```

**이메일 서비스**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**기타**
```
NODE_ENV=production
```

## 🚀 Vercel 배포 단계

### 1단계: Vercel 계정 설정
1. [Vercel](https://vercel.com)에 접속
2. "Sign up" 클릭
3. "Continue with GitHub" 선택
4. GitHub 계정으로 로그인

### 2단계: 새 프로젝트 생성
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 목록에서 프로젝트 선택
3. "Import" 클릭

### 3단계: 프로젝트 설정
1. **Project Name**: 원하는 이름 입력 (URL이 됩니다)
2. **Framework Preset**: "Next.js" 자동 선택됨
3. **Root Directory**: 그대로 두기
4. **Build Command**: `npm run build` (자동 설정됨)
5. **Output Directory**: `.next` (자동 설정됨)

### 4단계: 환경변수 설정
1. "Environment Variables" 섹션으로 스크롤
2. 위에서 준비한 환경변수들을 하나씩 추가:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project-id.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: your-supabase-anon-key

Name: SUPABASE_SERVICE_ROLE_KEY
Value: your-supabase-service-role-key

Name: JWT_SECRET
Value: your-generated-jwt-secret

Name: SESSION_SECRET
Value: your-generated-session-secret

Name: NEXTAUTH_SECRET
Value: your-generated-nextauth-secret

Name: NODE_ENV
Value: production
```

**중요:** 각 변수마다 "Add" 버튼을 눌러야 합니다!

### 5단계: 배포 실행
1. 모든 설정 완료 후 "Deploy" 클릭
2. 빌드 과정 기다리기 (2-5분 소요)
3. 성공하면 "Congratulations!" 메시지와 함께 URL 제공

### 6단계: URL 환경변수 업데이트
1. 배포된 실제 URL 확인 (예: `https://my-app-abc123.vercel.app`)
2. Vercel 대시보드에서 프로젝트 선택
3. "Settings" → "Environment Variables" 이동
4. URL 관련 환경변수들을 실제 URL로 업데이트:

```
NEXT_PUBLIC_APP_URL=https://my-app-abc123.vercel.app
NEXT_PUBLIC_API_URL=https://my-app-abc123.vercel.app/api
CORS_ORIGIN=https://my-app-abc123.vercel.app
```

5. "Save" 클릭 후 "Redeploy" 실행

## 🔍 배포 확인 및 테스트

### 1. 기본 작동 확인
- 배포된 URL 접속
- 페이지가 정상적으로 로드되는지 확인
- 콘솔 에러가 없는지 확인 (F12 키 눌러서 확인)

### 2. Supabase 연결 확인
- 회원가입/로그인 기능 테스트
- 데이터베이스 연결 상태 확인

### 3. API 엔드포인트 확인
- `https://your-app.vercel.app/api/health` 접속
- 정상 응답이 오는지 확인

## 🛠️ 자주 발생하는 문제 해결

### 문제 1: 빌드 실패
**증상:** "Build failed" 에러
**해결방법:**
1. GitHub에서 `npm run build` 명령어 실행해보기
2. TypeScript/ESLint 오류 수정
3. 환경변수 누락 확인

### 문제 2: 환경변수 오류
**증상:** "Environment variable not found" 에러
**해결방법:**
1. Vercel 대시보드에서 환경변수 재확인
2. 변수명 오타 확인
3. 값에 공백이나 특수문자 확인

### 문제 3: Supabase 연결 실패
**증상:** 데이터베이스 연결 오류
**해결방법:**
1. Supabase URL과 키 재확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. RLS (Row Level Security) 정책 확인

### 문제 4: CORS 오류
**증상:** "CORS policy" 에러
**해결방법:**
1. `CORS_ORIGIN` 환경변수를 실제 배포 URL로 설정
2. Supabase에서 허용된 origins에 도메인 추가

## 📱 도메인 연결 (선택사항)

### 커스텀 도메인 설정
1. Vercel 프로젝트 대시보드에서 "Domains" 탭 클릭
2. "Add" 버튼 클릭
3. 소유한 도메인 입력 (예: `myapp.com`)
4. DNS 설정에서 CNAME 레코드 추가:
   ```
   Type: CNAME
   Name: www (또는 @)
   Value: cname.vercel-dns.com
   ```

## 🔄 지속적 배포 설정

GitHub에 새 코드를 푸시하면 자동으로 재배포됩니다:

```bash
# 코드 수정 후
git add .
git commit -m "Update feature"
git push origin main
# → Vercel에서 자동으로 새 버전 배포
```

## 📊 모니터링 및 로그 확인

### Vercel 대시보드에서 확인
1. **Functions**: API 호출 로그
2. **Analytics**: 사용자 통계
3. **Speed Insights**: 성능 지표
4. **Logs**: 실시간 서버 로그

### 실시간 로그 보기
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 실시간 로그 확인
vercel logs
```

## 🎉 배포 완료 체크리스트

- [ ] GitHub에 코드 업로드 완료
- [ ] Supabase 프로젝트 생성 완료
- [ ] 모든 필수 환경변수 설정 완료
- [ ] Vercel 배포 성공
- [ ] 실제 URL로 환경변수 업데이트 완료
- [ ] 웹사이트 정상 작동 확인
- [ ] 회원가입/로그인 기능 테스트 완료
- [ ] API 엔드포인트 테스트 완료
- [ ] 모바일 반응형 확인 완료

## 🆘 도움이 필요하다면

### 커뮤니티 지원
- [Vercel Discord](https://discord.gg/vercel)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Supabase Discord](https://discord.supabase.com)

### 공식 문서
- [Vercel 배포 가이드](https://vercel.com/docs/deployments/overview)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 가이드](https://supabase.com/docs)

---

**축하합니다! 🎉 성공적으로 배포를 완료했습니다!** 