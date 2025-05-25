'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Clock, TrendingUp, BarChart4, CandlestickChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import FlashTradeModule from "@/components/trading/FlashTradeModule";

type FlashTradeHistory = {
  id: number;
  amount: string;
  direction: 'up' | 'down';
  duration: number;
  returnRate: string;
  entryPrice: string;
  exitPrice?: string;
  potentialProfit: string;
  status: 'win' | 'lose';
  startTime: string;
  endTime?: string;
};

export default function FlashTradePage() {
  const [activeSymbol, setActiveSymbol] = useState("BTC/USDT");
  const [marketType, setMarketType] = useState<"crypto" | "forex" | "metals">("crypto");
  
  // Available markets based on market type
  const markets = {
    crypto: ["BTC/USDT", "ETH/USDT", "BNB/USDT", "XRP/USDT", "SOL/USDT", "ADA/USDT", "AVAX/USDT"],
    forex: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "AUD/USD", "NZD/USD", "USD/CHF"],
    metals: ["XAU/USD", "XAG/USD", "PLAT/USD", "PALL/USD"]
  };
  
  // Get flash trade history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/flash-trade/history'],
  });
  
  const tradeHistory: FlashTradeHistory[] = 
    historyData && typeof historyData === 'object' && 'trades' in historyData 
      ? (Array.isArray(historyData.trades) ? historyData.trades as FlashTradeHistory[] : []) 
      : [];
  
  // Render functions to keep JSX cleaner
  const renderTradeTable = (trades: FlashTradeHistory[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Direction</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Return</TableHead>
          <TableHead className="text-right">Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell>Flash</TableCell>
            <TableCell>
              <Badge variant={trade.direction === 'up' ? "default" : "destructive"}>
                {trade.direction === 'up' ? 'UP' : 'DOWN'}
              </Badge>
            </TableCell>
            <TableCell>${parseFloat(trade.amount).toFixed(2)}</TableCell>
            <TableCell>{trade.duration}s</TableCell>
            <TableCell>
              {trade.status === 'win' 
                ? `+$${(parseFloat(trade.amount) * parseFloat(trade.returnRate) / 100).toFixed(2)}` 
                : `-$${parseFloat(trade.amount).toFixed(2)}`}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={trade.status === 'win' ? "default" : "destructive"}>
                {trade.status === 'win' ? 'WIN' : 'LOSS'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderEmptyState = (message: string) => (
    <div className="text-center py-8">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Flash Trade</h1>
        <p className="text-muted-foreground">Make timed trades with preset returns</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Market Type & Symbol Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Market Selection</CardTitle>
            <CardDescription>Select market type and trading pair</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Market Type</label>
                <Tabs defaultValue={marketType} onValueChange={(v) => setMarketType(v as "crypto" | "forex" | "metals")}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="crypto">Crypto</TabsTrigger>
                    <TabsTrigger value="forex">Forex</TabsTrigger>
                    <TabsTrigger value="metals">Metals</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Trading Pair</label>
                <Select value={activeSymbol} onValueChange={setActiveSymbol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trading pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {markets[marketType].map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Price Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{activeSymbol} Chart</CardTitle>
                <CardDescription>Real-time price movements</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$41,255.78</div>
                <div className="text-xs text-green-600 flex items-center justify-end">
                  <span className="mr-1">+1.2%</span>
                  <TrendingUp className="h-3 w-3" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-[300px] rounded-lg flex items-center justify-center">
              <div className="text-center">
                <CandlestickChart className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Price chart will be displayed here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connecting to market data...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Return</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">30-180s</div>
              <p className="text-xs text-muted-foreground">
                Returns up to 150% in just 3 minutes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68.2%</div>
              <p className="text-xs text-muted-foreground">
                Based on your last 30 trades
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Performing</CardTitle>
              <BarChart4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120s UP</div>
              <p className="text-xs text-muted-foreground">
                75% win rate in the last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Flash Trade Module */}
        <FlashTradeModule symbol={activeSymbol} currentPrice="41255.78" />
        
        {/* Trade History */}
        <Card>
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
            <CardDescription>Your recent Flash Trade activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Trades</TabsTrigger>
                <TabsTrigger value="wins">Wins</TabsTrigger>
                <TabsTrigger value="losses">Losses</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                {historyLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : tradeHistory.length > 0 ? (
                  renderTradeTable(tradeHistory)
                ) : (
                  renderEmptyState("No trades found. Start trading to see your history here.")
                )}
              </TabsContent>
              <TabsContent value="wins" className="mt-4">
                {historyLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : tradeHistory.filter(t => t.status === 'win').length > 0 ? (
                  renderTradeTable(tradeHistory.filter(t => t.status === 'win'))
                ) : (
                  renderEmptyState("No winning trades yet. Keep trading!")
                )}
              </TabsContent>
              <TabsContent value="losses" className="mt-4">
                {historyLoading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : tradeHistory.filter(t => t.status === 'lose').length > 0 ? (
                  renderTradeTable(tradeHistory.filter(t => t.status === 'lose'))
                ) : (
                  renderEmptyState("No losing trades. Great job!")
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 