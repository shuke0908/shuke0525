import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, vipLevelSettings } from '@/../shared/schema';
import { eq } from 'drizzle-orm';

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

    // 사용자 정보 조회
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    // VIP 레벨 설정 정보 (시뮬레이션 데이터)
    const vipLevels = [
      {
        level: 1,
        name: 'Bronze',
        minTradeVolume: 0,
        tradeFeeDiscount: 0,
        withdrawalPriority: 0,
        benefits: ['기본 거래 기능', '표준 고객 지원'],
        color: 'gray',
        icon: 'badge'
      },
      {
        level: 2,
        name: 'Silver',
        minTradeVolume: 10000,
        tradeFeeDiscount: 5,
        withdrawalPriority: 1,
        benefits: ['5% 거래 수수료 할인', '우선 출금 처리', '월간 보너스 지급'],
        color: 'green',
        icon: 'shield'
      },
      {
        level: 3,
        name: 'Gold',
        minTradeVolume: 50000,
        tradeFeeDiscount: 10,
        withdrawalPriority: 2,
        benefits: ['10% 거래 수수료 할인', '전담 고객 지원', '특별 이벤트 참여', 'VIP 전용 분석 리포트'],
        color: 'blue',
        icon: 'star'
      },
      {
        level: 4,
        name: 'Platinum',
        minTradeVolume: 100000,
        tradeFeeDiscount: 20,
        withdrawalPriority: 3,
        benefits: ['20% 거래 수수료 할인', '프리미엄 고객 지원', '개인 투자 상담', '독점 투자 기회'],
        color: 'purple',
        icon: 'sparkles'
      },
      {
        level: 5,
        name: 'Diamond',
        minTradeVolume: 500000,
        tradeFeeDiscount: 30,
        withdrawalPriority: 4,
        benefits: ['30% 거래 수수료 할인', '24/7 전담 매니저', '맞춤형 투자 전략', '최우선 출금 처리', '연간 VIP 이벤트 초대'],
        color: 'yellow',
        icon: 'crown'
      }
    ];

    // 현재 사용자의 VIP 레벨 정보
    const currentLevel = userData.vipLevel || 1;
    const currentLevelInfo = vipLevels.find(level => level.level === currentLevel);
    
    // 시뮬레이션된 거래량 (실제로는 DB에서 계산)
    const totalTradeVolume = 25000; // 예시 거래량
    
    // 다음 레벨 정보 계산
    const nextLevel = vipLevels.find(level => level.level === currentLevel + 1);
    const nextLevelRequirement = nextLevel ? nextLevel.minTradeVolume : 0;
    const progressToNext = nextLevel 
      ? Math.min((totalTradeVolume / nextLevelRequirement) * 100, 100)
      : 100;

    // 현재 레벨의 특별 혜택
    const specialBenefits = currentLevelInfo?.benefits.slice(2) || [];

    const vipInfo = {
      currentLevel,
      currentLevelName: currentLevelInfo?.name || 'Bronze',
      totalTradeVolume,
      nextLevelRequirement,
      progressToNext,
      tradeFeeDiscount: currentLevelInfo?.tradeFeeDiscount || 0,
      withdrawalPriority: currentLevelInfo?.withdrawalPriority || 0,
      specialBenefits,
      vipLevels
    };

    return NextResponse.json({
      success: true,
      data: vipInfo
    });

  } catch (error) {
    console.error('VIP info API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VIP information' },
      { status: 500 }
    );
  }
} 