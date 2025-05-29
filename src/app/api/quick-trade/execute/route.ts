import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';

const supabase = createServerSupabaseClient();

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { asset, direction, amount, leverage, stopLoss, takeProfit } = body;

    if (!asset || !direction || !amount) {
      return NextResponse.json(
        { error: 'Asset, direction, and amount are required' },
        { status: 400 }
      );
    }

    // 현재 가격 (실제로는 실시간 데이터)
    const currentPrices: { [key: string]: number } = {
      'BTC/USD': 43250.50,
      'ETH/USD': 2650.75,
      'XRP/USD': 0.62,
      'BNB/USD': 315.80
    };

    const currentPrice = currentPrices[asset] || 0;
    if (!currentPrice) {
      return NextResponse.json(
        { error: 'Invalid asset' },
        { status: 400 }
      );
    }

    // 거래 실행 (실제로는 데이터베이스에 저장)
    const trade = {
      id: Date.now().toString(),
      asset,
      direction,
      amount: parseFloat(amount),
      leverage: leverage || 1,
      entryPrice: currentPrice,
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      status: 'open',
      createdAt: new Date().toISOString(),
      pnl: 0
    };

    return NextResponse.json({
      success: true,
      data: trade,
      message: 'Trade executed successfully'
    });
  } catch (error) {
    console.error('Quick trade execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute trade' },
      { status: 500 }
    );
  }
} 