import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// 데이터 파일 경로
const TRADES_FILE_PATH = path.join(process.cwd(), 'data', 'quick-trades.json');
const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

// 개발 환경용 사용자 데이터
const DEVELOPMENT_USERS = [
  {
    id: 'admin-1',
    email: 'admin@quanttrade.com',
    username: 'admin',
    role: 'superadmin',
    balance: 10000,
    isActive: true
  },
  {
    id: 'user-1',
    email: 'user@quanttrade.com',
    username: 'user',
    role: 'user',
    balance: 1000,
    isActive: true
  },
  {
    id: 'trader-1',
    email: 'trader@quanttrade.com',
    username: 'trader',
    role: 'admin',
    balance: 5000,
    isActive: true
  }
];

// 파일 읽기 유틸리티
function readJsonFile(filePath: string, defaultData: any = []) {
  try {
    const dataDir = path.dirname(filePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }

    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

// 토큰 검증
function verifyUserToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// 사용자 정보 조회
function getUserById(userId: string) {
  const users = readJsonFile(USERS_FILE_PATH, DEVELOPMENT_USERS);
  return users.find((user: any) => user.id === userId);
}

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const user = verifyUserToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 정보 조회
    const userData = getUserById(user.userId);
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 거래 내역 조회
    const trades = readJsonFile(TRADES_FILE_PATH, []);
    const userTrades = trades.filter((trade: any) => trade.user_id === user.userId);

    // 통계 계산
    const totalTrades = userTrades.length;
    const winTrades = userTrades.filter((trade: any) => trade.result === 'win').length;
    const loseTrades = userTrades.filter((trade: any) => trade.result === 'lose').length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

    const totalProfit = userTrades.reduce((sum: number, trade: any) => sum + (trade.profit || 0), 0);
    const totalVolume = userTrades.reduce((sum: number, trade: any) => sum + (trade.amount || 0), 0);

    // 최근 7일 거래 데이터
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTrades = userTrades.filter((trade: any) => 
      new Date(trade.created_at) >= sevenDaysAgo
    );

    // 일별 수익 데이터 (차트용)
    const dailyProfits = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTrades = userTrades.filter((trade: any) => 
        trade.created_at.startsWith(dateStr)
      );
      
      const dayProfit = dayTrades.reduce((sum: number, trade: any) => sum + (trade.profit || 0), 0);
      
      dailyProfits.push({
        date: dateStr,
        profit: dayProfit,
        trades: dayTrades.length
      });
    }

    // 포트폴리오 분포 (시뮬레이션)
    const portfolio = [
      { symbol: 'BTC', percentage: 35, value: userData.balance * 0.35 },
      { symbol: 'ETH', percentage: 25, value: userData.balance * 0.25 },
      { symbol: 'USDT', percentage: 20, value: userData.balance * 0.20 },
      { symbol: 'BNB', percentage: 10, value: userData.balance * 0.10 },
      { symbol: 'Others', percentage: 10, value: userData.balance * 0.10 }
    ];

    // 최근 거래 (최대 10개)
    const recentTradesData = userTrades
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          balance: userData.balance,
          role: userData.role
        },
        stats: {
          totalTrades,
          winTrades,
          loseTrades,
          winRate: Math.round(winRate * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          totalVolume: Math.round(totalVolume * 100) / 100,
          recentTradesCount: recentTrades.length
        },
        charts: {
          dailyProfits,
          portfolio
        },
        recentTrades: recentTradesData,
        notifications: [
          {
            id: 1,
            type: 'info',
            title: '환영합니다!',
            message: 'QuantTrade 플랫폼에 오신 것을 환영합니다.',
            timestamp: new Date().toISOString(),
            read: false
          }
        ]
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 