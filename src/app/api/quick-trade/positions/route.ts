import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const supabase = createServerSupabaseClient();

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

    // 실제 데이터베이스에서 포지션 조회
    const { data: positions, error } = await supabase
      .from('quick_trade_positions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
    }

    // 포지션 데이터 포맷팅
    const formattedPositions = (positions || []).map(pos => {
      const currentPrice = parseFloat(pos.entry_price) * (1 + (Math.random() - 0.5) * 0.05); // 시뮬레이션 현재가
      const pnl = parseFloat(pos.pnl) || 0;
      const pnlPercentage = parseFloat(pos.amount) > 0 ? (pnl / parseFloat(pos.amount)) * 100 : 0;
      
      return {
        id: pos.id,
        symbol: pos.symbol,
        amount: pos.amount,
        direction: pos.side,
        leverage: pos.leverage,
        entryPrice: pos.entry_price,
        currentPrice: currentPrice.toFixed(2),
        positionSize: (parseFloat(pos.amount) * pos.leverage).toFixed(2),
        pnl: pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2),
        pnlPercentage: pnlPercentage >= 0 ? `+${pnlPercentage.toFixed(2)}` : pnlPercentage.toFixed(2),
        margin: pos.amount,
        status: pos.status,
        createdAt: pos.created_at
      };
    });

    // 총 PnL 계산
    const totalPnl = formattedPositions.reduce((sum, pos) => {
      const pnl = parseFloat(pos.pnl.replace('+', '').replace('-', ''));
      return sum + (pos.pnl.startsWith('-') ? -pnl : pnl);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        positions: formattedPositions,
        summary: {
          totalPositions: formattedPositions.length,
          totalPnl: totalPnl.toFixed(2),
          totalMargin: formattedPositions.reduce((sum, pos) => sum + parseFloat(pos.margin), 0).toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('Quick trade positions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
} 