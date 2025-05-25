import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, createAuthErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

// 관리자 설정 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return createAuthErrorResponse('인증 토큰이 필요합니다.');
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return createAuthErrorResponse('관리자 권한이 필요합니다.');
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('admin_settings')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: settings, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Settings fetch error:', error);
      return createErrorResponse('설정 조회 중 오류가 발생했습니다.');
    }

    return createSuccessResponse({
      settings: settings || []
    });

  } catch (error) {
    console.error('Admin settings GET error:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

// 관리자 설정 생성/수정
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return createAuthErrorResponse('인증 토큰이 필요합니다.');
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return createAuthErrorResponse('관리자 권한이 필요합니다.');
    }

    const body = await request.json();
    const { userId, winRate, maxProfitRate, forceResult } = body;

    // 입력 검증
    if (winRate !== undefined && (winRate < 0 || winRate > 100)) {
      return createErrorResponse('승률은 0-100 사이의 값이어야 합니다.');
    }

    if (maxProfitRate !== undefined && (maxProfitRate < 0 || maxProfitRate > 1000)) {
      return createErrorResponse('최대 수익률은 0-1000 사이의 값이어야 합니다.');
    }

    if (forceResult && !['win', 'lose'].includes(forceResult)) {
      return createErrorResponse('강제 결과는 win 또는 lose만 가능합니다.');
    }

    // 기존 설정 확인
    const { data: existingSettings } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .eq('user_id', userId || null)
      .single();

    let result;

    if (existingSettings) {
      // 기존 설정 업데이트
      const { data, error } = await supabaseAdmin
        .from('admin_settings')
        .update({
          win_rate: winRate,
          max_profit_rate: maxProfitRate,
          force_result: forceResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) {
        console.error('Settings update error:', error);
        return createErrorResponse('설정 업데이트 중 오류가 발생했습니다.');
      }

      result = data;
    } else {
      // 새 설정 생성
      const { data, error } = await supabaseAdmin
        .from('admin_settings')
        .insert({
          user_id: userId || null,
          win_rate: winRate || 30.00,
          max_profit_rate: maxProfitRate || 85.00,
          force_result: forceResult
        })
        .select()
        .single();

      if (error) {
        console.error('Settings create error:', error);
        return createErrorResponse('설정 생성 중 오류가 발생했습니다.');
      }

      result = data;
    }

    return createSuccessResponse({
      message: '설정이 성공적으로 저장되었습니다.',
      setting: result
    });

  } catch (error) {
    console.error('Admin settings POST error:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

// 관리자 설정 삭제
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return createAuthErrorResponse('인증 토큰이 필요합니다.');
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return createAuthErrorResponse('관리자 권한이 필요합니다.');
    }

    const { searchParams } = new URL(request.url);
    const settingId = searchParams.get('id');

    if (!settingId) {
      return createErrorResponse('설정 ID가 필요합니다.');
    }

    const { error } = await supabaseAdmin
      .from('admin_settings')
      .delete()
      .eq('id', settingId);

    if (error) {
      console.error('Settings delete error:', error);
      return createErrorResponse('설정 삭제 중 오류가 발생했습니다.');
    }

    return createSuccessResponse({
      message: '설정이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Admin settings DELETE error:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 