import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 실제 구현에서는 데이터베이스에서 출금 데이터를 가져옵니다
    const withdrawals = [
      {
        id: 1,
        userId: "user1",
        username: "john_doe",
        amount: "50.00",
        coin: "USDT",
        destinationAddress: "0x1234567890abcdef1234567890abcdef12345678",
        status: "pending",
        reason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: "user2",
        username: "jane_smith", 
        amount: "0.001",
        coin: "BTC",
        destinationAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        status: "approved",
        reason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
} 