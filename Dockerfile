# 프로덕션 최적화된 Docker 설정
FROM node:18-alpine AS base

# 필요한 패키지 설치 (보안 업데이트 포함)
RUN apk add --no-cache libc6-compat curl
RUN apk update && apk upgrade

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치 단계
FROM base AS deps
# package.json과 package-lock.json 복사
COPY package*.json ./
# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드 의존성을 포함한 단계
FROM base AS deps-full
COPY package*.json ./
RUN npm ci

# 빌드 단계
FROM base AS builder
WORKDIR /app
COPY --from=deps-full /app/node_modules ./node_modules
COPY . .

# 환경 변수 설정 (빌드 시점)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NODE_ENV=production

# Next.js 빌드
RUN npm run build

# 프로덕션 런타임 단계
FROM base AS runner
WORKDIR /app

# 보안을 위한 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 필요한 파일들만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 소유권 변경
RUN chown -R nextjs:nodejs /app
USER nextjs

# 포트 노출
EXPOSE 3000

# 환경 변수 설정
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV=production

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 애플리케이션 시작
CMD ["node", "server.js"] 