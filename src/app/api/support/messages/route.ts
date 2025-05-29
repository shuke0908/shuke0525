import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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
    const formData = await request.formData();
    
    const chatId = formData.get('chatId') as string;
    const message = formData.get('message') as string;
    const attachment = formData.get('attachment') as File | null;

    if (!chatId) {
      return NextResponse.json({ 
        error: 'Chat ID is required' 
      }, { status: 400 });
    }

    if (!message && !attachment) {
      return NextResponse.json({ 
        error: 'Message or attachment is required' 
      }, { status: 400 });
    }

    let attachmentUrl = '';
    let attachmentName = '';

    // 파일 첨부 처리
    if (attachment) {
      const bytes = await attachment.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 파일명 생성 (실제로는 더 안전한 방법 사용)
      const fileName = `${Date.now()}-${attachment.name}`;
      const filePath = join(process.cwd(), 'public', 'uploads', 'support', fileName);
      
      try {
        await writeFile(filePath, buffer);
        attachmentUrl = `/uploads/support/${fileName}`;
        attachmentName = attachment.name;
      } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
          { error: 'Failed to upload attachment' },
          { status: 500 }
        );
      }
    }

    // 실제 구현에서는 DB에 저장
    const newMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: userId,
      senderType: 'user' as const,
      senderName: '사용자',
      message: message || '',
      attachmentUrl: attachmentUrl || undefined,
      attachmentName: attachmentName || undefined,
      createdAt: new Date().toISOString()
    };

    // 시뮬레이션: 관리자 자동 응답 (실제로는 WebSocket 등으로 실시간 처리)
    const autoReply = {
      id: `msg-${Date.now() + 1}`,
      chatId,
      senderId: 'admin-1',
      senderType: 'admin' as const,
      senderName: '김상담',
      message: '메시지를 확인했습니다. 곧 답변드리겠습니다.',
      createdAt: new Date(Date.now() + 2000).toISOString() // 2초 후
    };

    return NextResponse.json({
      success: true,
      data: {
        message: newMessage,
        autoReply: Math.random() > 0.7 ? autoReply : null // 30% 확률로 자동 응답
      },
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 