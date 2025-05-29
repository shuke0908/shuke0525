'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Minus,
  ArrowRightLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type CoinBalance = {
  coin: string;
  symbol: string;
  balance: number;
  usdValue: number;
  currentPrice: number;
  priceChange24h: number;
  logo: string;
};

type WalletOverview = {
  totalAssetValue: number;
  totalAssetValueChange: number;
  totalAssetValueChangePercent: number;
  coinBalances: CoinBalance[];
};

function WalletOverviewPage() {
  const { user } = useAuth();

  // Get wallet overview data
  const { data: overviewData, isLoading, refetch } = useQuery({
    queryKey: ['wallet', 'overview'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to access wallet');

      const response = await fetch('/api/wallet/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch wallet overview');
      return response.json();
    },
    enabled: !!user,
  });

  const overview: WalletOverview = overviewData?.data || {
    totalAssetValue: 0,
    totalAssetValueChange: 0,
    totalAssetValueChangePercent: 0,
    coinBalances: []
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wallet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">지갑 개요</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>새로고침</span>
        </Button>
      </div>

      {/* Total Asset Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>총 자산 가치</span>
            {overview.totalAssetValueChangePercent >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>모든 보유 암호화폐의 총 평가액</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-4xl font-bold">
              ${formatCurrency(overview.totalAssetValue)}
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={overview.totalAssetValueChange >= 0 ? "default" : "destructive"}
                className="flex items-center space-x-1"
              >
                {overview.totalAssetValueChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  ${Math.abs(overview.totalAssetValueChange).toFixed(2)} 
                  ({overview.totalAssetValueChangePercent >= 0 ? '+' : ''}{overview.totalAssetValueChangePercent.toFixed(2)}%)
                </span>
              </Badge>
              <span className="text-sm text-muted-foreground">전일 대비</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/wallet/deposit">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowDownLeft className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">입금하기</h3>
                <p className="text-sm text-muted-foreground">암호화폐 입금</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/wallet/withdraw">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold">출금하기</h3>
                <p className="text-sm text-muted-foreground">암호화폐 출금</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/wallet/exchange">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowRightLeft className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">자산 변환</h3>
                <p className="text-sm text-muted-foreground">코인 간 교환</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Coin Balance List */}
      <Card>
        <CardHeader>
          <CardTitle>보유 자산</CardTitle>
          <CardDescription>현재 보유 중인 암호화폐 목록</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.coinBalances.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">보유 자산이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                암호화폐를 입금하여 거래를 시작하세요
              </p>
              <Link href="/dashboard/wallet/deposit">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 입금하기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {overview.coinBalances.map((coin) => (
                <div 
                  key={coin.symbol}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm">{coin.symbol}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{coin.coin}</h4>
                      <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold">{coin.balance.toFixed(8)}</p>
                    <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold">${coin.currentPrice.toFixed(2)}</p>
                    <div className="flex items-center space-x-1">
                      {coin.priceChange24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span 
                        className={`text-sm ${
                          coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">${coin.usdValue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">평가액</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletOverviewPage; 