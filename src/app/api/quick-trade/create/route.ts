import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const { symbol, amount, direction, leverage, orderType } = await request.json();

    // 입력 검증
    if (!symbol || !amount || !direction || !leverage) {
      return NextResponse.json({ 
        error: 'Symbol, amount, direction, and leverage are required' 
      }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(direction)) {
      return NextResponse.json({ 
        error: 'Direction must be "buy" or "sell"' 
      }, { status: 400 });
    }

    if (amount < 1 || amount > 50000) {
      return NextResponse.json({ 
        error: 'Amount must be between $1 and $50,000' 
      }, { status: 400 });
    }

    if (leverage < 1 || leverage > 100) {
      return NextResponse.json({ 
        error: 'Leverage must be between 1:1 and 1:100' 
      }, { status: 400 });
    }

    // 현재 가격 시뮬레이션
    const mockPrices: { [key: string]: number } = {
      'BTC/USDT': 41255.78,
      'ETH/USDT': 2456.32,
      'BNB/USDT': 312.45,
      'XRP/USDT': 0.6234,
      'SOL/USDT': 98.76,
      'ADA/USDT': 0.4567,
      'AVAX/USDT': 36.89,
      'EUR/USD': 1.0842,
      'GBP/USD': 1.2654,
      'USD/JPY': 149.23,
      'USD/CAD': 1.3456,
      'AUD/USD': 0.6789,
      'XAU/USD': 1875.23,
      'XAG/USD': 23.45
    };

    const entryPrice = mockPrices[symbol] || 1.0000;
    const positionSize = amount * leverage;

    // 새 거래 생성 (시뮬레이션)
    const newTrade = {
      id: Date.now(),
      userId,
      symbol,
      amount: amount.toString(),
      direction,
      leverage,
      orderType: orderType || 'market',
      entryPrice: entryPrice.toString(),
      positionSize: positionSize.toString(),
      status: 'open',
      pnl: '0.00',
      margin: amount.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 실제 구현에서는 DB에 저장
    // await db.insert(quickTrades).values(newTrade);

    return NextResponse.json({
      success: true,
      data: newTrade,
      message: 'Quick trade created successfully'
    });

  } catch (error) {
    console.error('Create quick trade API error:', error);
    return NextResponse.json(
      { error: 'Failed to create quick trade' },
      { status: 500 }
    );
  }
} 