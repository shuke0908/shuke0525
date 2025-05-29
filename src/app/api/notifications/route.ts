import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/../shared/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';

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
    const { searchParams } = new URL(request.url);
    
    // 필터 파라미터 추출
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 조건 배열 생성
    const conditions = [eq(notifications.userId, userId)];

    // 타입 필터
    if (type && type !== 'all') {
      conditions.push(eq(notifications.type, type));
    }

    // 읽음 상태 필터
    if (isRead && isRead !== 'all') {
      conditions.push(eq(notifications.isRead, isRead === 'true'));
    }

    // 검색 필터
    if (search) {
      conditions.push(
        or(
          like(notifications.title, `%${search}%`),
          like(notifications.content, `%${search}%`)
        )
      );
    }

    // 실제 데이터가 없으므로 시뮬레이션 데이터 생성
    const mockNotifications = [
      {
        id: '1',
        userId,
        type: 'trade' as const,
        title: 'Flash Trade 거래 완료',
        content: 'BTC 상승 예측 거래가 성공적으로 완료되었습니다. 수익: +$125.50',
        isRead: false,
        metadata: { amount: 100, profit: 125.50, direction: 'up' },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30분 전
      },
      {
        id: '2',
        userId,
        type: 'deposit' as const,
        title: '입금 승인 완료',
        content: 'USDT 500 입금이 승인되어 계정에 반영되었습니다.',
        isRead: false,
        metadata: { coin: 'USDT', amount: 500 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2시간 전
      },
      {
        id: '3',
        userId,
        type: 'withdrawal' as const,
        title: '출금 요청 처리 중',
        content: 'BTC 0.01 출금 요청이 접수되어 처리 중입니다.',
        isRead: true,
        metadata: { coin: 'BTC', amount: 0.01 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6시간 전
      },
      {
        id: '4',
        userId,
        type: 'system' as const,
        title: '시스템 점검 안내',
        content: '2024년 1월 15일 02:00-04:00 시스템 점검이 예정되어 있습니다.',
        isRead: true,
        metadata: { maintenanceStart: '2024-01-15T02:00:00Z', maintenanceEnd: '2024-01-15T04:00:00Z' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1일 전
      },
      {
        id: '5',
        userId,
        type: 'promotion' as const,
        title: '신규 회원 보너스 지급',
        content: '가입 축하 보너스 $100이 지급되었습니다. 거래에 활용해보세요!',
        isRead: false,
        metadata: { bonusAmount: 100, bonusType: 'welcome' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2일 전
      },
      {
        id: '6',
        userId,
        type: 'kyc' as const,
        title: 'KYC 인증 승인',
        content: '신원 인증이 성공적으로 완료되었습니다. 모든 기능을 이용하실 수 있습니다.',
        isRead: true,
        metadata: { kycLevel: 2 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3일 전
      },
      {
        id: '7',
        userId,
        type: 'security' as const,
        title: '새로운 기기에서 로그인',
        content: '새로운 기기에서 계정에 로그인했습니다. 본인이 아닌 경우 즉시 비밀번호를 변경하세요.',
        isRead: false,
        metadata: { ipAddress: '192.168.1.100', userAgent: 'Chrome/120.0.0.0' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5일 전
      }
    ];

    // 필터 적용
    let filteredNotifications = mockNotifications;

    if (type && type !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    if (isRead && isRead !== 'all') {
      const readStatus = isRead === 'true';
      filteredNotifications = filteredNotifications.filter(n => n.isRead === readStatus);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotifications = filteredNotifications.filter(n => 
        n.title.toLowerCase().includes(searchLower) || 
        n.content.toLowerCase().includes(searchLower)
      );
    }

    // 페이지네이션 적용
    const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        total: filteredNotifications.length,
        limit,
        offset,
        hasMore: offset + limit < filteredNotifications.length
      }
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
} 