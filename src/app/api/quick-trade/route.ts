import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

// 가상 암호화폐 가격 생성
function generateCryptoPrice(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    'BTC': 45000,
    'ETH': 2500,
    'BNB': 300,
    'ADA': 0.5,
    'SOL': 100,
    'DOT': 7,
    'MATIC': 0.8,
    'AVAX': 25
  };
  
  const basePrice = basePrices[symbol] || 100;
  const variation = (Math.random() - 0.5) * 0.1; // ±5% 변동
  return Math.round((basePrice * (1 + variation)) * 100) / 100;
}

// 관리자 설정 기반 거래 결과 결정
async function determineTradeResult(userId: string, amount: number, orderType: 'buy' | 'sell') {
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

    const settings = userSettings || globalSettings;
    
    if (!settings) {
      // 기본값 사용
      const winRate = 50;
      const isWin = Math.random() * 100 < winRate;
      const profitRate = isWin ? 0.75 : -1; // 승리 시 75% 수익, 패배 시 전액 손실
      return { isWin, profitRate };
    }

    // 강제 결과 설정이 있는 경우
    if (settings.force_result) {
      const isWin = settings.force_result === 'win';
      const profitRate = isWin 
        ? (Math.random() * (settings.max_profit_rate - settings.min_profit_rate) + settings.min_profit_rate) / 100
        : -1;
      return { isWin, profitRate };
    }

    // 승률 기반 결과 결정
    const isWin = Math.random() * 100 < settings.win_rate;
    const profitRate = isWin 
      ? (Math.random() * (settings.max_profit_rate - settings.min_profit_rate) + settings.min_profit_rate) / 100
      : -1;

    return { isWin, profitRate };
  } catch (error) {
    console.error('Error determining trade result:', error);
    // 기본값 반환
    const isWin = Math.random() < 0.5;
    const profitRate = isWin ? 0.75 : -1;
    return { isWin, profitRate };
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, amount, orderType } = await request.json();

    // 입력 검증
    if (!symbol || !amount || !orderType) {
      return NextResponse.json(
        { error: 'Symbol, amount, and order type are required' },
        { status: 400 }
      );
    }

    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json(
        { error: 'Order type must be buy or sell' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // 현재 사용자 잔액 확인
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(currentUser.balance);

    if (currentBalance < numAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // 가상 거래 실행
    const currentPrice = generateCryptoPrice(symbol);
    const { isWin, profitRate } = await determineTradeResult(user.id, numAmount, orderType);
    
    const profit = numAmount * profitRate;
    const newBalance = currentBalance + profit;

    // 잔액 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // 거래 기록 저장 (선택사항)
    await supabaseAdmin
      .from('quick_trades')
      .insert({
        user_id: user.id,
        symbol,
        amount: numAmount,
        order_type: orderType,
        price: currentPrice,
        result: isWin ? 'win' : 'lose',
        profit,
        status: 'completed'
      });

    return NextResponse.json({
      success: true,
      trade: {
        symbol,
        amount: numAmount,
        orderType,
        price: currentPrice,
        result: isWin ? 'win' : 'lose',
        profit,
        newBalance
      }
    });
  } catch (error) {
    console.error('Quick trade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 거래 내역 조회
    const { data: trades, error: fetchError } = await supabaseAdmin
      .from('quick_trades')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching trade history:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch trade history' },
        { status: 500 }
      );
    }

    // 최신 순으로 정렬
    trades.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      data: trades
    });

  } catch (error) {
    console.error('Quick trade history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade history' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 