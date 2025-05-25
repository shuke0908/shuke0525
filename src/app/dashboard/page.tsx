'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Activity, 
  Target,
  Zap,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock
} from "lucide-react";
import { usePriceData } from "@/hooks/usePriceData";
import { QuickTradeModule } from "@/components/trading/QuickTradeModule";
import FlashTradeModule from "@/components/trading/FlashTradeModule";
import { QuantAIModule } from "@/components/QuantAIModule";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { prices, isConnected } = usePriceData();

  // Get dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/overview');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
  });

  // Get active positions
  const { data: positionsData } = useQuery({
    queryKey: ['dashboard', 'positions'],
    queryFn: async () => {
      const response = await fetch('/api/quick-trade/positions');
      if (!response.ok) throw new Error('Failed to fetch positions');
      return response.json();
    },
  });

  // Get recent trades
  const { data: tradesData } = useQuery({
    queryKey: ['dashboard', 'trades'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-trades');
      if (!response.ok) throw new Error('Failed to fetch trades');
      return response.json();
    },
  });

  const portfolioValue = dashboardData?.portfolioValue || "12,450.75";
  const dailyVolume = dashboardData?.dailyVolume || "8,234.50";
  const activePositions = positionsData?.positions?.length || 3;
  const totalProfit = dashboardData?.totalProfit || "+2,145.30";
  const profitPercentage = dashboardData?.profitPercentage || "+15.2%";

  const recentTrades = tradesData?.trades || [];
  const activePositionsList = positionsData?.positions || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your trading overview
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Live Market Data' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioValue}</div>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {profitPercentage} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dailyVolume}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePositions}</div>
            <p className="text-xs text-muted-foreground">
              2 profitable, 1 pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalProfit}</div>
            <p className="text-xs text-muted-foreground">
              This month's earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quick-trade">Quick Trade</TabsTrigger>
          <TabsTrigger value="flash-trade">Flash Trade</TabsTrigger>
          <TabsTrigger value="quant-ai">Quant AI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 실시간 시장 데이터 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Market Overview
                </CardTitle>
                <CardDescription>Real-time cryptocurrency prices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(prices).map(([symbol, price]) => (
                    <div key={symbol} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{symbol.split('/')[0]?.slice(0, 2) || 'BTC'}</span>
                        </div>
                        <div>
                          <div className="font-medium">{symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {symbol.split('/')[0]} / {symbol.split('/')[1]}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${price.toFixed(2)}</div>
                        <div className="text-sm text-green-600 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +2.4%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 활성 포지션 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Active Positions
                </CardTitle>
                <CardDescription>Your current trading positions</CardDescription>
              </CardHeader>
              <CardContent>
                {activePositionsList.length > 0 ? (
                  <div className="space-y-3">
                    {activePositionsList.slice(0, 3).map((position: any) => (
                      <div key={position.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={position.direction === 'long' ? 'default' : 'destructive'}>
                              {position.direction.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{position.asset}</span>
                          </div>
                          <div className={`text-sm font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.pnl >= 0 ? '+' : ''}${position.pnl}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>Amount: ${position.amount}</div>
                          <div>Entry: ${position.entryPrice}</div>
                          <div>Current: ${position.currentPrice}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Positions</h3>
                    <p className="text-muted-foreground text-sm">
                      Start trading to see your positions here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 최근 거래 내역 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Trades
              </CardTitle>
              <CardDescription>Your latest trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrades.slice(0, 5).map((trade: any) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.asset}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.amount}</TableCell>
                        <TableCell>${trade.price}</TableCell>
                        <TableCell className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                        </TableCell>
                        <TableCell>{new Date(trade.timestamp).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Recent Trades</h3>
                  <p className="text-muted-foreground text-sm">
                    Your trading history will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-trade">
          <QuickTradeModule />
        </TabsContent>

        <TabsContent value="flash-trade">
          <FlashTradeModule symbol="BTC/USDT" currentPrice={prices['BTC/USD']?.toString() || "43250.50"} />
        </TabsContent>

        <TabsContent value="quant-ai">
          <QuantAIModule />
        </TabsContent>
      </Tabs>
    </div>
  );
} 