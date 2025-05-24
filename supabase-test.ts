import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';

// 환경 변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

console.log('🔍 Testing Supabase Database Connection...\n');

async function testSupabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }

  console.log('✅ DATABASE_URL found');
  
  // PostgreSQL 연결 풀 생성
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 기본 연결 테스트
    console.log('🔗 Testing basic connection...');
    const client = await pool.connect();
    const timeResult = await client.query('SELECT NOW() as current_time');
    client.release();
    console.log('✅ Basic connection successful');
    console.log(`   Current time: ${timeResult.rows[0].current_time}`);

    // Drizzle ORM 테스트
    console.log('\n📊 Testing Drizzle ORM...');
    const db = drizzle(pool, { schema });
    
    // 테이블 존재 확인
    console.log('🔍 Checking tables...');
    
    try {
      const users = await db.select().from(schema.users).limit(1);
      console.log(`   ✅ users table: ${users.length} records found`);
    } catch (error) {
      console.log('   ❌ users table: Error or empty');
    }

    try {
      const settings = await db.select().from(schema.platformSettings).limit(1);
      console.log(`   ✅ platform_settings table: ${settings.length} records found`);
    } catch (error) {
      console.log('   ❌ platform_settings table: Error or empty');
    }

    try {
      const flashTrades = await db.select().from(schema.flashTrades).limit(1);
      console.log(`   ✅ flash_trades table: ${flashTrades.length} records found`);
    } catch (error) {
      console.log('   ❌ flash_trades table: Error or empty');
    }

    try {
      const deposits = await db.select().from(schema.deposits).limit(1);
      console.log(`   ✅ deposits table: ${deposits.length} records found`);
    } catch (error) {
      console.log('   ❌ deposits table: Error or empty');
    }

    try {
      const withdrawals = await db.select().from(schema.withdrawals).limit(1);
      console.log(`   ✅ withdrawals table: ${withdrawals.length} records found`);
    } catch (error) {
      console.log('   ❌ withdrawals table: Error or empty');
    }

    console.log('\n🎉 Supabase database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
    console.log('📦 Connection pool closed');
  }
}

testSupabase().catch(console.error); 