import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';

const supabase = createServerSupabaseClient();

// 실시간 FlashTrade 모니터링 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Supabase가 설정되지 않은 경우 mock 데이터 반환
    if (!supabase) {
      const mockActiveTrades = [
        {
          id: '1',
          user_id: 'user1',
          symbol: 'BTC/USDT',
          amount: 100,
          direction: 'up',
          entry_price: 41000,
          current_price: 41200,
          return_rate: 85,
          status: 'active',
          created_at: new Date().toISOString(),
          users: {
            id: 'user1',
            email: 'user1@example.com',
            username: 'trader1',
            balance: 1000
          }
        },
        {
          id: '2',
          user_id: 'user2',
          symbol: 'ETH/USDT',
          amount: 50,
          direction: 'down',
          entry_price: 2500,
          current_price: 2480,
          return_rate: 85,
          status: 'active',
          created_at: new Date().toISOString(),
          users: {
            id: 'user2',
            email: 'user2@example.com',
            username: 'trader2',
            balance: 500
          }
        }
      ];

      return NextResponse.json({
        success: true,
        activeTrades: mockActiveTrades,
        statistics: {
          totalActiveTrades: 2,
          totalActiveAmount: 150,
          upTrades: 1,
          downTrades: 1,
          completed24h: {
            total: 25,
            won: 15,
            lost: 10,
            totalVolume: 2500,
            totalProfit: 125
          }
        }
      });
    }

    // 활성 FlashTrade 조회
    const { data: activeTrades, error: tradesError } = await supabase
      .from('flash_trades')
      .select(`
        *,
        users (
          id,
          email,
          username,
          balance
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tradesError) {
      console.error('Active trades fetch error:', tradesError);
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }

    // 통계 데이터 계산
    const totalActiveTrades = activeTrades?.length || 0;
    const totalActiveAmount = activeTrades?.reduce((sum, trade) => sum + (trade.amount || 0), 0) || 0;
    const upTrades = activeTrades?.filter(trade => trade.direction === 'up').length || 0;
    const downTrades = activeTrades?.filter(trade => trade.direction === 'down').length || 0;

    // 최근 완료된 거래 통계
    const { data: recentCompleted, error: completedError } = await supabase
      .from('flash_trades')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (completedError) {
      console.error('Recent completed trades fetch error:', completedError);
    }

    const completedStats = {
      total: recentCompleted?.length || 0,
      won: recentCompleted?.filter(trade => trade.result === 'win').length || 0,
      lost: recentCompleted?.filter(trade => trade.result === 'loss').length || 0,
      totalVolume: recentCompleted?.reduce((sum, trade) => sum + (trade.amount || 0), 0) || 0,
      totalProfit: recentCompleted?.reduce((sum, trade) => sum + (trade.profit || 0), 0) || 0
    };

    return NextResponse.json({
      success: true,
      activeTrades: activeTrades || [],
      statistics: {
        totalActiveTrades,
        totalActiveAmount,
        upTrades,
        downTrades,
        completed24h: completedStats
      }
    });
  } catch (error) {
    console.error('Flash trade control GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 관리자 개입: 거래 결과 강제 설정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tradeId, result, reason, adminId } = body;

    if (!action || !tradeId) {
      return NextResponse.json(
        { error: 'Action and trade ID are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'force_result':
        return await forceTradeResult(tradeId, result, reason, adminId);
      case 'cancel_trade':
        return await cancelTrade(tradeId, reason, adminId);
      case 'extend_time':
        return await extendTradeTime(tradeId, body.additionalSeconds, adminId);
      case 'adjust_amount':
        return await adjustTradeAmount(tradeId, body.newAmount, reason, adminId);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Flash trade control POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 거래 결과 강제 설정
async function forceTradeResult(tradeId: string, result: 'win' | 'loss', reason: string, adminId: string) {
  try {
    // 거래 정보 조회
    const { data: trade, error: fetchError } = await supabase
      .from('flash_trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (fetchError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    if (trade.status !== 'active') {
      return NextResponse.json({ error: 'Trade is not active' }, { status: 400 });
    }

    // 수익/손실 계산
    const profit = result === 'win' ? (trade.amount * trade.return_rate / 100) : -trade.amount;
    
    // 거래 업데이트
    const { data: updatedTrade, error: updateError } = await supabase
      .from('flash_trades')
      .update({
        status: 'completed',
        result,
        profit,
        exit_price: trade.current_price || trade.entry_price,
        completed_at: new Date().toISOString(),
        admin_intervention: true,
        admin_reason: reason,
        admin_id: adminId
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Trade update error:', updateError);
      return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
    }

    // 사용자 잔액 업데이트
    if (result === 'win') {
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        user_id: trade.user_id,
        amount: profit
      });

      if (balanceError) {
        console.error('Balance update error:', balanceError);
      }
    }

    // 관리자 액션 로그 기록
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'force_flash_trade_result',
        target_id: tradeId,
        details: {
          original_status: trade.status,
          forced_result: result,
          reason,
          profit
        }
      });

    return NextResponse.json({
      success: true,
      trade: updatedTrade,
      message: `Trade result forced to ${result}`
    });
  } catch (error) {
    console.error('Force trade result error:', error);
    return NextResponse.json({ error: 'Failed to force trade result' }, { status: 500 });
  }
}

// 거래 취소
async function cancelTrade(tradeId: string, reason: string, adminId: string) {
  try {
    const { data: trade, error: fetchError } = await supabase
      .from('flash_trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (fetchError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    if (trade.status !== 'active') {
      return NextResponse.json({ error: 'Trade is not active' }, { status: 400 });
    }

    // 거래 취소 및 환불
    const { data: updatedTrade, error: updateError } = await supabase
      .from('flash_trades')
      .update({
        status: 'cancelled',
        profit: 0,
        completed_at: new Date().toISOString(),
        admin_intervention: true,
        admin_reason: reason,
        admin_id: adminId
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Trade cancellation error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel trade' }, { status: 500 });
    }

    // 사용자에게 환불
    const { error: refundError } = await supabase.rpc('update_user_balance', {
      user_id: trade.user_id,
      amount: trade.amount
    });

    if (refundError) {
      console.error('Refund error:', refundError);
    }

    // 관리자 액션 로그
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'cancel_flash_trade',
        target_id: tradeId,
        details: {
          reason,
          refunded_amount: trade.amount
        }
      });

    return NextResponse.json({
      success: true,
      trade: updatedTrade,
      message: 'Trade cancelled and refunded'
    });
  } catch (error) {
    console.error('Cancel trade error:', error);
    return NextResponse.json({ error: 'Failed to cancel trade' }, { status: 500 });
  }
}

// 거래 시간 연장
async function extendTradeTime(tradeId: string, additionalSeconds: number, adminId: string) {
  try {
    const { data: trade, error: fetchError } = await supabase
      .from('flash_trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (fetchError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    if (trade.status !== 'active') {
      return NextResponse.json({ error: 'Trade is not active' }, { status: 400 });
    }

    // 새로운 만료 시간 계산
    const currentExpiry = new Date(trade.expires_at);
    const newExpiry = new Date(currentExpiry.getTime() + (additionalSeconds * 1000));

    const { data: updatedTrade, error: updateError } = await supabase
      .from('flash_trades')
      .update({
        expires_at: newExpiry.toISOString(),
        duration: trade.duration + additionalSeconds,
        admin_intervention: true,
        admin_id: adminId
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Trade time extension error:', updateError);
      return NextResponse.json({ error: 'Failed to extend trade time' }, { status: 500 });
    }

    // 관리자 액션 로그
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'extend_flash_trade_time',
        target_id: tradeId,
        details: {
          additional_seconds: additionalSeconds,
          new_expiry: newExpiry.toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      trade: updatedTrade,
      message: `Trade time extended by ${additionalSeconds} seconds`
    });
  } catch (error) {
    console.error('Extend trade time error:', error);
    return NextResponse.json({ error: 'Failed to extend trade time' }, { status: 500 });
  }
}

// 거래 금액 조정
async function adjustTradeAmount(tradeId: string, newAmount: number, reason: string, adminId: string) {
  try {
    const { data: trade, error: fetchError } = await supabase
      .from('flash_trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (fetchError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    if (trade.status !== 'active') {
      return NextResponse.json({ error: 'Trade is not active' }, { status: 400 });
    }

    const amountDifference = newAmount - trade.amount;
    const newPotentialProfit = (newAmount * trade.return_rate) / 100;

    const { data: updatedTrade, error: updateError } = await supabase
      .from('flash_trades')
      .update({
        amount: newAmount,
        potential_profit: newPotentialProfit,
        admin_intervention: true,
        admin_reason: reason,
        admin_id: adminId
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Trade amount adjustment error:', updateError);
      return NextResponse.json({ error: 'Failed to adjust trade amount' }, { status: 500 });
    }

    // 사용자 잔액 조정 (차액만큼)
    if (amountDifference !== 0) {
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        user_id: trade.user_id,
        amount: -amountDifference // 금액이 증가하면 잔액에서 차감, 감소하면 잔액에 추가
      });

      if (balanceError) {
        console.error('Balance adjustment error:', balanceError);
      }
    }

    // 관리자 액션 로그
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'adjust_flash_trade_amount',
        target_id: tradeId,
        details: {
          original_amount: trade.amount,
          new_amount: newAmount,
          amount_difference: amountDifference,
          reason
        }
      });

    return NextResponse.json({
      success: true,
      trade: updatedTrade,
      message: `Trade amount adjusted from $${trade.amount} to $${newAmount}`
    });
  } catch (error) {
    console.error('Adjust trade amount error:', error);
    return NextResponse.json({ error: 'Failed to adjust trade amount' }, { status: 500 });
  }
} 