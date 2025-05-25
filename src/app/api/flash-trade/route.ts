import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

// 가상 BTC 가격 생성 (실제 거래소 연동 없음)
function generateBTCPrice(): number {
  const basePrice = 45000;
  const variation = (Math.random() - 0.5) * 2000; // ±1000 변동
  return Math.round((basePrice + variation) * 100) / 100;
}

// 관리자 설정 기반 거래 결과 결정
async function determineTradeResult(userId: string, amount: number, direction: 'up' | 'down') {
  try {
    // 사용자별 설정 조회
    const { data: userSettings } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // 전체 기본 설정 조회
    const { data: globalSettings } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .is('user_id', null)
      .eq('is_active', true)
      .single();

    const settings = userSettings || globalSettings || {
      win_rate: 50,
      max_profit_rate: 80,
      min_profit_rate: 70,
      force_result: null
    };

    // 강제 결과가 설정된 경우
    if (settings.force_result) {
      const isWin = settings.force_result === 'win';
      const profitRate = Math.random() * (settings.max_profit_rate - settings.min_profit_rate) + settings.min_profit_rate;
      const profit = isWin ? (amount * profitRate / 100) : -(amount * 0.9); // 패배 시 90% 손실
      
      return {
        result: settings.force_result as 'win' | 'lose',
        profit: Math.round(profit * 100) / 100
      };
    }

    // 승률 기반 결과 결정
    const random = Math.random() * 100;
    const isWin = random < settings.win_rate;
    
    if (isWin) {
      const profitRate = Math.random() * (settings.max_profit_rate - settings.min_profit_rate) + settings.min_profit_rate;
      const profit = amount * profitRate / 100;
      return {
        result: 'win' as const,
        profit: Math.round(profit * 100) / 100
      };
    } else {
      const lossRate = 0.8 + Math.random() * 0.2; // 80-100% 손실
      const profit = -(amount * lossRate);
      return {
        result: 'lose' as const,
        profit: Math.round(profit * 100) / 100
      };
    }
  } catch (error) {
    console.error('Error determining trade result:', error);
    // 기본값 반환
    const isWin = Math.random() < 0.5;
    const profit = isWin ? amount * 0.75 : -(amount * 0.9);
    return {
      result: isWin ? 'win' as const : 'lose' as const,
      profit: Math.round(profit * 100) / 100
    };
  }
}

// Flash Trade 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, direction, duration } = await request.json();

    // 입력 검증
    if (!amount || !direction || !duration) {
      return NextResponse.json(
        { error: 'Amount, direction, and duration are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be up or down' },
        { status: 400 }
      );
    }

    if (![30, 60, 120, 300].includes(duration)) {
      return NextResponse.json(
        { error: 'Duration must be 30, 60, 120, or 300 seconds' },
        { status: 400 }
      );
    }

    // 사용자 잔액 확인
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (!userData || userData.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // 시작 가격 생성
    const startPrice = generateBTCPrice();
    const expiresAt = new Date(Date.now() + duration * 1000);

    // Flash Trade 생성
    const { data: trade, error } = await supabaseAdmin
      .from('flash_trades')
      .insert({
        user_id: user.id,
        amount,
        direction,
        duration,
        start_price: startPrice,
        status: 'active',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating flash trade:', error);
      return NextResponse.json(
        { error: 'Failed to create trade' },
        { status: 500 }
      );
    }

    // 사용자 잔액 차감
    await supabaseAdmin
      .from('users')
      .update({ balance: userData.balance - amount })
      .eq('id', user.id);

    // 자동 완료 스케줄링 (실제로는 백그라운드 작업으로 처리)
    setTimeout(async () => {
      try {
        const endPrice = generateBTCPrice();
        const { result, profit } = await determineTradeResult(user.id, amount, direction);
        
        // 거래 완료 처리
        await supabaseAdmin
          .from('flash_trades')
          .update({
            end_price: endPrice,
            result,
            profit,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', trade.id);

        // 사용자 잔액 업데이트
        const { data: currentUser } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (currentUser) {
          const newBalance = currentUser.balance + amount + profit;
          await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', user.id);

          // 거래 내역 기록
          await supabaseAdmin
            .from('trade_history')
            .insert({
              user_id: user.id,
              trade_type: 'flash_trade',
              trade_id: trade.id,
              amount,
              result,
              profit,
              balance_before: currentUser.balance,
              balance_after: newBalance
            });
        }
      } catch (error) {
        console.error('Error completing flash trade:', error);
      }
    }, duration * 1000);

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        amount,
        direction,
        duration,
        startPrice,
        status: 'active',
        expiresAt: expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Flash trade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Flash Trade 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: trades, error } = await supabaseAdmin
      .from('flash_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching flash trades:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trades: trades || []
    });

  } catch (error) {
    console.error('Flash trade fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 