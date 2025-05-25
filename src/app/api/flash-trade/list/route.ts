import { NextRequest, NextResponse } from 'next/server';
import { getFlashTrades } from '../create/route';

/**
 * 사용자 FlashTrade 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 추출 (미들웨어에서 설정)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId || !userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // 'active', 'completed', 'all'
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 사용자의 거래 목록 조회
    let userTrades = getFlashTrades(userId);

    // 상태별 필터링
    if (status && status !== 'all') {
      userTrades = userTrades.filter(trade => trade.status === status);
    }

    // 최신순 정렬
    userTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 페이지네이션
    const total = userTrades.length;
    const paginatedTrades = userTrades.slice(offset, offset + limit);

    // 응답 데이터 포맷팅
    const formattedTrades = paginatedTrades.map(trade => ({
      id: trade.id,
      amount: trade.amount,
      direction: trade.direction,
      duration: trade.duration,
      symbol: trade.symbol,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      currentPrice: trade.currentPrice,
      status: trade.status,
      result: trade.result,
      profit: trade.profit,
      potentialProfit: trade.potentialProfit,
      returnRate: trade.returnRate,
      createdAt: trade.createdAt,
      expiresAt: trade.expiresAt,
      completedAt: trade.completedAt,
      // 진행률 계산 (활성 거래만)
      progress: trade.status === 'active' ? 
        Math.min(100, Math.max(0, (Date.now() - new Date(trade.createdAt).getTime()) / (new Date(trade.expiresAt).getTime() - new Date(trade.createdAt).getTime()) * 100)) : 
        100,
      // 남은 시간 (활성 거래만)
      remainingTime: trade.status === 'active' ? 
        Math.max(0, new Date(trade.expiresAt).getTime() - Date.now()) : 
        0
    }));

    // 통계 계산
    const stats = {
      total: userTrades.length,
      active: userTrades.filter(t => t.status === 'active').length,
      completed: userTrades.filter(t => t.status === 'completed').length,
      wins: userTrades.filter(t => t.result === 'win').length,
      losses: userTrades.filter(t => t.result === 'lose').length,
      totalProfit: userTrades.reduce((sum, t) => sum + (t.profit || 0), 0),
      winRate: userTrades.filter(t => t.result).length > 0 ? 
        (userTrades.filter(t => t.result === 'win').length / userTrades.filter(t => t.result).length * 100) : 0
    };

    return NextResponse.json(
      {
        success: true,
        trades: formattedTrades,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        stats
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('FlashTrade list error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 