import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 최근 거래 내역 (실제로는 데이터베이스에서 조회)
    const trades = [
      {
        id: '1',
        asset: 'BTC/USD',
        type: 'buy',
        amount: '500.00',
        price: '43,250.50',
        pnl: 125.75,
        status: 'completed',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5분 전
        leverage: 1,
        fees: 2.50
      },
      {
        id: '2',
        asset: 'ETH/USD',
        type: 'sell',
        amount: '1000.00',
        price: '2,650.75',
        pnl: -45.20,
        status: 'completed',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15분 전
        leverage: 2,
        fees: 5.00
      },
      {
        id: '3',
        asset: 'XRP/USD',
        type: 'buy',
        amount: '200.00',
        price: '0.62',
        pnl: 8.45,
        status: 'completed',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30분 전
        leverage: 1,
        fees: 1.00
      },
      {
        id: '4',
        asset: 'BNB/USD',
        type: 'sell',
        amount: '300.00',
        price: '315.80',
        pnl: 67.30,
        status: 'completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        leverage: 3,
        fees: 4.50
      },
      {
        id: '5',
        asset: 'BTC/USD',
        type: 'buy',
        amount: '750.00',
        price: '43,100.25',
        pnl: 89.15,
        status: 'completed',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
        leverage: 1,
        fees: 3.75
      }
    ];

    return NextResponse.json({
      success: true,
      trades,
      totalTrades: trades.length,
      totalVolume: trades.reduce((sum, trade) => sum + parseFloat(trade.amount), 0).toFixed(2),
      totalPnL: trades.reduce((sum, trade) => sum + trade.pnl, 0).toFixed(2)
    });
  } catch (error) {
    console.error('Recent trades fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent trades' },
      { status: 500 }
    );
  }
} 