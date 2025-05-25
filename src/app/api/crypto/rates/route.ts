import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 실시간 환율 데이터 (실제로는 외부 API에서 가져옴)
    const rates = {
      BTC: {
        USD: 43250.50,
        EUR: 39875.25,
        KRW: 57234500,
        change24h: 2.45
      },
      ETH: {
        USD: 2650.75,
        EUR: 2445.30,
        KRW: 3512750,
        change24h: -1.23
      },
      USDT: {
        USD: 1.00,
        EUR: 0.92,
        KRW: 1325,
        change24h: 0.01
      },
      BNB: {
        USD: 315.80,
        EUR: 291.45,
        KRW: 418435,
        change24h: 3.67
      },
      XRP: {
        USD: 0.62,
        EUR: 0.57,
        KRW: 821,
        change24h: -0.89
      }
    };

    return NextResponse.json({
      success: true,
      rates,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Crypto rates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crypto rates' },
      { status: 500 }
    );
  }
} 