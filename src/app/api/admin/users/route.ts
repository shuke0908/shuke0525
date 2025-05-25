import { NextRequest } from 'next/server';
import { getAllUsersWithSettings } from '@/lib/database';
import { createSuccessResponse, createAuthErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('🔐 Admin users list request');
  
  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createAuthErrorResponse('인증 토큰이 필요합니다.');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return createAuthErrorResponse('유효하지 않은 토큰입니다.');
    }

    // 관리자 권한 확인
    if (decoded.role !== 'admin') {
      return createAuthErrorResponse('관리자 권한이 필요합니다.');
    }

    console.log(`✅ Admin access granted for user: ${decoded.email}`);

    // 모든 사용자 목록 조회
    const users = await getAllUsersWithSettings();
    
    console.log(`📊 Retrieved ${users.length} users with settings`);

    return createSuccessResponse({
      message: '사용자 목록 조회 성공',
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        balance: parseFloat(user.balance || '0'),
        settings: {
          winRate: user.win_rate || 50,
          maxProfit: user.max_profit || 85,
          forceResult: user.force_result,
          isActive: user.is_active !== false,
          updatedAt: user.settings_updated_at
        }
      }))
    });

  } catch (error) {
    console.error('Admin users list error:', error);
    return createErrorResponse('사용자 목록 조회 중 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 