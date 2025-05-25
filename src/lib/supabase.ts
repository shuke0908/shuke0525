import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfzmwtvnktvvckzbybdl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmem13dHZua3R2dmNremJ5YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjIwOTEsImV4cCI6MjA2MjI5ODA5MX0.LI_IZxoQ4bKEMeYGI7j-7LuR0HKGGLs0yOYC7s79Ogs';

// 클라이언트 사이드 Supabase 클라이언트
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 사이드 Supabase 클라이언트 (Service Role Key 사용)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmem13dHZua3R2dmNremJ5YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjcyMjA5MSwiZXhwIjoyMDYyMjk4MDkxfQ.m1q3Qeqiudk3I9E6i12FGZ9krQiOyN0_xJz5yiSMJtg';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 데이터베이스 타입 정의
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'user' | 'admin';
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface FlashTrade {
  id: string;
  user_id: string;
  amount: number;
  direction: 'up' | 'down';
  duration: number;
  start_price: number;
  end_price?: number;
  result?: 'win' | 'lose';
  profit?: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  expires_at: string;
}

export interface AdminSettings {
  id: string;
  user_id?: string; // VARCHAR 타입 (users.id와 호환)
  win_rate: number;
  max_profit_rate: number;
  force_result?: 'win' | 'lose';
  created_at: string;
  updated_at: string;
}
