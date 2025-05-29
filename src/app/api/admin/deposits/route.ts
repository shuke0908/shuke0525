import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock 데이터 반환
    const deposits = [
      {
        id: 1,
        userId: "user1",
        username: "john_doe",
        amount: "100.00",
        coin: "USDT",
        status: "pending",
        screenshotPath: "/uploads/deposit1.jpg",
        reason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: "user2", 
        username: "jane_smith",
        amount: "250.00",
        coin: "BTC",
        status: "approved",
        screenshotPath: "/uploads/deposit2.jpg",
        reason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        userId: "user3",
        username: "bob_wilson",
        amount: "75.00",
        coin: "ETH",
        status: "rejected",
        screenshotPath: "/uploads/deposit3.jpg",
        reason: "Invalid screenshot",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { depositId, action, reason } = body;

    if (!depositId || !action) {
      return NextResponse.json(
        { error: 'Deposit ID and action are required' },
        { status: 400 }
      );
    }

    // Mock 응답
    return NextResponse.json({
      success: true,
      message: `Deposit ${action} successfully`,
      deposit: {
        id: depositId,
        status: action,
        reason: reason || null,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating deposit:', error);
    return NextResponse.json(
      { error: 'Failed to update deposit' },
      { status: 500 }
    );
  }
} 