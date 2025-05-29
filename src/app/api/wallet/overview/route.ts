import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { users, walletTransactions } from '@/../shared/schema';
import { db } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

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

    // 사용자 정보 조회
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    // 시뮬레이션된 코인 가격 데이터
    const coinPrices = {
      BTC: { price: 43250.50, change24h: 2.45 },
      ETH: { price: 2580.75, change24h: -1.23 },
      USDT: { price: 1.00, change24h: 0.01 },
      BNB: { price: 315.20, change24h: 3.67 },
      ADA: { price: 0.485, change24h: -2.15 },
      SOL: { price: 98.45, change24h: 5.23 },
      XRP: { price: 0.625, change24h: -0.87 },
      DOT: { price: 7.25, change24h: 1.95 }
    };

    // 시뮬레이션된 사용자 보유 자산 (실제로는 DB에서 조회)
    const mockBalances = [
      { coin: 'Bitcoin', symbol: 'BTC', balance: 0.15432, logo: '/coins/btc.png' },
      { coin: 'Ethereum', symbol: 'ETH', balance: 2.5678, logo: '/coins/eth.png' },
      { coin: 'Tether USD', symbol: 'USDT', balance: 1250.00, logo: '/coins/usdt.png' },
      { coin: 'Binance Coin', symbol: 'BNB', balance: 5.234, logo: '/coins/bnb.png' },
    ];

    // 각 코인의 USD 가치 계산
    const coinBalances = mockBalances.map(balance => {
      const priceData = coinPrices[balance.symbol as keyof typeof coinPrices];
      const usdValue = balance.balance * priceData.price;
      
      return {
        ...balance,
        currentPrice: priceData.price,
        priceChange24h: priceData.change24h,
        usdValue
      };
    });

    // 총 자산 가치 계산
    const totalAssetValue = coinBalances.reduce((sum, coin) => sum + coin.usdValue, 0);
    
    // 전일 대비 변화 계산 (시뮬레이션)
    const totalAssetValueChange = coinBalances.reduce((sum, coin) => {
      const yesterdayPrice = coin.currentPrice / (1 + coin.priceChange24h / 100);
      const yesterdayValue = coin.balance * yesterdayPrice;
      return sum + (coin.usdValue - yesterdayValue);
    }, 0);

    const totalAssetValueChangePercent = totalAssetValue > 0 
      ? (totalAssetValueChange / (totalAssetValue - totalAssetValueChange)) * 100 
      : 0;

    const overviewData = {
      totalAssetValue,
      totalAssetValueChange,
      totalAssetValueChangePercent,
      coinBalances
    };

    return NextResponse.json({
      success: true,
      data: overviewData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Wallet overview API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet overview' },
      { status: 500 }
    );
  }
} 