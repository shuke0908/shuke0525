import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';

// 사용자 타입 정의
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  createdAt?: string;
  isEmailVerified?: boolean;
  role: 'user' | 'admin' | 'superadmin';
  balance?: number | string;
  vipLevel?: '1' | '2' | '3' | '4' | '5';
  kycStatus?: 'pending' | 'approved' | 'rejected';
  isTwoFactorEnabled?: boolean;
  isActive?: boolean;
}

// 글로벌 사용자 저장소 (실제로는 데이터베이스 사용)
declare global {
  // eslint-disable-next-line no-var
  var _userStore: User[] | undefined;
}

// 전역 객체에 users 배열을 저장
if (!global._userStore) {
  global._userStore = [];
}

export const users = global._userStore;

export function addUser(user: User): void {
  users.push(user);
  console.log(`📝 사용자 추가됨. 총 사용자 수: ${users.length}`);
  console.log(`📝 추가된 사용자: ${user.email}`);
}

// 사용자 생성
export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  try {
    // camelCase를 snake_case로 변환
    const dbUserData = {
      id: crypto.randomUUID(), // UUID 생성
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role,
      balance: userData.balance || 10000.00
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([dbUserData])
      .select()
      .single();

    if (error) {
      console.error('사용자 생성 오류:', error);
      throw new Error('사용자 생성에 실패했습니다.');
    }

    // snake_case를 camelCase로 변환하여 반환
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      balance: data.balance,
      createdAt: data.created_at,
      isEmailVerified: true,
      phoneNumber: null,
      vipLevel: data.vip_level,
      kycStatus: data.kyc_status,
      isTwoFactorEnabled: data.is_two_factor_enabled
    };
  } catch (error) {
    console.error('createUser 오류:', error);
    throw error;
  }
}

// 이메일로 사용자 찾기
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 사용자를 찾을 수 없음
        return null;
      }
      console.error('사용자 조회 오류:', error);
      throw new Error('사용자 조회에 실패했습니다.');
    }

    // snake_case를 camelCase로 변환하여 반환
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      balance: data.balance,
      createdAt: data.created_at,
      isEmailVerified: true,
      phoneNumber: null,
      vipLevel: data.vip_level,
      kycStatus: data.kyc_status,
      isTwoFactorEnabled: data.is_two_factor_enabled
    };
  } catch (error) {
    console.error('findUserByEmail 오류:', error);
    return null;
  }
}

// ID로 사용자 찾기
export async function findUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('사용자 조회 오류:', error);
      throw new Error('사용자 조회에 실패했습니다.');
    }

    // snake_case를 camelCase로 변환하여 반환
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      balance: data.balance,
      createdAt: data.created_at,
      isEmailVerified: true,
      phoneNumber: null,
      vipLevel: data.vip_level,
      kycStatus: data.kyc_status,
      isTwoFactorEnabled: data.is_two_factor_enabled
    };
  } catch (error) {
    console.error('findUserById 오류:', error);
    return null;
  }
}

// 모든 사용자 조회
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 목록 조회 오류:', error);
      throw new Error('사용자 목록 조회에 실패했습니다.');
    }

    return data || [];
  } catch (error) {
    console.error('getAllUsers 오류:', error);
    return [];
  }
}

// 사용자 업데이트
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('사용자 업데이트 오류:', error);
      throw new Error('사용자 업데이트에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('updateUser 오류:', error);
    return null;
  }
}

// 사용자 삭제
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('사용자 삭제 오류:', error);
      throw new Error('사용자 삭제에 실패했습니다.');
    }

    return true;
  } catch (error) {
    console.error('deleteUser 오류:', error);
    return false;
  }
}

// 사용자 잔액 업데이트
export async function updateUserBalance(id: string, newBalance: number): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ balance: newBalance })
      .eq('id', id);

    if (error) {
      console.error('잔액 업데이트 오류:', error);
      throw new Error('잔액 업데이트에 실패했습니다.');
    }

    return true;
  } catch (error) {
    console.error('updateUserBalance 오류:', error);
    return false;
  }
}

// 비밀번호 변경
export async function changeUserPassword(id: string, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id);

    if (error) {
      console.error('비밀번호 변경 오류:', error);
      throw new Error('비밀번호 변경에 실패했습니다.');
    }

    return true;
  } catch (error) {
    console.error('changeUserPassword 오류:', error);
    return false;
  }
}

// 이메일 중복 확인
export async function isEmailExists(email: string): Promise<boolean> {
  try {
    const user = await findUserByEmail(email);
    return user !== null;
  } catch (error) {
    console.error('이메일 중복 확인 오류:', error);
    return false;
  }
}

// 기본 관리자 계정 생성 (개발용)
export async function createDefaultAdmin(): Promise<void> {
  try {
    const adminExists = await findUserByEmail('admin@quanttrade.com');
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await createUser({
        email: 'admin@quanttrade.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: 'admin',
        balance: 0
      });
      
      console.log('✅ 기본 관리자 계정이 생성되었습니다.');
    }
  } catch (error) {
    console.error('기본 관리자 계정 생성 오류:', error);
  }
} 