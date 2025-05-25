import { NextRequest, NextResponse } from 'next/server';

// 암호화폐 시뮬레이션 데이터
const CRYPTO_DATA = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.50,
    change24h: 2.45,
    volume24h: 28500000000,
    marketCap: 847000000000,
    rank: 1
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2650.75,
    change24h: -1.23,
    volume24h: 15200000000,
    marketCap: 318000000000,
    rank: 2
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    price: 1.00,
    change24h: 0.01,
    volume24h: 45800000000,
    marketCap: 91500000000,
    rank: 3
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    price: 315.80,
    change24h: 3.67,
    volume24h: 1850000000,
    marketCap: 47200000000,
    rank: 4
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    price: 0.62,
    change24h: -0.89,
    volume24h: 1420000000,
    marketCap: 33800000000,
    rank: 5
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 98.45,
    change24h: 5.23,
    volume24h: 2100000000,
    marketCap: 42500000000,
    rank: 6
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.48,
    change24h: -2.15,
    volume24h: 580000000,
    marketCap: 17200000000,
    rank: 7
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 36.72,
    change24h: 4.12,
    volume24h: 890000000,
    marketCap: 14800000000,
    rank: 8
  }
];

// 가격 변동 시뮬레이션
function simulatePriceChange(basePrice: number) {
  const changePercent = (Math.random() - 0.5) * 0.02; // ±1% 변동
  return basePrice * (1 + changePercent);
}

// 24시간 변동률 시뮬레이션
function simulate24hChange() {
  return (Math.random() - 0.5) * 10; // ±5% 변동
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // 실시간 가격 시뮬레이션
    const cryptoData = CRYPTO_DATA.map(crypto => ({
      ...crypto,
      price: simulatePriceChange(crypto.price),
      change24h: simulate24hChange(),
      lastUpdated: new Date().toISOString()
    }));

    // 특정 심볼 요청
    if (symbol) {
      const coin = cryptoData.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
      if (!coin) {
        return NextResponse.json(
          { error: 'Cryptocurrency not found' },
          { status: 404 }
        );
      }

      // 가격 히스토리 시뮬레이션 (24시간)
      const priceHistory = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        const price = coin.price * (1 + (Math.random() - 0.5) * 0.05);
        priceHistory.push({
          timestamp: timestamp.toISOString(),
          price: Math.round(price * 100) / 100
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          ...coin,
          priceHistory
        }
      });
    }

    // 전체 목록 또는 제한된 목록
    const limitedData = cryptoData.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedData,
      total: cryptoData.length
    });

  } catch (error) {
    console.error('Crypto API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrency data' },
      { status: 500 }
    );
  }
}

// 거래 쌍 정보 조회
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pairs } = body;

    if (!pairs || !Array.isArray(pairs)) {
      return NextResponse.json(
        { error: 'Trading pairs array is required' },
        { status: 400 }
      );
    }

    const tradingPairs = pairs.map((pair: string) => {
      const [base, quote] = pair.split('/');
      const baseCrypto = CRYPTO_DATA.find(c => c.symbol === base);
      
      if (!baseCrypto) {
        return null;
      }

      return {
        symbol: pair,
        baseAsset: base,
        quoteAsset: quote,
        price: simulatePriceChange(baseCrypto.price),
        change24h: simulate24hChange(),
        volume24h: baseCrypto.volume24h * 0.1, // 거래 쌍별 볼륨은 전체의 10%로 가정
        bid: simulatePriceChange(baseCrypto.price) * 0.999, // 매수 호가
        ask: simulatePriceChange(baseCrypto.price) * 1.001, // 매도 호가
        spread: 0.1, // 0.1% 스프레드
        lastUpdated: new Date().toISOString()
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: tradingPairs
    });

  } catch (error) {
    console.error('Trading pairs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trading pairs data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 