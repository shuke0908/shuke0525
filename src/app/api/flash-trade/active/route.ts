import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // 활성 Flash Trade 시뮬레이션 데이터
    const activeTrades = [
      {
        id: 1,
        symbol: 'BTC/USDT',
        amount: '100.00',
        direction: 'up',
        duration: 60,
        remainingTime: 45,
        entryPrice: '41255.78',
        currentPrice: '41298.45',
        potentialProfit: '85.00',
        returnRate: '85',
        status: 'active',
        startTime: new Date(Date.now() - 15 * 1000).toISOString()
      },
      {
        id: 2,
        symbol: 'ETH/USDT',
        amount: '50.00',
        direction: 'down',
        duration: 120,
        remainingTime: 95,
        entryPrice: '2456.32',
        currentPrice: '2445.67',
        potentialProfit: '40.00',
        returnRate: '80',
        status: 'active',
        startTime: new Date(Date.now() - 25 * 1000).toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      activeTrades
    });

  } catch (error) {
    console.error('Flash trade active API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active flash trades' },
      { status: 500 }
    );
  }
} 