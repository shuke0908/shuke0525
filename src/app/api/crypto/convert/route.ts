import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, amount } = body;

    if (!from || !to || !amount) {
      return NextResponse.json(
        { error: 'From, to, and amount are required' },
        { status: 400 }
      );
    }

    // 환율 데이터 (실제로는 외부 API에서 가져옴)
    const rates: { [key: string]: { [key: string]: number } } = {
      BTC: { USD: 43250.50, EUR: 39875.25, KRW: 57234500 },
      ETH: { USD: 2650.75, EUR: 2445.30, KRW: 3512750 },
      USDT: { USD: 1.00, EUR: 0.92, KRW: 1325 },
      BNB: { USD: 315.80, EUR: 291.45, KRW: 418435 },
      XRP: { USD: 0.62, EUR: 0.57, KRW: 821 }
    };

    let convertedAmount = 0;
    let rate = 0;

    if (from === to) {
      convertedAmount = parseFloat(amount);
      rate = 1;
    } else if (rates[from] && rates[from][to]) {
      rate = rates[from][to];
      convertedAmount = parseFloat(amount) * rate;
    } else if (rates[to] && rates[to][from]) {
      rate = 1 / rates[to][from];
      convertedAmount = parseFloat(amount) * rate;
    } else {
      // USD를 중간 통화로 사용
      const fromToUsd = rates[from]?.USD || 1;
      const toFromUsd = rates[to]?.USD || 1;
      rate = fromToUsd / toFromUsd;
      convertedAmount = parseFloat(amount) * rate;
    }

    return NextResponse.json({
      success: true,
      from,
      to,
      amount: parseFloat(amount),
      convertedAmount,
      rate,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Crypto conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert crypto' },
      { status: 500 }
    );
  }
} 