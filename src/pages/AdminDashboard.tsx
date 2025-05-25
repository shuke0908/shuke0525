import React from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpIcon,
  ArrowDownIcon,
  Activity,
  Shield,
  Clock
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Mock data - 실제로는 API에서 가져와야 함
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalVolume: 2847392.50,
    pendingKyc: 24,
    pendingDeposits: 16,
    pendingWithdrawals: 12,
    systemHealth: 98.5,
    activeFlashTrades: 156,
  };

  return (
    <AppLayout 
      title="관리자 대시보드"
      description="플랫폼 개요 및 분석"
      variant="admin"
    >
      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                +12.5%
              </span>
              지난 달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                +8.2%
              </span>
              지난 주 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 거래량</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                +15.3%
              </span>
              지난 달 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                정상 운영
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 대기 중인 요청 및 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              대기 중인 요청
            </CardTitle>
            <CardDescription>
              관리자 승인이 필요한 항목들
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">KYC 인증</span>
              <Badge variant="destructive">{stats.pendingKyc}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">입금 승인</span>
              <Badge variant="destructive">{stats.pendingDeposits}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">출금 승인</span>
              <Badge variant="destructive">{stats.pendingWithdrawals}</Badge>
            </div>
            <Button className="w-full mt-4" variant="outline">
              모든 요청 보기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              실시간 활동
            </CardTitle>
            <CardDescription>
              현재 플랫폼 활동 현황
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">활성 Flash Trade</span>
              <Badge variant="secondary">{stats.activeFlashTrades}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">온라인 사용자</span>
              <Badge variant="secondary">{stats.activeUsers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">진행 중인 거래</span>
              <Badge variant="secondary">89</Badge>
            </div>
            <Button className="w-full mt-4" variant="outline">
              실시간 모니터링
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 시스템 활동</CardTitle>
          <CardDescription>
            최근 24시간 동안의 주요 시스템 이벤트
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">새로운 사용자 등록</p>
                <p className="text-xs text-muted-foreground">user@example.com이 계정을 생성했습니다.</p>
              </div>
              <span className="text-xs text-muted-foreground">2분 전</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">KYC 인증 완료</p>
                <p className="text-xs text-muted-foreground">사용자 ID: 1234의 KYC가 승인되었습니다.</p>
              </div>
              <span className="text-xs text-muted-foreground">5분 전</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">대량 거래 감지</p>
                <p className="text-xs text-muted-foreground">$50,000 이상의 거래가 감지되었습니다.</p>
              </div>
              <span className="text-xs text-muted-foreground">15분 전</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
} 