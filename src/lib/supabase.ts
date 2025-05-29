import { createClient } from '@supabase/supabase-js';

// Supabase 설정 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase가 제대로 설정되었는지 확인
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20;

// 클라이언트 사이드 Supabase 클라이언트 (설정되어 있을 때만)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// 서버 사이드 Supabase 클라이언트 (Service Role Key 사용)
const isAdminConfigured = isSupabaseConfigured && 
  supabaseServiceKey && 
  supabaseServiceKey.length > 20;

export const supabaseAdmin = isAdminConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Supabase 연결 상태 확인
export const isSupabaseReady = () => {
  return isSupabaseConfigured && isAdminConfigured;
};

// 개발 환경에서 상태 로그
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🗄️ Supabase Status:');
  console.log('  - Configured:', isSupabaseConfigured);
  console.log('  - Admin Ready:', isAdminConfigured);
  console.log('  - URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('  - Keys:', {
    anon: supabaseAnonKey ? 'Set' : 'Not set',
    service: supabaseServiceKey ? 'Set' : 'Not set'
  });
}

// 데이터베이스 타입 정의
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'user' | 'admin' | 'superadmin';
  balance: number;
  vipLevel?: number;
  isActive?: boolean;
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

// 안전한 Supabase 쿼리 헬퍼
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any; isSupabaseAvailable: boolean }> {
  if (!isSupabaseReady()) {
    return {
      data: null,
      error: new Error('Supabase not configured'),
      isSupabaseAvailable: false
    };
  }

  try {
    const result = await queryFn();
    return {
      ...result,
      isSupabaseAvailable: true
    };
  } catch (error) {
    return {
      data: null,
      error,
      isSupabaseAvailable: true
    };
  }
}
