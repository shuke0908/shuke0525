import dotenv from 'dotenv';
import path from 'path';

// 환경 변수 로드
console.log('🔍 Loading environment variables...');
const envPath = path.resolve(process.cwd(), '.env');
console.log('Env file path:', envPath);

const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  console.error('❌ Failed to load .env file:', result.error);
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

// 환경 변수 확인
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✅' : 'Not set ❌');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set ✅' : 'Not set ❌');

// 간단한 PostgreSQL 연결 테스트
import { Pool } from 'pg';

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    return;
  }

  console.log('\n🔗 Testing Supabase connection...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    console.log('✅ Supabase connection successful!');
    console.log('Current time:', result.rows[0].current_time);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection(); 