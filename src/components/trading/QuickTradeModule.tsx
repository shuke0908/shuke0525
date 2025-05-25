'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface QuickTradeModuleProps {
  symbol?: string;
  currentPrice?: string;
}

export function QuickTradeModule({ symbol = "BTC/USDT", currentPrice = "41255.78" }: QuickTradeModuleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tradeData, setTradeData] = useState({
    symbol: symbol,
    amount: '',
    leverage: '1',
    direction: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit',
    limitPrice: ''
  });

  // Create trade mutation
  const tradeMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to trade');
      }

      const response = await fetch('/api/quick-trade', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Trade failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const result = data.data.result;
      const profit = data.data.profit;
      const isWin = result === 'win';
      
      toast({
        title: isWin ? "🎉 Trade Successful!" : "📉 Trade Completed",
        description: data.message,
        variant: isWin ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setTradeData(prev => ({ ...prev, amount: '', limitPrice: '' }));
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive",
      });
    },
  });

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tradeData.amount || parseFloat(tradeData.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount",
        variant: "destructive",
      });
      return;
    }

    if (tradeData.orderType === 'limit' && (!tradeData.limitPrice || parseFloat(tradeData.limitPrice) <= 0)) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid limit price",
        variant: "destructive",
      });
      return;
    }

    tradeMutation.mutate(tradeData);
  };

  const calculatePotentialProfit = () => {
    const amount = parseFloat(tradeData.amount) || 0;
    const leverage = parseFloat(tradeData.leverage) || 1;
    const price = parseFloat(currentPrice) || 0;
    
    if (amount > 0 && price > 0) {
      const position = (amount * leverage) / price;
      const priceChange = price * 0.01; // 1% price change
      return (position * priceChange).toFixed(2);
    }
    return '0.00';
  };

  const calculateMargin = () => {
    const amount = parseFloat(tradeData.amount) || 0;
    const leverage = parseFloat(tradeData.leverage) || 1;
    return (amount / leverage).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Quick Trade
        </CardTitle>
        <CardDescription>
          Execute instant trades with real-time market prices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTrade} className="space-y-6">
          {/* Trading Pair & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="symbol">Trading Pair</Label>
              <Select value={tradeData.symbol} onValueChange={(value) => setTradeData(prev => ({ ...prev, symbol: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trading pair" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                  <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                  <SelectItem value="XRP/USDT">XRP/USDT</SelectItem>
                  <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                  <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                  <SelectItem value="XAU/USD">XAU/USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Current Price</Label>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl font-bold">${currentPrice}</span>
                <Badge variant="default" className="text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +1.2%
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <Label>Order Type</Label>
            <Tabs value={tradeData.orderType} onValueChange={(value) => setTradeData(prev => ({ ...prev, orderType: value as 'market' | 'limit' }))}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="market">Market Order</TabsTrigger>
                <TabsTrigger value="limit">Limit Order</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Limit Price (only for limit orders) */}
          {tradeData.orderType === 'limit' && (
            <div>
              <Label htmlFor="limitPrice">Limit Price</Label>
              <Input
                id="limitPrice"
                type="number"
                step="0.01"
                placeholder="Enter limit price"
                value={tradeData.limitPrice}
                onChange={(e) => setTradeData(prev => ({ ...prev, limitPrice: e.target.value }))}
              />
            </div>
          )}

          {/* Trade Amount & Leverage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Trade Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="Enter amount"
                value={tradeData.amount}
                onChange={(e) => setTradeData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="leverage">Leverage</Label>
              <Select value={tradeData.leverage} onValueChange={(value) => setTradeData(prev => ({ ...prev, leverage: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1:1 (No Leverage)</SelectItem>
                  <SelectItem value="2">1:2</SelectItem>
                  <SelectItem value="5">1:5</SelectItem>
                  <SelectItem value="10">1:10</SelectItem>
                  <SelectItem value="20">1:20</SelectItem>
                  <SelectItem value="50">1:50</SelectItem>
                  <SelectItem value="100">1:100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trade Summary */}
          {tradeData.amount && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">Trade Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required Margin:</span>
                  <span className="font-medium">${calculateMargin()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential Profit (1%):</span>
                  <span className="font-medium text-green-600">+${calculatePotentialProfit()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leverage:</span>
                  <span className="font-medium">1:{tradeData.leverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Type:</span>
                  <span className="font-medium capitalize">{tradeData.orderType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Buy/Sell Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={tradeMutation.isPending}
              onClick={() => setTradeData(prev => ({ ...prev, direction: 'buy' }))}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {tradeMutation.isPending && tradeData.direction === 'buy' ? "Buying..." : "Buy / Long"}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={tradeMutation.isPending}
              onClick={() => setTradeData(prev => ({ ...prev, direction: 'sell' }))}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              {tradeMutation.isPending && tradeData.direction === 'sell' ? "Selling..." : "Sell / Short"}
            </Button>
          </div>

          {/* Risk Warning */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              ⚠️ <strong>Risk Warning:</strong> Trading with leverage involves substantial risk. 
              You may lose more than your initial investment. Only trade with money you can afford to lose.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
