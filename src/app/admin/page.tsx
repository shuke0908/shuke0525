'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  ShieldCheckIcon,
  MessageSquareIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  DollarSignIcon,
  UsersIcon,
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";
import { AdminLayoutWithSidebar } from "@/components/layout/AdminLayoutWithSidebar";
import Link from "next/link";

function AdminDashboardPage() {
  // 실시간 현황 데이터 조회
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch admin dashboard data');
      return response.json();
    },
    refetchInterval: 5000, // 5초마다 새로고침
  });

  // 플래시 트레이드 현황 조회
  const { data: flashTradeData } = useQuery({
    queryKey: ['admin', 'flash-trades'],
    queryFn: async () => {
      const response = await fetch('/api/admin/flash-trade-control');
      if (!response.ok) throw new Error('Failed to fetch flash trades');
      return response.json();
    },
    refetchInterval: 1000, // 1초마다 새로고침
  });

  if (isLoading) {
    return (
      <AdminLayoutWithSidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </AdminLayoutWithSidebar>
    );
  }

  // 실시간 현황 카드 데이터
  const pendingDeposits = dashboardData?.pendingDeposits || 16;
  const pendingWithdrawals = dashboardData?.pendingWithdrawals || 12;
  const pendingKyc = dashboardData?.pendingKyc || 24;
  const supportRequests = dashboardData?.supportRequests || 8;

  // 플래시 트레이드 현황 데이터
  const activeTrades = flashTradeData?.activeTrades || [];
  const tradeStats = flashTradeData?.statistics || {
    totalActiveTrades: 0,
    totalActiveAmount: 0,
    upTrades: 0,
    downTrades: 0
  };

  return (
    <AdminLayoutWithSidebar>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-muted-foreground">실시간 시스템 현황 및 관리</p>
        </div>

        {/* 실시간 현황 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                미승인 입금
              </CardTitle>
              <ArrowDownToLineIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {pendingDeposits}건
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                <AlertTriangleIcon className="h-3 w-3 mr-1" />
                즉시 처리 필요
              </p>
              <Link href="/admin/deposits">
                <Button size="sm" variant="outline" className="mt-2 w-full border-red-300 text-red-700 hover:bg-red-100">
                  관리하기
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                미승인 출금
              </CardTitle>
              <ArrowUpFromLineIcon className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {pendingWithdrawals}건
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                <ClockIcon className="h-3 w-3 mr-1" />
                검토 대기 중
              </p>
              <Link href="/admin/withdrawals">
                <Button size="sm" variant="outline" className="mt-2 w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                  관리하기
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                KYC 미승인
              </CardTitle>
              <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {pendingKyc}건
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                <UsersIcon className="h-3 w-3 mr-1" />
                신원 확인 대기
              </p>
              <Link href="/admin/kyc">
                <Button size="sm" variant="outline" className="mt-2 w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                  관리하기
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                상담 요청
              </CardTitle>
              <MessageSquareIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {supportRequests}건
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                <MessageSquareIcon className="h-3 w-3 mr-1" />
                고객 지원 대기
              </p>
              <Link href="/admin/support">
                <Button size="sm" variant="outline" className="mt-2 w-full border-purple-300 text-purple-700 hover:bg-purple-100">
                  관리하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 실시간 플래시 트레이드 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ActivityIcon className="h-5 w-5 mr-2" />
                실시간 플래시 트레이드 현황
              </CardTitle>
              <CardDescription>
                진행 중인 거래: {tradeStats.totalActiveTrades}건 | 
                총 투자액: ${tradeStats.totalActiveAmount?.toLocaleString() || '0'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTrades.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>사용자</TableHead>
                        <TableHead>금액</TableHead>
                        <TableHead>방향</TableHead>
                        <TableHead>남은 시간</TableHead>
                        <TableHead>진입가</TableHead>
                        <TableHead>현재가</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTrades.slice(0, 5).map((trade: any) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium">
                            {trade.users?.email?.split('@')[0] || 'User'}
                          </TableCell>
                          <TableCell>${trade.amount}</TableCell>
                          <TableCell>
                            <Badge variant={trade.direction === 'up' ? 'default' : 'destructive'}>
                              {trade.direction === 'up' ? (
                                <TrendingUpIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDownIcon className="h-3 w-3 mr-1" />
                              )}
                              {trade.direction.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {Math.max(0, Math.floor((new Date(trade.expires_at).getTime() - Date.now()) / 1000))}초
                            </div>
                          </TableCell>
                          <TableCell>${trade.entry_price?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>${trade.current_price?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {trade.status === 'active' ? '진행중' : trade.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    현재 진행 중인 플래시 트레이드가 없습니다.
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/flash-trade">
                  <Button variant="outline" className="w-full">
                    전체 플래시 트레이드 관리
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSignIcon className="h-5 w-5 mr-2" />
                거래 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">UP 거래</span>
                <div className="flex items-center">
                  <TrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                  <span className="font-medium">{tradeStats.upTrades}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">DOWN 거래</span>
                <div className="flex items-center">
                  <TrendingDownIcon className="h-4 w-4 text-red-600 mr-1" />
                  <span className="font-medium">{tradeStats.downTrades}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">총 활성 거래</span>
                <span className="font-bold">{tradeStats.totalActiveTrades}건</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 투자액</span>
                <span className="font-bold">${tradeStats.totalActiveAmount?.toLocaleString() || '0'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/users">
            <Button variant="outline" className="w-full h-16 flex flex-col">
              <UsersIcon className="h-5 w-5 mb-1" />
              사용자 관리
            </Button>
          </Link>
          <Link href="/admin/flash-trade-settings">
            <Button variant="outline" className="w-full h-16 flex flex-col">
              <ActivityIcon className="h-5 w-5 mb-1" />
              플래시 트레이드 설정
            </Button>
          </Link>
          <Link href="/admin/quant-ai-settings">
            <Button variant="outline" className="w-full h-16 flex flex-col">
              <ActivityIcon className="h-5 w-5 mb-1" />
              QuantAI 관리
            </Button>
          </Link>
          <Link href="/admin/deposits">
            <Button variant="outline" className="w-full h-16 flex flex-col">
              <ArrowDownToLineIcon className="h-5 w-5 mb-1" />
              입출금 관리
            </Button>
          </Link>
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}

export default AdminDashboardPage; 