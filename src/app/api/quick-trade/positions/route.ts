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

    // 사용자의 포지션 목록 (실제로는 데이터베이스에서 조회)
    const positions = [
      {
        id: '1',
        asset: 'BTC/USD',
        direction: 'long',
        amount: 100,
        leverage: 10,
        entryPrice: 43000.00,
        currentPrice: 43250.50,
        pnl: 25.05,
        pnlPercentage: 2.45,
        status: 'open',
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1시간 전
      },
      {
        id: '2',
        asset: 'ETH/USD',
        direction: 'short',
        amount: 50,
        leverage: 5,
        entryPrice: 2700.00,
        currentPrice: 2650.75,
        pnl: 12.31,
        pnlPercentage: 1.83,
        status: 'open',
        createdAt: new Date(Date.now() - 7200000).toISOString() // 2시간 전
      }
    ];

    return NextResponse.json({
      success: true,
      positions
    });
  } catch (error) {
    console.error('Positions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
} 