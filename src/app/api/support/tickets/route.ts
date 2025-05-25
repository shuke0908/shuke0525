import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 티켓 목록
    const tickets = [
      {
        id: 1,
        subject: 'Withdrawal Issue',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
        lastReply: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        category: 'withdrawal'
      },
      {
        id: 2,
        subject: 'Account Verification',
        status: 'resolved',
        priority: 'medium',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2일 전
        lastReply: new Date(Date.now() - 86400000).toISOString(), // 1일 전
        category: 'verification'
      }
    ];

    return NextResponse.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Tickets fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, category, priority } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // 새 티켓 생성 (실제로는 데이터베이스에 저장)
    const newTicket = {
      id: Date.now(),
      subject,
      message,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newTicket,
      message: 'Ticket created successfully'
    });
  } catch (error) {
    console.error('Ticket creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
} 