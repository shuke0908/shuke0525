import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { supportChats, supportMessages } from '@/../shared/schema';
import { eq, desc } from 'drizzle-orm';

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

    // 시뮬레이션 데이터 (실제로는 DB에서 조회)
    const mockChats = [
      {
        id: 'chat-1',
        subject: '입금 문의',
        status: 'active' as const,
        priority: 'normal' as const,
        assignedAdminName: '김상담',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
        lastMessageAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
        messages: [
          {
            id: 'msg-1',
            chatId: 'chat-1',
            senderId: userId,
            senderType: 'user' as const,
            senderName: '사용자',
            message: '안녕하세요. 입금 문의에 대해 문의드립니다.',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-2',
            chatId: 'chat-1',
            senderId: 'admin-1',
            senderType: 'admin' as const,
            senderName: '김상담',
            message: '안녕하세요! 입금 관련 문의 주셔서 감사합니다. 어떤 부분이 궁금하신가요?',
            createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-3',
            chatId: 'chat-1',
            senderId: userId,
            senderType: 'user' as const,
            senderName: '사용자',
            message: 'USDT로 입금했는데 아직 반영이 안 되었습니다. 확인 부탁드립니다.',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-4',
            chatId: 'chat-1',
            senderId: 'admin-1',
            senderType: 'admin' as const,
            senderName: '김상담',
            message: '거래 해시를 알려주시면 확인해드리겠습니다.',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: 'chat-2',
        subject: 'VIP 등급 문의',
        status: 'resolved' as const,
        priority: 'low' as const,
        assignedAdminName: '이상담',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
        lastMessageAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12시간 전
        messages: [
          {
            id: 'msg-5',
            chatId: 'chat-2',
            senderId: userId,
            senderType: 'user' as const,
            senderName: '사용자',
            message: 'VIP 등급 혜택에 대해 자세히 알고 싶습니다.',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-6',
            chatId: 'chat-2',
            senderId: 'admin-2',
            senderType: 'admin' as const,
            senderName: '이상담',
            message: 'VIP 페이지에서 자세한 정보를 확인하실 수 있습니다. 추가 문의사항이 있으시면 언제든 연락주세요!',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockChats
    });

  } catch (error) {
    console.error('Support chats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { subject, priority, initialMessage } = await request.json();

    if (!subject || !priority || !initialMessage) {
      return NextResponse.json({ 
        error: 'Subject, priority, and initial message are required' 
      }, { status: 400 });
    }

    // 실제 구현에서는 DB에 저장
    const newChatId = `chat-${Date.now()}`;
    const newChat = {
      id: newChatId,
      subject,
      status: 'pending' as const,
      priority,
      assignedAdminName: undefined,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          chatId: newChatId,
          senderId: userId,
          senderType: 'user' as const,
          senderName: '사용자',
          message: initialMessage,
          createdAt: new Date().toISOString()
        },
        {
          id: `msg-${Date.now() + 1}`,
          chatId: newChatId,
          senderId: 'system',
          senderType: 'system' as const,
          senderName: '시스템',
          message: '상담 요청이 접수되었습니다. 곧 담당자가 배정될 예정입니다.',
          createdAt: new Date().toISOString()
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: newChat,
      message: 'Support chat created successfully'
    });

  } catch (error) {
    console.error('Create support chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to create support chat' },
      { status: 500 }
    );
  }
} 