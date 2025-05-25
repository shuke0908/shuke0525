import { NextRequest, NextResponse } from 'next/server';
import { getFlashTradeSettings } from '../../../admin/flash-trade-settings/route';
import { getFlashTrades, updateFlashTrade, updateUserBalance } from '../create/route';

// 관리자 설정 기반 결과 결정 로직
function determineTradeResult(trade: any) {
  // 관리자 설정 조회
  const settings = getFlashTradeSettings(trade.userId);

  // 강제 결과가 설정된 경우
  if (settings.forceResult) {
    return {
      result: settings.forceResult,
      profitRate: settings.maxProfitRate
    };
  }

  // 승률 기반 결과 결정
  const random = Math.random() * 100;
  const isWin = random < settings.winRate;

  return {
    result: isWin ? 'win' : 'lose',
    profitRate: settings.maxProfitRate
  };
}

export async function POST(request: NextRequest) {
  try {
    // 만료된 활성 거래 조회
    const allTrades = getFlashTrades();
    const now = new Date();
    const expiredTrades = allTrades.filter(trade => 
      trade.status === 'active' && new Date(trade.expiresAt) <= now
    );

    if (expiredTrades.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No expired trades to process',
          processedCount: 0
        },
        { status: 200 }
      );
    }

    let processedCount = 0;
    const results = [];

    for (const trade of expiredTrades) {
      try {
        // 결과 결정
        const { result, profitRate } = determineTradeResult(trade);

        // 종료 가격 시뮬레이션
        const priceChange = (Math.random() - 0.5) * 1000; // -$500 ~ +$500
        const exitPrice = trade.entryPrice + priceChange;

        // 수익 계산
        let profit = 0;
        if (result === 'win') {
          profit = trade.amount * (profitRate / 100);
        } else {
          profit = -trade.amount; // 손실
        }

        // 거래 업데이트
        const updatedTrade = updateFlashTrade(trade.id, {
          exitPrice,
          result,
          profit,
          status: 'completed',
          completedAt: new Date()
        });

        if (!updatedTrade) {
          console.error(`Failed to update trade ${trade.id}`);
          continue;
        }

        // 승리한 경우 사용자 잔액 업데이트 (원금 + 수익)
        if (result === 'win') {
          const returnAmount = trade.amount + profit; // 원금 반환 + 수익
          updateUserBalance(trade.userId, returnAmount);
        }
        // 패배한 경우는 이미 거래 생성 시 차감되었으므로 추가 처리 없음

        processedCount++;
        results.push({
          tradeId: trade.id,
          result,
          profit,
          exitPrice,
          returnAmount: result === 'win' ? trade.amount + profit : 0
        });

        console.log(`✅ Auto-completed: ${trade.id} - ${result} - Profit: $${profit}`);

      } catch (tradeError) {
        console.error(`Error processing trade ${trade.id}:`, tradeError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `${processedCount} trades auto-completed successfully`,
        processedCount,
        results
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Auto-complete processing error:', error);
    
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

// Vercel Cron Job을 위한 GET 메서드도 지원
export async function GET(request: NextRequest) {
  return POST(request);
} 