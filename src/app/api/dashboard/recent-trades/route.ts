import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';

const supabase = createServerSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // JWT 토큰에서 사용자 ID 추출
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 실제 데이터베이스에서 최근 거래 내역 조회
    const { data: flashTrades, error: flashError } = await supabase
      .from('flash_trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: quickTrades, error: quickError } = await supabase
      .from('quick_trade_positions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(10);

    // 거래 내역 통합 및 포맷팅
    const allTrades = [];
    
    // Flash Trade 데이터 변환
    if (flashTrades) {
      flashTrades.forEach(trade => {
        allTrades.push({
          id: trade.id,
          asset: 'BTC/USD', // Flash Trade는 기본적으로 BTC
          type: trade.direction === 'up' ? 'buy' : 'sell',
          amount: trade.amount,
          price: trade.start_price,
          pnl: parseFloat(trade.profit) || 0,
          status: 'completed',
          timestamp: trade.created_at,
          leverage: 1,
          fees: 0,
          tradeType: 'flash'
        });
      });
    }

    // Quick Trade 데이터 변환
    if (quickTrades) {
      quickTrades.forEach(trade => {
        allTrades.push({
          id: trade.id,
          asset: trade.symbol,
          type: trade.side,
          amount: trade.amount,
          price: trade.entry_price,
          pnl: parseFloat(trade.pnl) || 0,
          status: 'completed',
          timestamp: trade.created_at,
          leverage: trade.leverage,
          fees: 0,
          tradeType: 'quick'
        });
      });
    }

    // 시간순 정렬
    const trades = allTrades
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

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