'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Activity
} from "lucide-react";

function DashboardPage() {
  // 포맷팅 함수들
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <ClientOnly fallback={
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">로딩 중...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">---</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
            <p className="text-muted-foreground">
              포트폴리오 개요 및 거래 현황을 확인하세요
            </p>
          </div>
          <Button>
            새로고침
          </Button>
        </div>

        {/* 통계 카드들 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                총 포트폴리오 가치
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(45231.89)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{formatPercentage(20.1)}</span> 지난 달 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                일일 거래량
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(12234.56)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{formatPercentage(5.2)}</span> 어제 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                총 수익
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(5234.12)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{formatPercentage(12.5)}</span> 수익률
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                활성 포지션
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                3개 포지션 진행 중
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 최근 활동 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>최근 거래</CardTitle>
              <CardDescription>
                최근 거래 내역을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      매수
                    </Badge>
                    <div>
                      <p className="font-medium">BTC/USDT</p>
                      <p className="text-sm text-muted-foreground">0.5 BTC</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(42500)}</p>
                    <p className="text-sm text-muted-foreground">2시간 전</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      매도
                    </Badge>
                    <div>
                      <p className="font-medium">ETH/USDT</p>
                      <p className="text-sm text-muted-foreground">2.5 ETH</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(6250)}</p>
                    <p className="text-sm text-muted-foreground">5시간 전</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>포트폴리오 분포</CardTitle>
              <CardDescription>
                자산별 분포 현황
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Bitcoin (BTC)</span>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Ethereum (ETH)</span>
                  </div>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">USDT</span>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientOnly>
  );
}

export default DashboardPage; 