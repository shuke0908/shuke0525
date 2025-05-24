import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../shared/schema';

// 환경 변수 설정 확인
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// 개발 환경에서만 연결 문자열 로깅
if (process.env.NODE_ENV !== 'production') {
  console.log(
    'DATABASE_URL is set:',
    process.env.DATABASE_URL.substring(0, 25) + '...'
  );
}

// Supabase Postgres 연결 풀 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true, // Supabase는 항상 SSL 사용
  },
  max: 10, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 제한 시간
  connectionTimeoutMillis: 5000, // 연결 타임아웃
});

// 연결 성공/실패 이벤트 핸들러
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Connected to Supabase Postgres database');
  }
});

pool.on('error', err => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(-1);
});

// Drizzle ORM 인스턴스 생성
export const db = drizzle(pool, { schema });

// 서버 종료 시 연결 풀 정리
process.on('SIGTERM', () => {
  console.log('Closing database connections');
  pool.end().catch(console.error);
});

export default db;
