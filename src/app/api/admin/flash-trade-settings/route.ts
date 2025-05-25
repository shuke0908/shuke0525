import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 개발 환경용 관리자 설정 저장소
interface AdminSettings {
  id: string;
  userId?: string; // null이면 전체 기본 설정
  winRate: number; // 승률 (0-100)
  maxProfitRate: number; // 최대 수익률 (10-200)
  forceResult?: 'win' | 'lose' | null; // 강제 결과
  minAmount: number;
  maxAmount: number;
  availableDurations: number[]; // 사용 가능한 거래 시간 (초)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 메모리 저장소 (실제로는 데이터베이스 사용)
let adminSettings: AdminSettings[] = [
  {
    id: 'global-1',
    winRate: 45, // 기본 45% 승률
    maxProfitRate: 85, // 기본 85% 수익률
    forceResult: null,
    minAmount: 10,
    maxAmount: 10000,
    availableDurations: [30, 60, 120, 300],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 설정 스키마
const settingsSchema = z.object({
  userId: z.string().optional(),
  winRate: z.number().min(0).max(100),
  maxProfitRate: z.number().min(10).max(200),
  forceResult: z.enum(['win', 'lose']).nullable().optional(),
  minAmount: z.number().min(1),
  maxAmount: z.number().min(1),
  availableDurations: z.array(z.number().min(15).max(3600)),
  isActive: z.boolean().optional().default(true)
});

/**
 * 관리자 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 추출 (미들웨어에서 설정)
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    let settings;
    if (userId) {
      // 특정 사용자 설정 조회
      settings = adminSettings.find(s => s.userId === userId);
    } else {
      // 전체 기본 설정 조회
      settings = adminSettings.find(s => !s.userId);
    }

    if (!settings) {
      // 기본 설정 반환
      settings = adminSettings[0];
    }

    return NextResponse.json(
      {
        success: true,
        settings
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Settings fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * 관리자 설정 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 추출 (미들웨어에서 설정)
    const userRole = request.headers.get('x-user-role');
    const adminId = request.headers.get('x-user-id');
    
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // 요청 데이터 검증
    const validationResult = settingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: validationResult.error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 기존 설정 찾기
    const existingIndex = adminSettings.findIndex(s => 
      data.userId ? s.userId === data.userId : !s.userId
    );

    const newSettings: AdminSettings = {
      id: existingIndex >= 0 ? adminSettings[existingIndex].id : `settings-${Date.now()}`,
      userId: data.userId,
      winRate: data.winRate,
      maxProfitRate: data.maxProfitRate,
      forceResult: data.forceResult || null,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      availableDurations: data.availableDurations,
      isActive: data.isActive,
      createdAt: existingIndex >= 0 ? adminSettings[existingIndex].createdAt : new Date(),
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      adminSettings[existingIndex] = newSettings;
    } else {
      adminSettings.push(newSettings);
    }

    // 관리자 액션 로그
    console.log(`[ADMIN_ACTION] ${adminId} updated FlashTrade settings for ${data.userId || 'global'}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Settings updated successfully',
        settings: newSettings
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Settings update error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * 모든 설정 조회 (관리자용)
 */
export async function PUT(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 추출 (미들웨어에서 설정)
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        allSettings: adminSettings
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('All settings fetch error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * 설정 삭제 (특정 사용자 설정만)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 추출 (미들웨어에서 설정)
    const userRole = request.headers.get('x-user-role');
    const adminId = request.headers.get('x-user-id');
    
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Super admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // 전체 기본 설정은 삭제할 수 없음
    const settingIndex = adminSettings.findIndex(s => s.userId === userId);
    
    if (settingIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Settings not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    adminSettings.splice(settingIndex, 1);

    // 관리자 액션 로그
    console.log(`[ADMIN_ACTION] ${adminId} deleted FlashTrade settings for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Settings deleted successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Settings delete error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// 설정 조회 함수 (다른 API에서 사용)
export function getFlashTradeSettings(userId?: string): AdminSettings {
  const userSettings = userId ? adminSettings.find(s => s.userId === userId) : null;
  const globalSettings = adminSettings.find(s => !s.userId);
  
  return userSettings || globalSettings || adminSettings[0];
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 