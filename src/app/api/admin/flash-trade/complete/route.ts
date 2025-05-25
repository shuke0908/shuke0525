import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { findUserById, updateUserBalance } from '@/lib/userStore';
import { verifyToken } from '@/lib/auth';
import { createSuccessResponse, createValidationErrorResponse, createAuthErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function POST(request: NextRequest) {
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
    const admin = await findUserById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return createAuthErrorResponse('관리자 권한이 필요합니다.');
    }

    const body = await request.json();
    const { tradeId, result, endPrice } = body;

    // 입력 검증
    if (!tradeId || !result) {
      return createValidationErrorResponse('거래 ID와 결과를 입력해주세요.');
    }

    if (!['win', 'lose'].includes(result)) {
      return createValidationErrorResponse('결과는 win 또는 lose여야 합니다.');
    }

    // Flash Trade 조회
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('flash_trades')
      .select('*')
      .eq('id', tradeId)
      .eq('status', 'active')
      .single();

    if (tradeError || !trade) {
      return createValidationErrorResponse('활성 상태의 거래를 찾을 수 없습니다.');
    }

    // 거래 만료 시간 확인 (10초 전까지만 수정 가능)
    const expiresAt = new Date(trade.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry < 10000) { // 10초 미만
      return createValidationErrorResponse('거래 만료 10초 전에는 결과를 변경할 수 없습니다.');
    }

    // 종료 가격 계산 (제공되지 않은 경우 시뮬레이션)
    let finalEndPrice = endPrice;
    if (!finalEndPrice) {
      const priceChange = (Math.random() - 0.5) * 1000; // -500 ~ +500
      finalEndPrice = trade.start_price + priceChange;
    }

    // 수익 계산
    let profit = 0;
    if (result === 'win') {
      // 관리자 설정에서 수익률 가져오기
      const { data: settings } = await supabaseAdmin
        .from('admin_settings')
        .select('max_profit_rate')
        .eq('user_id', trade.user_id)
        .single();

      const profitRate = settings?.max_profit_rate || 85; // 기본 85%
      profit = trade.amount * (profitRate / 100);
    }

    // Flash Trade 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('flash_trades')
      .update({
        end_price: finalEndPrice,
        result,
        profit,
        status: 'completed'
      })
      .eq('id', tradeId);

    if (updateError) {
      console.error('Flash Trade 업데이트 오류:', updateError);
      return createErrorResponse('거래 결과 설정에 실패했습니다.');
    }

    // 승리한 경우 사용자 잔액 업데이트
    if (result === 'win') {
      const user = await findUserById(trade.user_id);
      if (user) {
        const newBalance = user.balance + trade.amount + profit;
        await updateUserBalance(user.id, newBalance);
      }
    }

    console.log(`✅ Flash Trade 완료: ${tradeId}, 결과: ${result}, 수익: ${profit}`);

    return createSuccessResponse({
      tradeId,
      result,
      endPrice: finalEndPrice,
      profit,
      message: '거래 결과가 설정되었습니다.'
    });

  } catch (error) {
    console.error('Flash Trade 결과 설정 오류:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 