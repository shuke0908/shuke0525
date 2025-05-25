import { NextRequest } from 'next/server';
import { getUserTradeSettings, updateUserTradeSettings } from '@/lib/database';
import { createSuccessResponse, createAuthErrorResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';
import { verifyToken } from '@/lib/auth';

// 사용자 거래 설정 조회
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  console.log(`🔐 Admin get user settings request for user: ${params.userId}`);
  
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

    // 사용자 설정 조회
    const settings = await getUserTradeSettings(params.userId);
    
    if (!settings) {
      // 설정이 없으면 기본값으로 생성
      const defaultSettings = await updateUserTradeSettings(params.userId, {
        win_rate: 50,
        max_profit: 85,
        is_active: true
      });
      
      return createSuccessResponse({
        message: '사용자 설정 조회 성공 (기본값 생성)',
        settings: {
          winRate: defaultSettings.win_rate,
          maxProfit: defaultSettings.max_profit,
          forceResult: defaultSettings.force_result,
          isActive: defaultSettings.is_active,
          updatedAt: defaultSettings.updated_at
        }
      });
    }

    return createSuccessResponse({
      message: '사용자 설정 조회 성공',
      settings: {
        winRate: settings.win_rate,
        maxProfit: settings.max_profit,
        forceResult: settings.force_result,
        isActive: settings.is_active,
        updatedAt: settings.updated_at
      }
    });

  } catch (error) {
    console.error('Admin get user settings error:', error);
    return createErrorResponse('사용자 설정 조회 중 오류가 발생했습니다.');
  }
}

// 사용자 거래 설정 업데이트
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  console.log(`🔐 Admin update user settings request for user: ${params.userId}`);
  
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

    const body = await request.json();
    const { winRate, maxProfit, forceResult, isActive } = body;

    // 입력 검증
    if (winRate !== undefined && (typeof winRate !== 'number' || winRate < 0 || winRate > 100)) {
      return createValidationErrorResponse('승률은 0-100 사이의 숫자여야 합니다.');
    }

    if (maxProfit !== undefined && (typeof maxProfit !== 'number' || maxProfit < 0 || maxProfit > 500)) {
      return createValidationErrorResponse('최대 수익률은 0-500 사이의 숫자여야 합니다.');
    }

    if (forceResult !== undefined && forceResult !== null && !['win', 'lose'].includes(forceResult)) {
      return createValidationErrorResponse('강제 결과는 "win", "lose" 또는 null이어야 합니다.');
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return createValidationErrorResponse('활성화 상태는 boolean 값이어야 합니다.');
    }

    console.log(`📝 Updating settings for user ${params.userId}:`, {
      winRate,
      maxProfit,
      forceResult,
      isActive
    });

    // 설정 업데이트
    const updatedSettings = await updateUserTradeSettings(params.userId, {
      win_rate: winRate,
      max_profit: maxProfit,
      force_result: forceResult,
      is_active: isActive
    });

    console.log(`✅ Settings updated successfully for user ${params.userId}`);

    return createSuccessResponse({
      message: '사용자 설정 업데이트 성공',
      settings: {
        winRate: updatedSettings.win_rate,
        maxProfit: updatedSettings.max_profit,
        forceResult: updatedSettings.force_result,
        isActive: updatedSettings.is_active,
        updatedAt: updatedSettings.updated_at
      }
    });

  } catch (error) {
    console.error('Admin update user settings error:', error);
    return createErrorResponse('사용자 설정 업데이트 중 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 