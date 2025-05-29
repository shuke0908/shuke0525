'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Crown, 
  Star, 
  TrendingUp, 
  Gift,
  Zap,
  Shield,
  Clock,
  Percent,
  ArrowRight,
  CheckCircle,
  Lock,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

type VipLevel = {
  level: number;
  name: string;
  minTradeVolume: number;
  tradeFeeDiscount: number;
  withdrawalPriority: number;
  benefits: string[];
  color: string;
  icon: string;
};

type VipInfo = {
  currentLevel: number;
  currentLevelName: string;
  totalTradeVolume: number;
  nextLevelRequirement: number;
  progressToNext: number;
  tradeFeeDiscount: number;
  withdrawalPriority: number;
  specialBenefits: string[];
  vipLevels: VipLevel[];
};

function VipPage() {
  const { user } = useAuth();

  // Get VIP information
  const { data: vipData, isLoading } = useQuery({
    queryKey: ['vip', 'info'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access VIP info');

      const response = await fetch('/api/vip/info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch VIP info');
      return response.json();
    },
    enabled: !!user,
  });

  const vipInfo: VipInfo = vipData?.data || {
    currentLevel: 1,
    currentLevelName: 'Bronze',
    totalTradeVolume: 0,
    nextLevelRequirement: 10000,
    progressToNext: 0,
    tradeFeeDiscount: 0,
    withdrawalPriority: 0,
    specialBenefits: [],
    vipLevels: []
  };

  const getVipLevelColor = (level: number) => {
    const colors = {
      1: 'from-gray-400 to-gray-600',
      2: 'from-green-400 to-green-600',
      3: 'from-blue-400 to-blue-600',
      4: 'from-purple-400 to-purple-600',
      5: 'from-yellow-400 to-yellow-600'
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  const getVipLevelIcon = (level: number) => {
    if (level >= 5) return <Crown className="h-6 w-6" />;
    if (level >= 4) return <Sparkles className="h-6 w-6" />;
    if (level >= 3) return <Star className="h-6 w-6" />;
    if (level >= 2) return <Shield className="h-6 w-6" />;
    return <Badge className="h-6 w-6" />;
  };

  const getVipBadge = (level: number, name: string) => {
    return (
      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r ${getVipLevelColor(level)} text-white font-semibold`}>
        {getVipLevelIcon(level)}
        <span>VIP {level} - {name}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Crown className="h-8 w-8 text-yellow-600" />
        <h1 className="text-3xl font-bold">VIP 회원 정보</h1>
      </div>

      {/* Current VIP Status */}
      <Card className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${getVipLevelColor(vipInfo.currentLevel)} opacity-10`} />
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>현재 VIP 등급</span>
            {getVipBadge(vipInfo.currentLevel, vipInfo.currentLevelName)}
          </CardTitle>
          <CardDescription>
            회원님의 현재 VIP 등급과 혜택을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${formatCurrency(vipInfo.totalTradeVolume)}
              </div>
              <p className="text-sm text-muted-foreground">누적 거래량</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {vipInfo.tradeFeeDiscount}%
              </div>
              <p className="text-sm text-muted-foreground">거래 수수료 할인</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                우선순위 {vipInfo.withdrawalPriority}
              </div>
              <p className="text-sm text-muted-foreground">출금 처리 우선순위</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress to Next Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>다음 등급까지</span>
            </CardTitle>
            <CardDescription>
              다음 VIP 등급 달성을 위한 진행 상황
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vipInfo.currentLevel < 5 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    VIP {vipInfo.currentLevel + 1} 달성까지
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {vipInfo.progressToNext.toFixed(1)}%
                  </span>
                </div>
                
                <Progress value={vipInfo.progressToNext} className="w-full" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>현재 거래량</span>
                    <span className="font-semibold">
                      ${formatCurrency(vipInfo.totalTradeVolume)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>필요 거래량</span>
                    <span className="font-semibold">
                      ${formatCurrency(vipInfo.nextLevelRequirement)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>추가 필요 거래량</span>
                    <span className="font-semibold">
                      ${formatCurrency(vipInfo.nextLevelRequirement - vipInfo.totalTradeVolume)}
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/dashboard/trade/flash'}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  거래하러 가기
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">최고 등급 달성!</h3>
                <p className="text-muted-foreground">
                  축하합니다! 최고 VIP 등급에 도달하셨습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-purple-500" />
              <span>현재 혜택</span>
            </CardTitle>
            <CardDescription>
              현재 VIP 등급에서 제공되는 혜택
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Percent className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold">거래 수수료 할인</h4>
                  <p className="text-sm text-muted-foreground">
                    모든 거래에서 {vipInfo.tradeFeeDiscount}% 할인
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold">출금 우선 처리</h4>
                  <p className="text-sm text-muted-foreground">
                    우선순위 {vipInfo.withdrawalPriority}로 빠른 출금 처리
                  </p>
                </div>
              </div>

              {vipInfo.specialBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Star className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className="font-semibold">특별 혜택</h4>
                    <p className="text-sm text-muted-foreground">{benefit}</p>
                  </div>
                </div>
              ))}

              {vipInfo.currentLevel >= 3 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold">전담 고객 지원</h4>
                    <p className="text-sm text-muted-foreground">
                      VIP 전용 고객 지원 서비스
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All VIP Levels */}
      <Card>
        <CardHeader>
          <CardTitle>VIP 등급별 혜택</CardTitle>
          <CardDescription>
            모든 VIP 등급의 혜택을 비교해보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vipInfo.vipLevels.map((level) => (
              <Card 
                key={level.level}
                className={`relative overflow-hidden ${
                  level.level === vipInfo.currentLevel 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${getVipLevelColor(level.level)} opacity-5`} />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getVipLevelIcon(level.level)}
                      <span>VIP {level.level}</span>
                    </div>
                    {level.level === vipInfo.currentLevel && (
                      <Badge variant="default">현재</Badge>
                    )}
                    {level.level > vipInfo.currentLevel && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription className="font-semibold text-lg">
                    {level.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="font-semibold">필요 거래량:</span>
                    <br />
                    ${formatCurrency(level.minTradeVolume)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Percent className="h-4 w-4 text-green-500" />
                      <span>수수료 할인: {level.tradeFeeDiscount}%</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>출금 우선순위: {level.withdrawalPriority}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-semibold text-sm">특별 혜택:</h5>
                    {level.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {level.level > vipInfo.currentLevel && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.location.href = '/dashboard/trade/flash'}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        달성하기
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* VIP Program Info */}
      <Card>
        <CardHeader>
          <CardTitle>VIP 프로그램 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">VIP 등급 산정 기준</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>누적 거래량을 기준으로 등급이 결정됩니다</li>
                <li>모든 거래 유형(Flash Trade, Quick Trade, Quant AI)이 포함됩니다</li>
                <li>등급은 실시간으로 업데이트됩니다</li>
                <li>한 번 달성한 등급은 유지됩니다</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">혜택 적용</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>수수료 할인은 즉시 적용됩니다</li>
                <li>출금 우선 처리는 다음 출금부터 적용됩니다</li>
                <li>특별 혜택은 등급 달성 후 24시간 내 활성화됩니다</li>
                <li>VIP 전용 서비스는 별도 안내를 통해 제공됩니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VipPage; 