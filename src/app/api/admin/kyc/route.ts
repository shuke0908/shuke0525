import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 실제 구현에서는 데이터베이스에서 KYC 데이터를 가져옵니다
    const documents = [
      {
        id: 1,
        userId: "user1",
        documentType: "passport",
        documentUrl: "/uploads/kyc/passport1.jpg",
        status: "pending",
        reason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: "user2",
        documentType: "driver_license",
        documentUrl: "/uploads/kyc/license2.jpg", 
        status: "approved",
        reason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching KYC documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYC documents' },
      { status: 500 }
    );
  }
} 