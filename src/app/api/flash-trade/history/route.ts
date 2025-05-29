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

    // 시뮬레이션 데이터 (실제로는 DB에서 조회)
    const mockTrades = [
      {
        id: 1,
        amount: "100.00",
        direction: 'up' as const,
        duration: 60,
        returnRate: "85",
        entryPrice: "41255.78",
        exitPrice: "41456.32",
        potentialProfit: "85.00",
        status: 'win' as const,
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        amount: "50.00",
        direction: 'down' as const,
        duration: 120,
        returnRate: "90",
        entryPrice: "2456.32",
        exitPrice: "2398.45",
        potentialProfit: "45.00",
        status: 'win' as const,
        startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 13 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        amount: "200.00",
        direction: 'up' as const,
        duration: 180,
        returnRate: "75",
        entryPrice: "1.0842",
        exitPrice: "1.0821",
        potentialProfit: "0",
        status: 'lose' as const,
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 27 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        amount: "75.00",
        direction: 'down' as const,
        duration: 90,
        returnRate: "80",
        entryPrice: "1875.23",
        exitPrice: "1823.45",
        potentialProfit: "60.00",
        status: 'win' as const,
        startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 43 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        amount: "150.00",
        direction: 'up' as const,
        duration: 300,
        returnRate: "95",
        entryPrice: "65.78",
        exitPrice: "67.12",
        potentialProfit: "142.50",
        status: 'win' as const,
        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 55 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      trades: mockTrades,
      summary: {
        totalTrades: mockTrades.length,
        winRate: (mockTrades.filter(t => t.status === 'win').length / mockTrades.length * 100).toFixed(1),
        totalProfit: mockTrades.reduce((sum, trade) => {
          return sum + (trade.status === 'win' ? parseFloat(trade.potentialProfit) : -parseFloat(trade.amount));
        }, 0).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Flash trade history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash trade history' },
      { status: 500 }
    );
  }
} 